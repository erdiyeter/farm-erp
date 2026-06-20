from datetime import date

from sqlalchemy.orm import Session

from app.models.alarm import Alarm
from app.repositories import alarm as alarm_repository
from app.repositories import withdrawal_lock as withdrawal_lock_repository
from app.schemas.alarm import AlarmCreate, AlarmUpdate


def list_alarms(db: Session) -> list[Alarm]:
    sync_withdrawal_lock_alarms(db)
    return alarm_repository.get_alarms(db)


def get_alarm(db: Session, alarm_id: int) -> Alarm:
    alarm = alarm_repository.get_alarm_by_id(db, alarm_id)
    if alarm is None:
        raise LookupError("Alarm not found")
    return alarm


def create_alarm(db: Session, alarm_data: AlarmCreate) -> Alarm:
    return alarm_repository.create_alarm(db, alarm_data)


def update_alarm(
    db: Session, alarm_id: int, alarm_data: AlarmUpdate
) -> Alarm:
    alarm = get_alarm(db, alarm_id)
    return alarm_repository.update_alarm(db, alarm, alarm_data)


def delete_alarm(db: Session, alarm_id: int) -> None:
    alarm = get_alarm(db, alarm_id)
    alarm_repository.delete_alarm(db, alarm)


def sync_withdrawal_lock_alarms(db: Session) -> None:
    today = date.today()
    withdrawal_locks = withdrawal_lock_repository.get_active_withdrawal_locks(
        db
    )

    for withdrawal_lock in withdrawal_locks:
        title = build_withdrawal_lock_alarm_title(
            withdrawal_lock.id, withdrawal_lock.animal_id
        )
        existing_alarm = alarm_repository.get_alarm_by_title_and_type(
            db, title, "withdrawal"
        )
        if existing_alarm is not None:
            continue

        priority = "high" if withdrawal_lock.end_date <= today else "medium"
        alarm_data = AlarmCreate(
            title=title,
            description=build_withdrawal_lock_alarm_description(
                withdrawal_lock.id,
                withdrawal_lock.animal_id,
                withdrawal_lock.end_date,
                today,
            ),
            alarm_type="withdrawal",
            priority=priority,
            due_date=withdrawal_lock.end_date,
        )
        alarm_repository.create_alarm(db, alarm_data)


def build_withdrawal_lock_alarm_title(
    lock_id: int, animal_id: int
) -> str:
    return f"Withdrawal lock {lock_id} for animal {animal_id}"


def build_withdrawal_lock_alarm_description(
    lock_id: int, animal_id: int, end_date: date, today: date
) -> str:
    if end_date < today:
        status = "overdue"
    elif end_date == today:
        status = "expiring today"
    else:
        status = "active"

    return (
        f"Source withdrawal lock ID: {lock_id}. "
        f"Animal ID: {animal_id}. "
        f"End date: {end_date}. "
        f"Status when created: {status}."
    )
