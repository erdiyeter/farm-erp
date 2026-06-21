from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.models.user import User
from app.routers import auth as auth_router
from app.schemas.auth import LoginRequest
from app.services import auth as auth_service


def test_login_token_and_current_user(db) -> None:
    email = f"test-{uuid4().hex}@farm.local"
    password = "test-password"
    user = User(
        full_name="Test User",
        email=email,
        password_hash=auth_service.hash_password(password),
        is_active=True,
    )
    db.add(user)
    db.flush()

    response = auth_router.login(
        LoginRequest(email=email, password=password), db
    )
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer", credentials=response.access_token
    )
    current_user = auth_router.get_current_user(credentials, db)
    payload = auth_service.decode_access_token(response.access_token)

    assert response.token_type == "bearer"
    assert response.user.email == email
    assert current_user.id == user.id
    assert payload["user_id"] == user.id
    assert payload["email"] == email


def test_login_rejects_invalid_credentials(db) -> None:
    with pytest.raises(HTTPException) as exc_info:
        auth_router.login(
            LoginRequest(
                email=f"missing-{uuid4().hex}@farm.local",
                password="wrong-password",
            ),
            db,
        )

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid email or password"


def test_current_user_requires_a_valid_token(db) -> None:
    with pytest.raises(HTTPException) as exc_info:
        auth_router.get_current_user(None, db)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid or expired token"
