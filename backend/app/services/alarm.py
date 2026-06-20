from sqlalchemy.orm import Session

from app.models.alarm import Alarm
from app.repositories import alarm as alarm_repository
from app.schemas.alarm import AlarmCreate, AlarmUpdate


def list_alarms(db: Session) -> list[Alarm]:
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
