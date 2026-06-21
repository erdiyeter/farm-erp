from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.health_record import HealthRecord
from app.schemas.health_record import HealthRecordCreate, HealthRecordUpdate


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
    db: Session,
    health_record_data: HealthRecordCreate,
    commit: bool = True,
) -> HealthRecord:
    health_record = HealthRecord(
        **health_record_data.model_dump(exclude={"inventory_item_id"})
    )
    db.add(health_record)
    if commit:
        db.commit()
    else:
        db.flush()
    db.refresh(health_record)
    return health_record


def get_health_record_by_id(
    db: Session, health_record_id: int
) -> HealthRecord | None:
    return db.get(HealthRecord, health_record_id)


def update_health_record(
    db: Session,
    health_record: HealthRecord,
    health_record_data: HealthRecordUpdate,
    commit: bool = True,
) -> HealthRecord:
    for field, value in health_record_data.model_dump(
        exclude_unset=True, exclude={"inventory_item_id"}
    ).items():
        setattr(health_record, field, value)

    if commit:
        db.commit()
    else:
        db.flush()
    db.refresh(health_record)
    return health_record


def delete_health_record(db: Session, health_record: HealthRecord) -> None:
    db.delete(health_record)
    db.commit()
