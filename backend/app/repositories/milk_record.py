from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.milk_record import MilkRecord
from app.schemas.milk_record import MilkRecordCreate


def create_milk_record(
    db: Session, milk_record_data: MilkRecordCreate
) -> MilkRecord:
    milk_record = MilkRecord(**milk_record_data.model_dump())
    db.add(milk_record)
    db.commit()
    db.refresh(milk_record)
    return milk_record


def get_milk_records(db: Session) -> list[MilkRecord]:
    statement = select(MilkRecord).order_by(
        MilkRecord.record_date.desc(), MilkRecord.id.desc()
    )
    return list(db.scalars(statement).all())


def get_milk_records_by_animal_id(
    db: Session, animal_id: int
) -> list[MilkRecord]:
    statement = (
        select(MilkRecord)
        .where(MilkRecord.animal_id == animal_id)
        .order_by(MilkRecord.record_date.desc(), MilkRecord.id.desc())
    )
    return list(db.scalars(statement).all())
