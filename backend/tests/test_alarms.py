from datetime import date, timedelta
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.alarm import AlarmCreate, AlarmUpdate
from app.schemas.animal import AnimalCreate
from app.schemas.withdrawal_lock import WithdrawalLockCreate
from app.services import alarm as alarm_service
from app.services import animal as animal_service
from app.services import withdrawal_lock as withdrawal_lock_service


def test_alarm_crud(db) -> None:
    alarm = alarm_service.create_alarm(
        db,
        AlarmCreate(
            title=f"Test Alarm {uuid4().hex[:8]}",
            alarm_type="reminder",
            priority="low",
            due_date=date.today() + timedelta(days=2),
        ),
    )

    assert alarm_service.get_alarm(db, alarm.id).id == alarm.id
    updated = alarm_service.update_alarm(
        db,
        alarm.id,
        AlarmUpdate(priority="high", is_completed=True),
    )
    assert updated.priority == "high"
    assert updated.is_completed is True

    alarm_service.delete_alarm(db, alarm.id)
    with pytest.raises(LookupError, match="Alarm not found"):
        alarm_service.get_alarm(db, alarm.id)


def test_withdrawal_alarm_sync_is_idempotent_and_sets_priority(db) -> None:
    animal = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"ALARM-{uuid4().hex[:12]}")
    )
    future_lock = withdrawal_lock_service.create_withdrawal_lock(
        db,
        WithdrawalLockCreate(
            animal_id=animal.id,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=3),
        ),
    )
    overdue_lock = withdrawal_lock_service.create_withdrawal_lock(
        db,
        WithdrawalLockCreate(
            animal_id=animal.id,
            start_date=date.today() - timedelta(days=3),
            end_date=date.today() - timedelta(days=1),
        ),
    )

    alarm_service.list_alarms(db)
    alarms = alarm_service.list_alarms(db)
    future_title = alarm_service.build_withdrawal_lock_alarm_title(
        future_lock.id, animal.id
    )
    overdue_title = alarm_service.build_withdrawal_lock_alarm_title(
        overdue_lock.id, animal.id
    )
    future_alarms = [alarm for alarm in alarms if alarm.title == future_title]
    overdue_alarms = [alarm for alarm in alarms if alarm.title == overdue_title]

    assert len(future_alarms) == 1
    assert future_alarms[0].priority == "medium"
    assert len(overdue_alarms) == 1
    assert overdue_alarms[0].priority == "high"


def test_alarm_validation_and_missing_ids(db) -> None:
    with pytest.raises(ValidationError):
        AlarmCreate(
            title="",
            alarm_type="reminder",
            priority="low",
            due_date=date.today(),
        )

    with pytest.raises(LookupError, match="Alarm not found"):
        alarm_service.update_alarm(
            db, 2_000_000_000, AlarmUpdate(priority="high")
        )

    with pytest.raises(LookupError, match="Alarm not found"):
        alarm_service.delete_alarm(db, 2_000_000_000)
