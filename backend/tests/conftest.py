import pytest
from sqlalchemy.orm import Session

import app.models  # noqa: F401
from app.database import Base, engine


@pytest.fixture(scope="session", autouse=True)
def initialize_test_database() -> None:
    Base.metadata.create_all(bind=engine)


@pytest.fixture
def db() -> Session:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
    )

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
