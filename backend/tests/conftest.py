"""
Shared fixtures for all backend tests.

Chaque test reçoit :
  - test_db   : base MongoDB dédiée aux tests (scientia_test), vidée après chaque test
  - client    : AsyncClient FastAPI avec get_db surchargé → test_db
  - admin_user / teacher_user / student_user : utilisateurs préinsérés + JWT
"""

import asyncio
import os
import sys
from time import time
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from bson import ObjectId
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

# ── Rendre le dossier backend/ importable ────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import get_db
from main import app
from models.user import UserRole
from services.auth_service import create_access_token, hash_password

# ── Config test DB ────────────────────────────────────────────────────────────

TEST_MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
TEST_MONGODB_DB  = os.getenv("MONGODB_TEST_DB", "scientia_test")


# ── Event loop (session-scoped) ───────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    """Event loop partagé pour toute la session de tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


# ── Base de données test ──────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Base MongoDB de test isolée — collections vidées après chaque test."""
    client = AsyncIOMotorClient(TEST_MONGODB_URL)
    db = client[TEST_MONGODB_DB]
    yield db
    # Nettoyage systématique après chaque test
    await db["users"].drop()
    await db["entries"].drop()
    client.close()


# ── Client HTTP ───────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncIOMotorDatabase) -> AsyncGenerator[AsyncClient, None]:
    """AsyncClient FastAPI dont get_db est surchargé par la base test."""
    app.dependency_overrides[get_db] = lambda: test_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _create_user(
    db: AsyncIOMotorDatabase,
    *,
    name: str,
    email: str,
    password: str,
    role: UserRole,
) -> dict:
    now = int(time() * 1000)
    result = await db["users"].insert_one(
        {
            "name": name,
            "email": email,
            "hashed_password": hash_password(password),
            "role": role,
            "favorites": [],
            "progress": {},
            "created_at": now,
            "updated_at": now,
            "is_active": True,
        }
    )
    user_id = str(result.inserted_id)
    token = create_access_token(user_id, role)
    return {
        "id": user_id,
        "name": name,
        "email": email,
        "password": password,
        "role": role,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


async def _create_entry(
    db: AsyncIOMotorDatabase,
    *,
    created_by: str,
    title: str = "Deuxième loi de Newton",
    discipline: str = "Physique",
    level: str = "Secondaire",
    type_: str = "Formule",
    status: str = "active",
) -> dict:
    now = int(time() * 1000)
    doc = {
        "title": title,
        "discipline": discipline,
        "sub_discipline": None,
        "level": level,
        "type": type_,
        "definition": "La force est égale à la masse multipliée par l'accélération.",
        "statement": "F = ma",
        "context": "",
        "examples": [],
        "exercises": [],
        "keywords": ["force", "masse", "accélération"],
        "references": [],
        "related_ids": [],
        "created_by": created_by,
        "last_modified_by": created_by,
        "created_at": now,
        "updated_at": now,
        "status": status,
        "origin": "manual",
        "version": 1,
    }
    result = await db["entries"].insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


# ── Fixtures utilisateurs ─────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def admin_user(test_db: AsyncIOMotorDatabase) -> dict:
    return await _create_user(
        test_db, name="Admin", email="admin@test.com",
        password="Admin1234!", role=UserRole.ADMIN,
    )


@pytest_asyncio.fixture
async def teacher_user(test_db: AsyncIOMotorDatabase) -> dict:
    return await _create_user(
        test_db, name="Teacher", email="teacher@test.com",
        password="Teacher1234!", role=UserRole.TEACHER,
    )


@pytest_asyncio.fixture
async def student_user(test_db: AsyncIOMotorDatabase) -> dict:
    return await _create_user(
        test_db, name="Student", email="student@test.com",
        password="Student1234!", role=UserRole.STUDENT,
    )


# ── Fixture entrée active ────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def active_entry(test_db: AsyncIOMotorDatabase, teacher_user: dict) -> dict:
    return await _create_entry(
        test_db, created_by=teacher_user["id"], status="active"
    )


@pytest_asyncio.fixture
async def draft_entry(test_db: AsyncIOMotorDatabase, teacher_user: dict) -> dict:
    return await _create_entry(
        test_db, created_by=teacher_user["id"],
        title="Loi de Hooke", status="draft"
    )
