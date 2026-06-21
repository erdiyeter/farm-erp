from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import ValidationError

from app.models.user import User
from app.routers import auth as auth_router
from app.schemas.auth import LoginRequest, UserResponse
from app.services import auth as auth_service


def test_login_token_and_current_user(db) -> None:
    email = f"test-{uuid4().hex}@farm.local"
    password = "test-password"
    user = User(
        full_name="Test User",
        email=email,
        password_hash=auth_service.hash_password(password),
        role="veterinarian",
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
    assert response.user.role == "veterinarian"
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


def test_current_user_rejects_malformed_token(db) -> None:
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer", credentials="not-a-jwt"
    )

    with pytest.raises(HTTPException) as exc_info:
        auth_router.get_current_user(credentials, db)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid or expired token"


@pytest.mark.parametrize("role", ["admin", "worker", "veterinarian"])
def test_user_response_accepts_supported_roles(db, role) -> None:
    user = User(
        full_name="Role Test User",
        email=f"role-{role}-{uuid4().hex}@farm.local",
        password_hash="not-used",
        role=role,
        is_active=True,
    )
    db.add(user)
    db.flush()

    assert UserResponse.model_validate(user).role == role


def test_user_response_rejects_unsupported_role(db) -> None:
    user = User(
        full_name="Invalid Role User",
        email=f"invalid-role-{uuid4().hex}@farm.local",
        password_hash="not-used",
        role="manager",
        is_active=True,
    )
    db.add(user)
    db.flush()

    with pytest.raises(ValidationError):
        UserResponse.model_validate(user)


@pytest.mark.parametrize("role", ["admin", "veterinarian"])
def test_role_dependency_allows_configured_roles(role) -> None:
    user = User(
        full_name="Allowed User",
        email=f"allowed-{role}@farm.local",
        password_hash="not-used",
        role=role,
        is_active=True,
    )
    check_role = auth_router.require_roles("admin", "veterinarian")

    assert check_role(user) is user


def test_role_dependency_returns_403_for_unauthorized_role() -> None:
    user = User(
        full_name="Worker User",
        email="worker@farm.local",
        password_hash="not-used",
        role="worker",
        is_active=True,
    )
    check_role = auth_router.require_roles("admin", "veterinarian")

    with pytest.raises(HTTPException) as exc_info:
        check_role(user)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Insufficient permissions"
