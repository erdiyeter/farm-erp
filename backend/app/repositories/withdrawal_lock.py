from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.withdrawal_lock import WithdrawalLock
from app.schemas.withdrawal_lock import (
    WithdrawalLockCreate,
    WithdrawalLockUpdate,
)


def get_withdrawal_locks(db: Session) -> list[WithdrawalLock]:
    statement = select(WithdrawalLock).order_by(
        WithdrawalLock.created_at.desc(), WithdrawalLock.id.desc()
    )
    return list(db.scalars(statement).all())


def get_active_withdrawal_locks(db: Session) -> list[WithdrawalLock]:
    statement = (
        select(WithdrawalLock)
        .where(WithdrawalLock.is_active.is_(True))
        .order_by(WithdrawalLock.created_at.desc(), WithdrawalLock.id.desc())
    )
    return list(db.scalars(statement).all())


def get_withdrawal_lock_by_id(
    db: Session, lock_id: int
) -> WithdrawalLock | None:
    return db.get(WithdrawalLock, lock_id)


def create_withdrawal_lock(
    db: Session, data: WithdrawalLockCreate
) -> WithdrawalLock:
    withdrawal_lock = WithdrawalLock(**data.model_dump())
    db.add(withdrawal_lock)
    db.commit()
    db.refresh(withdrawal_lock)
    return withdrawal_lock


def update_withdrawal_lock(
    db: Session, lock_id: int, data: WithdrawalLockUpdate
) -> WithdrawalLock | None:
    withdrawal_lock = get_withdrawal_lock_by_id(db, lock_id)
    if withdrawal_lock is None:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(withdrawal_lock, field, value)

    withdrawal_lock.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(withdrawal_lock)
    return withdrawal_lock


def soft_delete_withdrawal_lock(
    db: Session, lock_id: int
) -> WithdrawalLock | None:
    withdrawal_lock = get_withdrawal_lock_by_id(db, lock_id)
    if withdrawal_lock is None:
        return None

    withdrawal_lock.is_active = False
    withdrawal_lock.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(withdrawal_lock)
    return withdrawal_lock
