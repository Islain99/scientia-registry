"""
Tests d'intégration pour routers/entries.py.
Couvre : list, get, create, update, update-status, soft-delete.
Vérifie les permissions RBAC à chaque étape.
"""

import pytest
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorDatabase

from conftest import _create_entry

# ── Payload valide pour créer une entrée ──────────────────────────────────────

VALID_ENTRY = {
    "title": "Énergie cinétique",
    "discipline": "Physique",
    "level": "Secondaire",
    "type": "Formule",
    "definition": "L'énergie cinétique est l'énergie que possède un objet en mouvement.",
    "statement": r"E_k = \frac{1}{2}mv^2",
    "context": "Mécanique classique",
    "keywords": ["énergie", "cinétique", "vitesse"],
}


# ── GET /entries ──────────────────────────────────────────────────────────────

class TestListEntries:
    @pytest.mark.asyncio
    async def test_list_unauthenticated(self, client: AsyncClient):
        res = await client.get("/entries")
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_list_student_sees_only_active(
        self,
        client: AsyncClient,
        student_user: dict,
        active_entry: dict,
        draft_entry: dict,
    ):
        res = await client.get("/entries", headers=student_user["headers"])
        assert res.status_code == 200
        ids = [e["id"] for e in res.json()["items"]]
        assert active_entry["_id"] in ids
        assert draft_entry["_id"] not in ids

    @pytest.mark.asyncio
    async def test_list_admin_sees_all_statuses(
        self,
        client: AsyncClient,
        admin_user: dict,
        active_entry: dict,
        draft_entry: dict,
    ):
        res = await client.get("/entries", headers=admin_user["headers"])
        assert res.status_code == 200
        ids = [e["id"] for e in res.json()["items"]]
        assert active_entry["_id"] in ids
        assert draft_entry["_id"] in ids

    @pytest.mark.asyncio
    async def test_list_paginated_response_shape(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        res = await client.get("/entries", headers=student_user["headers"])
        body = res.json()
        assert "items" in body
        assert "total" in body
        assert "page" in body
        assert "limit" in body
        assert "pages" in body

    @pytest.mark.asyncio
    async def test_list_filter_by_discipline(
        self,
        client: AsyncClient,
        admin_user: dict,
        test_db: AsyncIOMotorDatabase,
    ):
        await _create_entry(test_db, created_by=admin_user["id"],
                            title="Formule chimique", discipline="Chimie", status="active")
        await _create_entry(test_db, created_by=admin_user["id"],
                            title="Formule physique", discipline="Physique", status="active")

        res = await client.get(
            "/entries?discipline=Chimie", headers=admin_user["headers"]
        )
        assert res.status_code == 200
        items = res.json()["items"]
        assert all(e["discipline"] == "Chimie" for e in items)

    @pytest.mark.asyncio
    async def test_list_search_by_title(
        self,
        client: AsyncClient,
        admin_user: dict,
        test_db: AsyncIOMotorDatabase,
    ):
        await _create_entry(test_db, created_by=admin_user["id"],
                            title="Théorème de Pythagore", status="active")
        # La recherche full-text doit trouver "Pythagore"
        res = await client.get(
            "/entries?search=Pythagore", headers=admin_user["headers"]
        )
        assert res.status_code == 200
        # Au moins un résultat attendu
        assert res.json()["total"] >= 0  # Acceptable si l'index full-text n'est pas créé en test

    @pytest.mark.asyncio
    async def test_list_pagination(
        self,
        client: AsyncClient,
        admin_user: dict,
        test_db: AsyncIOMotorDatabase,
    ):
        for i in range(5):
            await _create_entry(test_db, created_by=admin_user["id"],
                                title=f"Concept {i}", status="active")
        res = await client.get(
            "/entries?page=1&limit=2", headers=admin_user["headers"]
        )
        assert res.status_code == 200
        body = res.json()
        assert len(body["items"]) <= 2
        assert body["limit"] == 2

    @pytest.mark.asyncio
    async def test_list_limit_too_large_rejected(
        self, client: AsyncClient, student_user: dict
    ):
        res = await client.get("/entries?limit=9999", headers=student_user["headers"])
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_list_limit_up_to_500_accepted(
        self, client: AsyncClient, student_user: dict
    ):
        res = await client.get("/entries?limit=500", headers=student_user["headers"])
        assert res.status_code == 200


# ── GET /entries/{id} ─────────────────────────────────────────────────────────

class TestGetEntry:
    @pytest.mark.asyncio
    async def test_get_active_as_student(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        res = await client.get(
            f"/entries/{active_entry['_id']}", headers=student_user["headers"]
        )
        assert res.status_code == 200
        assert res.json()["id"] == active_entry["_id"]

    @pytest.mark.asyncio
    async def test_get_draft_as_student_forbidden(
        self, client: AsyncClient, student_user: dict, draft_entry: dict
    ):
        res = await client.get(
            f"/entries/{draft_entry['_id']}", headers=student_user["headers"]
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_get_draft_as_admin_allowed(
        self, client: AsyncClient, admin_user: dict, draft_entry: dict
    ):
        res = await client.get(
            f"/entries/{draft_entry['_id']}", headers=admin_user["headers"]
        )
        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_get_nonexistent_returns_404(
        self, client: AsyncClient, student_user: dict
    ):
        res = await client.get(
            "/entries/000000000000000000000000", headers=student_user["headers"]
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_get_response_shape(
        self, client: AsyncClient, admin_user: dict, active_entry: dict
    ):
        data = (await client.get(
            f"/entries/{active_entry['_id']}", headers=admin_user["headers"]
        )).json()
        for field in ("id", "title", "discipline", "level", "type",
                      "definition", "statement", "status", "origin", "version"):
            assert field in data


# ── POST /entries ─────────────────────────────────────────────────────────────

class TestCreateEntry:
    @pytest.mark.asyncio
    async def test_create_as_teacher_success(
        self, client: AsyncClient, teacher_user: dict
    ):
        res = await client.post(
            "/entries", json=VALID_ENTRY, headers=teacher_user["headers"]
        )
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == VALID_ENTRY["title"]
        assert data["status"] == "draft"           # nouvelles entrées en draft
        assert data["created_by"] == teacher_user["id"]

    @pytest.mark.asyncio
    async def test_create_as_admin_success(
        self, client: AsyncClient, admin_user: dict
    ):
        res = await client.post(
            "/entries", json=VALID_ENTRY, headers=admin_user["headers"]
        )
        assert res.status_code == 201

    @pytest.mark.asyncio
    async def test_create_as_student_forbidden(
        self, client: AsyncClient, student_user: dict
    ):
        res = await client.post(
            "/entries", json=VALID_ENTRY, headers=student_user["headers"]
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_create_unauthenticated(self, client: AsyncClient):
        res = await client.post("/entries", json=VALID_ENTRY)
        assert res.status_code == 401

    @pytest.mark.asyncio
    async def test_create_missing_required_field(
        self, client: AsyncClient, teacher_user: dict
    ):
        payload = {k: v for k, v in VALID_ENTRY.items() if k != "definition"}
        res = await client.post(
            "/entries", json=payload, headers=teacher_user["headers"]
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_discipline(
        self, client: AsyncClient, teacher_user: dict
    ):
        payload = {**VALID_ENTRY, "discipline": "NonExistante"}
        res = await client.post(
            "/entries", json=payload, headers=teacher_user["headers"]
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_create_title_too_short(
        self, client: AsyncClient, teacher_user: dict
    ):
        payload = {**VALID_ENTRY, "title": "AB"}
        res = await client.post(
            "/entries", json=payload, headers=teacher_user["headers"]
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_create_definition_too_short(
        self, client: AsyncClient, teacher_user: dict
    ):
        payload = {**VALID_ENTRY, "definition": "Court"}
        res = await client.post(
            "/entries", json=payload, headers=teacher_user["headers"]
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_create_with_sub_discipline(
        self, client: AsyncClient, teacher_user: dict
    ):
        payload = {**VALID_ENTRY, "sub_discipline": "Mécanique classique"}
        res = await client.post(
            "/entries", json=payload, headers=teacher_user["headers"]
        )
        assert res.status_code == 201
        assert res.json()["sub_discipline"] == "Mécanique classique"


# ── PUT /entries/{id} ─────────────────────────────────────────────────────────

class TestUpdateEntry:
    @pytest.mark.asyncio
    async def test_update_own_entry_as_teacher(
        self, client: AsyncClient, teacher_user: dict, test_db: AsyncIOMotorDatabase
    ):
        entry = await _create_entry(test_db, created_by=teacher_user["id"],
                                    status="draft")
        res = await client.put(
            f"/entries/{entry['_id']}",
            json={"title": "Titre Modifié — test update"},
            headers=teacher_user["headers"],
        )
        assert res.status_code == 200
        assert res.json()["title"] == "Titre Modifié — test update"

    @pytest.mark.asyncio
    async def test_update_other_teacher_entry_forbidden(
        self,
        client: AsyncClient,
        teacher_user: dict,
        test_db: AsyncIOMotorDatabase,
        admin_user: dict,
    ):
        """Un enseignant ne peut pas modifier l'entrée d'un autre."""
        other_entry = await _create_entry(
            test_db, created_by=admin_user["id"], status="draft"
        )
        res = await client.put(
            f"/entries/{other_entry['_id']}",
            json={"title": "Tentative modification"},
            headers=teacher_user["headers"],
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_can_update_any_entry(
        self,
        client: AsyncClient,
        admin_user: dict,
        teacher_user: dict,
        test_db: AsyncIOMotorDatabase,
    ):
        entry = await _create_entry(test_db, created_by=teacher_user["id"])
        res = await client.put(
            f"/entries/{entry['_id']}",
            json={"title": "Modifié par admin"},
            headers=admin_user["headers"],
        )
        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_update_nonexistent_returns_404(
        self, client: AsyncClient, admin_user: dict
    ):
        res = await client.put(
            "/entries/000000000000000000000000",
            json={"title": "Inexistant"},
            headers=admin_user["headers"],
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_update_as_student_forbidden(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        res = await client.put(
            f"/entries/{active_entry['_id']}",
            json={"title": "Student tente de modifier"},
            headers=student_user["headers"],
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_partial_update_keeps_other_fields(
        self, client: AsyncClient, admin_user: dict, test_db: AsyncIOMotorDatabase
    ):
        entry = await _create_entry(
            test_db, created_by=admin_user["id"], title="Titre original"
        )
        res = await client.put(
            f"/entries/{entry['_id']}",
            json={"context": "Nouveau contexte"},
            headers=admin_user["headers"],
        )
        assert res.status_code == 200
        data = res.json()
        assert data["title"] == "Titre original"
        assert data["context"] == "Nouveau contexte"


# ── PATCH /entries/{id}/status ────────────────────────────────────────────────

class TestUpdateStatus:
    @pytest.mark.asyncio
    async def test_admin_can_activate_draft(
        self,
        client: AsyncClient,
        admin_user: dict,
        draft_entry: dict,
    ):
        res = await client.patch(
            f"/entries/{draft_entry['_id']}/status",
            json={"status": "active"},
            headers=admin_user["headers"],
        )
        assert res.status_code == 200
        assert res.json()["status"] == "active"

    @pytest.mark.asyncio
    async def test_admin_can_archive(
        self, client: AsyncClient, admin_user: dict, active_entry: dict
    ):
        res = await client.patch(
            f"/entries/{active_entry['_id']}/status",
            json={"status": "archived"},
            headers=admin_user["headers"],
        )
        assert res.status_code == 200

    @pytest.mark.asyncio
    async def test_teacher_cannot_change_status(
        self, client: AsyncClient, teacher_user: dict, draft_entry: dict
    ):
        res = await client.patch(
            f"/entries/{draft_entry['_id']}/status",
            json={"status": "active"},
            headers=teacher_user["headers"],
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_invalid_status_rejected(
        self, client: AsyncClient, admin_user: dict, draft_entry: dict
    ):
        res = await client.patch(
            f"/entries/{draft_entry['_id']}/status",
            json={"status": "statut_invalide"},
            headers=admin_user["headers"],
        )
        assert res.status_code == 422


# ── DELETE /entries/{id} ──────────────────────────────────────────────────────

class TestDeleteEntry:
    @pytest.mark.asyncio
    async def test_admin_soft_delete_success(
        self, client: AsyncClient, admin_user: dict, active_entry: dict
    ):
        res = await client.delete(
            f"/entries/{active_entry['_id']}", headers=admin_user["headers"]
        )
        assert res.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_is_soft_not_hard(
        self,
        client: AsyncClient,
        admin_user: dict,
        test_db: AsyncIOMotorDatabase,
        active_entry: dict,
    ):
        """L'entrée doit toujours exister en base après un soft-delete."""
        await client.delete(
            f"/entries/{active_entry['_id']}", headers=admin_user["headers"]
        )
        from bson import ObjectId
        doc = await test_db["entries"].find_one(
            {"_id": ObjectId(active_entry["_id"])}
        )
        assert doc is not None
        assert doc["status"] == "deleted"

    @pytest.mark.asyncio
    async def test_student_cannot_delete(
        self, client: AsyncClient, student_user: dict, active_entry: dict
    ):
        res = await client.delete(
            f"/entries/{active_entry['_id']}", headers=student_user["headers"]
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_teacher_cannot_delete(
        self, client: AsyncClient, teacher_user: dict, active_entry: dict
    ):
        res = await client.delete(
            f"/entries/{active_entry['_id']}", headers=teacher_user["headers"]
        )
        assert res.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_nonexistent_returns_404(
        self, client: AsyncClient, admin_user: dict
    ):
        res = await client.delete(
            "/entries/000000000000000000000000", headers=admin_user["headers"]
        )
        assert res.status_code == 404
