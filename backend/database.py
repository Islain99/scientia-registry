from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import settings

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    _db = _client[settings.MONGODB_DB]
    # Create indexes on startup
    await _db["users"].create_index("email", unique=True)
    await _db["entries"].create_index("discipline")
    await _db["entries"].create_index("level")
    await _db["entries"].create_index("status")
    await _db["entries"].create_index([("title", "text"), ("keywords", "text")])
    print(f"[DB] Connected to MongoDB — database: {settings.MONGODB_DB}")


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        print("[DB] MongoDB connection closed.")


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not initialised. Call connect_db() first.")
    return _db
