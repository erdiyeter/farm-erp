from datetime import date, timedelta
from uuid import uuid4

import pytest

from app.schemas.animal import AnimalCreate
from app.schemas.health_record import HealthRecordCreate
from app.schemas.withdrawal_lock import WithdrawalLockCreate, WithdrawalLockUpdate
from app.services import animal as animal_service
from app.services import health_record as health_record_service
from app.services import withdrawal_lock as withdrawal_lock_service


def create_animal_and_health_record(db):
    animal = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"LOCK-{uuid4().hex[:12]}")
    )
    health_record = health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=animal.id,
            record_type="treatment",
            record_date=date.today(),
        ),
    )
    return animal, health_record


def test_withdrawal_lock_create_update_and_deactivate(db) -> None:
    animal, health_record = create_animal_and_health_record(db)
    lock = withdrawal_lock_service.create_withdrawal_lock(
        db,
        WithdrawalLockCreate(
            animal_id=animal.id,
            health_record_id=health_record.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=5),
            reason="Treatment",
        ),
    )

    assert lock.id in {
        active_lock.id
        for active_lock in withdrawal_lock_service.list_active_withdrawal_locks(db)
    }
    updated = withdrawal_lock_service.update_withdrawal_lock(
        db, lock.id, WithdrawalLockUpdate(reason="Updated treatment")
    )
    assert updated.reason == "Updated treatment"

    deactivated = withdrawal_lock_service.deactivate_withdrawal_lock(
        db, lock.id
    )
    assert deactivated.is_active is False
    assert lock.id not in {
        active_lock.id
        for active_lock in withdrawal_lock_service.list_active_withdrawal_locks(db)
    }


def test_withdrawal_lock_rejects_missing_relationships(db) -> None:
    animal, _ = create_animal_and_health_record(db)
    lock_data = {
        "start_date": date.today(),
        "end_date": date.today() + timedelta(days=1),
    }

    with pytest.raises(ValueError, match="Animal not found"):
        withdrawal_lock_service.create_withdrawal_lock(
            db,
            WithdrawalLockCreate(animal_id=2_000_000_000, **lock_data),
        )

    with pytest.raises(ValueError, match="Health record not found"):
        withdrawal_lock_service.create_withdrawal_lock(
            db,
            WithdrawalLockCreate(
                animal_id=animal.id,
                health_record_id=2_000_000_000,
                **lock_data,
            ),
        )


@pytest.mark.parametrize("operation", ["get", "update", "deactivate"])
def test_withdrawal_lock_missing_id_raises_lookup_error(db, operation) -> None:
    missing_id = 2_000_000_000

    with pytest.raises(LookupError, match="Withdrawal lock not found"):
        if operation == "get":
            withdrawal_lock_service.get_withdrawal_lock(db, missing_id)
        elif operation == "update":
            withdrawal_lock_service.update_withdrawal_lock(
                db, missing_id, WithdrawalLockUpdate(reason="Missing")
            )
        else:
            withdrawal_lock_service.deactivate_withdrawal_lock(db, missing_id)
