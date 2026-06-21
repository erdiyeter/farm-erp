import app.models  # noqa: F401
from sqlalchemy import text

from app.database import Base, SessionLocal, engine
from app.repositories import user as user_repository
from app.services.auth import hash_password


def ensure_finance_soft_delete_column() -> None:
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE financial_records "
                "ADD COLUMN IF NOT EXISTS is_active BOOLEAN "
                "NOT NULL DEFAULT true"
            )
        )


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_finance_soft_delete_column()
    with SessionLocal() as db:
        if user_repository.get_user_by_email(
            db, user_repository.DEFAULT_ADMIN_EMAIL
        ) is None:
            user_repository.create_default_admin(
                db, hash_password("admin123")
            )


if __name__ == "__main__":
    init_db()
