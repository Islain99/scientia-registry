"""
Tests d'intégration pour routers/auth.py.
Couvre : register, login, refresh, /me, setup-admin.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from conftest import _create_user
from models.user import UserRole
from services.auth_service import create_access_token, hash_password


# ── POST /auth/register ───────────────────────────────────────────────────────

class TestRegister:
    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient):
        res = await client.post("/auth/register", json={
            "name": "Alice Dupont",
            "email": "alice@example.com",
            "password": "Secret1234!",
        })
        assert res.status_code == 201
        data = res.json()
        assert data["email"] == "alice@example.com"
        assert data["name"] == "Alice Dupont"
        assert data["role"] == "student"
        assert "id" in data
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        payload = {"name": "Bob", "email": "bob@example.com", "password": "Secret1234!"}
        await client.post("/auth/register", json=payload)
        res = await client.post("/auth/register", json=payload)
        assert res.status_code == 409

    @pytest.mark.asyncio
    async def test_register_missing_name(self, client: AsyncClient):
        res = await client.post("/auth/register", json={
            "email": "noemail@example.com",
            "password": "Secret1234!",
        })
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        res = await client.post("/auth/register", json={
            "name": "Charlie",
            "email": "pas-un-email",
            "password": "Secret1234!",
        })
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_register_password_too_short(self, client: AsyncClient):
        res = await client.post("/auth/register", json={
            "name": "Dave",
            "email": "dave@example.com",
            "password": "123",
        })
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_register_name_too_short(self, client: AsyncClient):
        res = await client.post("/auth/register", json={
            "name": "X",
            "email": "x@example.com",
            "password": "Secret1234!",
        })
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_register_default_role_is_student(self, client: AsyncClient):
        res = await client.post("/auth/register", json={
            "name": "Eve",
            "email": "eve@example.com",
            "password": "Secret1234!",
        })
        assert res.json()["role"] == "student"


# ── POST /auth/login ──────────────────────────────────────────────────────────

class TestLogin:
    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, student_user: dict):
        res = await client.post("/auth/login", json={
            "email": student_user["email"],
            "password": student_user["password"],
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, student_user: dict):
        res = await client.post("/auth/login", json={
            "email": student_user["email"],
            "password": "MauvaisMotDePasse!",
        })
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_login_unknown_email(self, client: AsyncClient):
        res = await client.post("/auth/login", json={
            "email": "inconnu@example.com",
            "password": "Secret1234!",
        })
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_login_inactive_account(
        self, client: AsyncClient, test_db: AsyncIOMotorDatabase
    ):
        from bson import ObjectId
        from time import time
        now = int(time() * 1000)
        await test_db["users"].insert_one({
            "name": "Désactivé",
            "email": "desactive@example.com",
            "hashed_password": hash_password("Secret1234!"),
            "role": UserRole.STUDENT,
            "favorites": [], "progress": {},
            "created_at": now, "updated_at": now,
            "is_active": False,
        })
        res = await client.post("/auth/login", json={
            "email": "desactive@example.com",
            "password": "Secret1234!",
        })
        assert res.status_code == 403


# ── POST /auth/refresh ────────────────────────────────────────────────────────

class TestRefresh:
    @pytest.mark.asyncio
    async def test_refresh_success(self, client: AsyncClient, student_user: dict):
        # Login pour obtenir les tokens
        login = await client.post("/auth/login", json={
            "email": student_user["email"],
            "password": student_user["password"],
        })
        refresh_token = login.json()["refresh_token"]

        res = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_refresh_invalid_token(self, client: AsyncClient):
        res = await client.post("/auth/refresh", json={"refresh_token": "token.invalide"})
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_with_access_token_fails(
        self, client: AsyncClient, student_user: dict
    ):
        """Un access token passé comme refresh token doit être refusé."""
        res = await client.post(
            "/auth/refresh",
            json={"refresh_token": student_user["token"]},
        )
        assert res.status_code == 401


# ── GET /auth/me ──────────────────────────────────────────────────────────────

class TestMe:
    @pytest.mark.asyncio
    async def test_me_authenticated(self, client: AsyncClient, student_user: dict):
        res = await client.get("/auth/me", headers=student_user["headers"])
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == student_user["email"]
        assert data["role"] == "student"
        assert "hashed_password" not in data

    @pytest.mark.asyncio
    async def test_me_unauthenticated(self, client: AsyncClient):
        res = await client.get("/auth/me")
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_me_invalid_token(self, client: AsyncClient):
        res = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer token.invalide"},
        )
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_me_returns_favorites(self, client: AsyncClient, student_user: dict):
        data = (await client.get("/auth/me", headers=student_user["headers"])).json()
        assert isinstance(data["favorites"], list)


# ── POST /auth/setup-admin ────────────────────────────────────────────────────

class TestSetupAdmin:
    @pytest.mark.asyncio
    async def test_setup_admin_success(self, client: AsyncClient, student_user: dict):
        """Premier appel : promeut l'utilisateur en admin."""
        res = await client.post("/auth/setup-admin", headers=student_user["headers"])
        assert res.status_code == 200
        assert res.json()["role"] == "admin"

    @pytest.mark.asyncio
    async def test_setup_admin_blocked_when_admin_exists(
        self, client: AsyncClient, student_user: dict, admin_user: dict
    ):
        """Si un admin existe déjà, le endpoint est bloqué."""
        res = await client.post("/auth/setup-admin", headers=student_user["headers"])
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_setup_admin_unauthenticated(self, client: AsyncClient):
        res = await client.post("/auth/setup-admin")
        assert res.status_code == 401
