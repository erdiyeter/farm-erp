import app.models  # noqa: F401
from sqlalchemy import text

from app.database import Base, engine


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


if __name__ == "__main__":
    init_db()
