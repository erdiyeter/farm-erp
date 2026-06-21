from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


DEFAULT_ADMIN_EMAIL = "admin@farm.local"


def get_user_by_email(db: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return db.scalar(statement)


def create_default_admin(db: Session, password_hash: str) -> User:
    existing_user = get_user_by_email(db, DEFAULT_ADMIN_EMAIL)
    if existing_user is not None:
        return existing_user

    user = User(
        full_name="Farm Admin",
        email=DEFAULT_ADMIN_EMAIL,
        password_hash=password_hash,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
