import pytest
from fastapi import HTTPException
from app.main import app
from app.models.user import User


def make_user(role: str) -> User:
    return User(
        full_name=f"{role.title()} User",
        email=f"{role}@farm.local",
        password_hash="not-used",
        role=role,
        is_active=True,
    )


def get_role_check(path: str, method: str = "GET"):
    included_router = next(
        included_router
        for included_router in app.routes
        if hasattr(included_router, "original_router")
        and any(
            included_router.include_context.prefix + route.path == path
            and method in route.methods
            for route in included_router.original_router.routes
        )
    )
    return next(
        dependency.dependency
        for dependency in included_router.include_context.dependencies
        if dependency.dependency.__name__ == "check_role"
    )


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/animals",
        "/api/v1/alarms",
        "/api/v1/dashboard",
        "/api/v1/finance",
        "/api/v1/health-records",
        "/api/v1/inventory/items",
        "/api/v1/milk-records",
        "/api/v1/reports/summary",
        "/api/v1/settings",
        "/api/v1/vaccinations",
        "/api/v1/withdrawal-locks",
    ],
)
def test_admin_has_access_to_all_protected_modules(path) -> None:
    admin = make_user("admin")
    assert get_role_check(path)(admin) is admin


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/animals",
        "/api/v1/health-records",
        "/api/v1/withdrawal-locks",
        "/api/v1/alarms",
        "/api/v1/reports/summary",
    ],
)
def test_veterinarian_has_access_to_assigned_modules(path) -> None:
    veterinarian = make_user("veterinarian")
    assert get_role_check(path)(veterinarian) is veterinarian


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/animals",
        "/api/v1/milk-records",
        "/api/v1/inventory/items",
        "/api/v1/dashboard",
    ],
)
def test_worker_has_access_to_assigned_modules(path) -> None:
    worker = make_user("worker")
    assert get_role_check(path)(worker) is worker


@pytest.mark.parametrize(
    ("role", "path"),
    [
        ("worker", "/api/v1/reports/summary"),
        ("worker", "/api/v1/health-records"),
        ("veterinarian", "/api/v1/inventory/items"),
        ("veterinarian", "/api/v1/dashboard"),
    ],
)
def test_unassigned_roles_receive_403(role, path) -> None:
    with pytest.raises(HTTPException) as exc_info:
        get_role_check(path)(make_user(role))

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Insufficient permissions"
