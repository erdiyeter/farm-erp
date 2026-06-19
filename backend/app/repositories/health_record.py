from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.health_record import HealthRecord
from app.schemas.health_record import HealthRecordCreate


def get_all_health_records(db: Session) -> list[HealthRecord]:
    statement = select(HealthRecord).order_by(
        HealthRecord.record_date.desc(), HealthRecord.id.desc()
    )
    return list(db.scalars(statement).all())


def get_health_records_by_animal_id(
    db: Session, animal_id: int
) -> list[HealthRecord]:
    statement = (
        select(HealthRecord)
        .where(HealthRecord.animal_id == animal_id)
        .order_by(HealthRecord.record_date.desc(), HealthRecord.id.desc())
    )
    return list(db.scalars(statement).all())


def create_health_record(
    db: Session, health_record_data: HealthRecordCreate
) -> HealthRecord:
    health_record = HealthRecord(**health_record_data.model_dump())
    db.add(health_record)
    db.commit()
    db.refresh(health_record)
    return health_record
