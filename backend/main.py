from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import connect_db, close_db
from config import settings
from routers import auth, entries, users, ai


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Scientia Registry API",
    description="Backend de l'application de registre de connaissances scientifiques.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,    prefix="/auth",    tags=["Auth"])
app.include_router(entries.router, prefix="/entries", tags=["Entries"])
app.include_router(users.router,   prefix="/users",   tags=["Users"])
app.include_router(ai.router,      prefix="/ai",      tags=["AI"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "scientia-registry", "version": "1.0.0"}
