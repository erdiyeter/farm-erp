from sqlalchemy.orm import Session

from app.models.withdrawal_lock import WithdrawalLock
from app.repositories import animal as animal_repository
from app.repositories import health_record as health_record_repository
from app.repositories import withdrawal_lock as withdrawal_lock_repository
from app.schemas.withdrawal_lock import (
    WithdrawalLockCreate,
    WithdrawalLockUpdate,
)


def list_withdrawal_locks(db: Session) -> list[WithdrawalLock]:
    return withdrawal_lock_repository.get_withdrawal_locks(db)


def list_active_withdrawal_locks(db: Session) -> list[WithdrawalLock]:
    return withdrawal_lock_repository.get_active_withdrawal_locks(db)


def get_withdrawal_lock(db: Session, lock_id: int) -> WithdrawalLock:
    withdrawal_lock = withdrawal_lock_repository.get_withdrawal_lock_by_id(
        db, lock_id
    )
    if withdrawal_lock is None:
        raise LookupError("Withdrawal lock not found")
    return withdrawal_lock


def create_withdrawal_lock(
    db: Session, data: WithdrawalLockCreate
) -> WithdrawalLock:
    validate_animal_exists(db, data.animal_id)
    validate_health_record_exists(db, data.health_record_id)
    return withdrawal_lock_repository.create_withdrawal_lock(db, data)


def update_withdrawal_lock(
    db: Session, lock_id: int, data: WithdrawalLockUpdate
) -> WithdrawalLock:
    get_withdrawal_lock(db, lock_id)

    if data.animal_id is not None:
        validate_animal_exists(db, data.animal_id)

    if data.health_record_id is not None:
        validate_health_record_exists(db, data.health_record_id)

    withdrawal_lock = withdrawal_lock_repository.update_withdrawal_lock(
        db, lock_id, data
    )
    if withdrawal_lock is None:
        raise LookupError("Withdrawal lock not found")
    return withdrawal_lock


def deactivate_withdrawal_lock(
    db: Session, lock_id: int
) -> WithdrawalLock:
    withdrawal_lock = withdrawal_lock_repository.soft_delete_withdrawal_lock(
        db, lock_id
    )
    if withdrawal_lock is None:
        raise LookupError("Withdrawal lock not found")
    return withdrawal_lock


def validate_animal_exists(db: Session, animal_id: int) -> None:
    animal = animal_repository.get_animal_by_id(db, animal_id)
    if animal is None:
        raise ValueError("Animal not found")


def validate_health_record_exists(
    db: Session, health_record_id: int | None
) -> None:
    if health_record_id is None:
        return

    health_record = health_record_repository.get_health_record_by_id(
        db, health_record_id
    )
    if health_record is None:
        raise ValueError("Health record not found")
