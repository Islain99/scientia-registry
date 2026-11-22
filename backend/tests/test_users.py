"""
Tests d'intégration pour routers/users.py.
Couvre : favoris, progression, liste utilisateurs (admin), mise à jour de rôle.
"""

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from conftest import _create_entry


# ── POST /users/me/favorites/{entry_id} ──────────────────────────────────────

class TestFavorites:
    @pytest.mark.asyncio
    async def test_add_favorite_success(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        res = await client.post(
            f"/users/me/favorites/{active_entry['_id']}",
            headers=student_user["headers"],
        )
        assert res.status_code == 204

    @pytest.mark.asyncio
    async def test_add_same_favorite_twice_idempotent(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        """$addToSet garantit l'idempotence."""
        await client.post(
            f"/users/me/favorites/{active_entry['_id']}",
            headers=student_user["headers"],
        )
        res = await client.post(
            f"/users/me/favorites/{active_entry['_id']}",
            headers=student_user["headers"],
        )
        assert res.status_code == 204

    @pytest.mark.asyncio
    async def test_get_favorites_contains_added_id(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        await client.post(
            f"/users/me/favorites/{active_entry['_id']}",
            headers=student_user["headers"],
        )
        res = await client.get("/users/me/favorites", headers=student_user["headers"])
        assert res.status_code == 200
        assert active_entry["_id"] in res.json()

    @pytest.mark.asyncio
    async def test_remove_favorite_success(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        await client.post(
            f"/users/me/favorites/{active_entry['_id']}",
            headers=student_user["headers"],
        )
        res = await client.delete(
            f"/users/me/favorites/{active_entry['_id']}",
            headers=student_user["headers"],
        )
        assert res.status_code == 204

    @pytest.mark.asyncio
    async def test_favorites_empty_after_remove(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        await client.post(
            f"/users/me/favorites/{active_entry['_id']}",
            headers=student_user["headers"],
        )
        await client.delete(
            f"/users/me/favorites/{active_entry['_id']}",
            headers=student_user["headers"],
        )
        res = await client.get("/users/me/favorites", headers=student_user["headers"])
        assert active_entry["_id"] not in res.json()

    @pytest.mark.asyncio
    async def test_favorites_unauthenticated(self, client: AsyncClient):
        res = await client.get("/users/me/favorites")
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_multiple_favorites(
        self,
        client: AsyncClient,
        student_user: dict,
        test_db: AsyncIOMotorDatabase,
    ):
        entries = [
            await _create_entry(test_db, created_by=student_user["id"],
                                title=f"Concept {i}", status="active")
            for i in range(3)
        ]
        for e in entries:
            await client.post(
                f"/users/me/favorites/{e['_id']}",
                headers=student_user["headers"],
            )
        res = await client.get("/users/me/favorites", headers=student_user["headers"])
        favorites = res.json()
        for e in entries:
            assert e["_id"] in favorites


# ── GET /users/me/progress + PUT /users/me/progress/{entry_id} ───────────────

class TestProgress:
    @pytest.mark.asyncio
    async def test_get_progress_empty_initially(
        self, client: AsyncClient, student_user: dict
    ):
        res = await client.get("/users/me/progress", headers=student_user["headers"])
        assert res.status_code == 200
        assert res.json() == {}

    @pytest.mark.asyncio
    async def test_update_progress_success(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        res = await client.put(
            f"/users/me/progress/{active_entry['_id']}",
            json={"status": 1},  # IN_PROGRESS
            headers=student_user["headers"],
        )
        assert res.status_code == 200
        data = res.json()
        assert data["entry_id"] == active_entry["_id"]
        assert data["status"] == 1
        assert "last_updated" in data

    @pytest.mark.asyncio
    async def test_progress_persisted_after_update(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        await client.put(
            f"/users/me/progress/{active_entry['_id']}",
            json={"status": 2},  # UNDERSTOOD
            headers=student_user["headers"],
        )
        res = await client.get("/users/me/progress", headers=student_user["headers"])
        assert res.status_code == 200
        progress = res.json()
        assert active_entry["_id"] in progress
        assert progress[active_entry["_id"]]["status"] == 2

    @pytest.mark.asyncio
    async def test_update_progress_invalid_status(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        res = await client.put(
            f"/users/me/progress/{active_entry['_id']}",
            json={"status": 99},  # Valeur inexistante
            headers=student_user["headers"],
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_progress_overwrite(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        """Mettre à jour le même concept deux fois écrase l'ancienne valeur."""
        await client.put(
            f"/users/me/progress/{active_entry['_id']}",
            json={"status": 1},
            headers=student_user["headers"],
        )
        await client.put(
            f"/users/me/progress/{active_entry['_id']}",
            json={"status": 2},
            headers=student_user["headers"],
        )
        progress = (
            await client.get("/users/me/progress", headers=student_user["headers"])
        ).json()
        assert progress[active_entry["_id"]]["status"] == 2

    @pytest.mark.asyncio
    async def test_progress_unauthenticated(self, client: AsyncClient):
        res = await client.get("/users/me/progress")
        assert res.status_code == 401


# ── GET /users (admin only) ───────────────────────────────────────────────────

class TestListUsers:
    @pytest.mark.asyncio
    async def test_admin_can_list_users(
        self, client: AsyncClient, admin_user: dict, student_user: dict
    ):
        res = await client.get("/users", headers=admin_user["headers"])
        assert res.status_code == 200
        emails = [u["email"] for u in res.json()]
        assert admin_user["email"] in emails
        assert student_user["email"] in emails

    @pytest.mark.asyncio
    async def test_student_cannot_list_users(
        self, client: AsyncClient, student_user: dict
    ):
        res = await client.get("/users", headers=student_user["headers"])
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_teacher_cannot_list_users(
        self, client: AsyncClient, teacher_user: dict
    ):
        res = await client.get("/users", headers=teacher_user["headers"])
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_list_users_no_passwords(
        self, client: AsyncClient, admin_user: dict
    ):
        users = (await client.get("/users", headers=admin_user["headers"])).json()
        for u in users:
            assert "hashed_password" not in u


# ── PATCH /users/{user_id}/role ───────────────────────────────────────────────

class TestUpdateRole:
    @pytest.mark.asyncio
    async def test_admin_promotes_student_to_teacher(
        self,
        client: AsyncClient,
        admin_user: dict,
        student_user: dict,
    ):
        res = await client.patch(
            f"/users/{student_user['id']}/role",
            json={"role": "teacher"},
            headers=admin_user["headers"],
        )
        assert res.status_code == 200
        assert res.json()["role"] == "teacher"

    @pytest.mark.asyncio
    async def test_student_cannot_change_role(
        self,
        client: AsyncClient,
        student_user: dict,
        teacher_user: dict,
    ):
        res = await client.patch(
            f"/users/{teacher_user['id']}/role",
            json={"role": "admin"},
            headers=student_user["headers"],
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_invalid_role_rejected(
        self, client: AsyncClient, admin_user: dict, student_user: dict
    ):
        res = await client.patch(
            f"/users/{student_user['id']}/role",
            json={"role": "superadmin"},
            headers=admin_user["headers"],
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_update_role_nonexistent_user(
        self, client: AsyncClient, admin_user: dict
    ):
        res = await client.patch(
            "/users/000000000000000000000000/role",
            json={"role": "teacher"},
            headers=admin_user["headers"],
        )
        assert res.status_code == 404
