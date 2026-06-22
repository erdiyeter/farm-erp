from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.weight_record import WeightRecord
from app.schemas.weight_record import WeightRecordCreate, WeightRecordUpdate


def get_weight_records(db: Session) -> list[WeightRecord]:
    statement = select(WeightRecord).order_by(
        WeightRecord.record_date.desc(), WeightRecord.id.desc()
    )
    return list(db.scalars(statement).all())


def get_weight_records_by_animal_id(
    db: Session, animal_id: int
) -> list[WeightRecord]:
    statement = (
        select(WeightRecord)
        .where(WeightRecord.animal_id == animal_id)
        .order_by(WeightRecord.record_date.desc(), WeightRecord.id.desc())
    )
    return list(db.scalars(statement).all())


def get_weight_record_by_id(
    db: Session, weight_record_id: int
) -> WeightRecord | None:
    return db.get(WeightRecord, weight_record_id)


def create_weight_record(
    db: Session, weight_record_data: WeightRecordCreate
) -> WeightRecord:
    weight_record = WeightRecord(**weight_record_data.model_dump())
    db.add(weight_record)
    db.commit()
    db.refresh(weight_record)
    return weight_record


def update_weight_record(
    db: Session,
    weight_record: WeightRecord,
    weight_record_data: WeightRecordUpdate,
) -> WeightRecord:
    for field, value in weight_record_data.model_dump(
        exclude_unset=True
    ).items():
        setattr(weight_record, field, value)

    weight_record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(weight_record)
    return weight_record


def delete_weight_record(db: Session, weight_record: WeightRecord) -> None:
    db.delete(weight_record)
    db.commit()
