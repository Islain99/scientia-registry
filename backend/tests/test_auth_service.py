"""
Tests unitaires pour services/auth_service.py.
Pas de base de données — tests purs sur les fonctions cryptographiques et JWT.
"""

import time

import pytest

from services.auth_service import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)


# ── hash_password / verify_password ──────────────────────────────────────────

class TestPasswordHashing:
    def test_hash_returns_string(self):
        result = hash_password("monMotDePasse")
        assert isinstance(result, str)

    def test_hash_is_not_plaintext(self):
        plain = "monMotDePasse"
        assert hash_password(plain) != plain

    def test_two_hashes_differ(self):
        """bcrypt génère un sel aléatoire — deux hachages du même mdp diffèrent."""
        h1 = hash_password("monMotDePasse")
        h2 = hash_password("monMotDePasse")
        assert h1 != h2

    def test_verify_correct_password(self):
        plain = "motDePasse123!"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("correct")
        assert verify_password("incorrect", hashed) is False

    def test_verify_empty_password_against_hash(self):
        hashed = hash_password("non_vide")
        assert verify_password("", hashed) is False

    def test_verify_case_sensitive(self):
        hashed = hash_password("Password")
        assert verify_password("password", hashed) is False

    def test_hash_unicode(self):
        plain = "mötDëPässé_éàü"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True


# ── create_access_token / decode_access_token ─────────────────────────────────

class TestAccessToken:
    def test_create_returns_string(self):
        token = create_access_token("user123", "student")
        assert isinstance(token, str)
        assert len(token) > 20

    def test_decode_valid_token(self):
        token = create_access_token("user123", "admin")
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "user123"

    def test_decode_contains_role(self):
        token = create_access_token("user456", "teacher")
        payload = decode_access_token(token)
        assert payload["role"] == "teacher"

    def test_decode_type_is_access(self):
        token = create_access_token("user789", "student")
        payload = decode_access_token(token)
        assert payload["type"] == "access"

    def test_decode_invalid_token_returns_none(self):
        assert decode_access_token("token.invalide.ici") is None

    def test_decode_empty_string_returns_none(self):
        assert decode_access_token("") is None

    def test_decode_refresh_token_as_access_returns_none(self):
        """Un refresh token ne doit pas être accepté comme access token."""
        refresh = create_refresh_token("user123")
        assert decode_access_token(refresh) is None

    def test_decode_tampered_token_returns_none(self):
        token = create_access_token("user123", "student")
        tampered = token[:-4] + "xxxx"
        assert decode_access_token(tampered) is None


# ── create_refresh_token / decode_refresh_token ───────────────────────────────

class TestRefreshToken:
    def test_create_returns_string(self):
        token = create_refresh_token("user123")
        assert isinstance(token, str)

    def test_decode_returns_user_id(self):
        user_id = "abc123def456"
        token = create_refresh_token(user_id)
        result = decode_refresh_token(token)
        assert result == user_id

    def test_decode_access_token_as_refresh_returns_none(self):
        """Un access token ne doit pas être accepté comme refresh token."""
        access = create_access_token("user123", "student")
        assert decode_refresh_token(access) is None

    def test_decode_invalid_token_returns_none(self):
        assert decode_refresh_token("invalide") is None

    def test_access_and_refresh_tokens_differ(self):
        """Les deux tokens pour le même user doivent être différents."""
        access  = create_access_token("user123", "student")
        refresh = create_refresh_token("user123")
        assert access != refresh
