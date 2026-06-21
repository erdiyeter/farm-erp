import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories import user as user_repository


JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY", "farm-erp-mvp-development-secret"
)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_HOURS = 24

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return password_context.hash(password)


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = user_repository.get_user_by_email(db, email)
    if (
        user is None
        or user.is_active is not True
        or not password_context.verify(password, user.password_hash)
    ):
        return None
    return user


def create_access_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        hours=ACCESS_TOKEN_HOURS
    )
    payload = {
        "user_id": user.id,
        "email": user.email,
        "exp": expires_at,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM]
        )
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
