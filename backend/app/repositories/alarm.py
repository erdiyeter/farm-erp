from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.alarm import Alarm
from app.schemas.alarm import AlarmCreate, AlarmUpdate


def get_alarms(db: Session) -> list[Alarm]:
    statement = select(Alarm).order_by(
        Alarm.created_at.desc(), Alarm.id.desc()
    )
    return list(db.scalars(statement).all())


def get_alarm_by_id(db: Session, alarm_id: int) -> Alarm | None:
    return db.get(Alarm, alarm_id)


def get_alarm_by_title_and_type(
    db: Session, title: str, alarm_type: str
) -> Alarm | None:
    statement = select(Alarm).where(
        Alarm.title == title,
        Alarm.alarm_type == alarm_type,
    )
    return db.scalar(statement)


def create_alarm(db: Session, alarm_data: AlarmCreate) -> Alarm:
    alarm = Alarm(**alarm_data.model_dump())
    db.add(alarm)
    db.commit()
    db.refresh(alarm)
    return alarm


def update_alarm(
    db: Session, alarm: Alarm, alarm_data: AlarmUpdate
) -> Alarm:
    for field, value in alarm_data.model_dump(exclude_unset=True).items():
        setattr(alarm, field, value)

    db.commit()
    db.refresh(alarm)
    return alarm


def delete_alarm(db: Session, alarm: Alarm) -> None:
    db.delete(alarm)
    db.commit()
