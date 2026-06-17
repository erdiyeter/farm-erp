from datetime import date

from sqlalchemy.orm import Session

from app.models.milk_record import MilkRecord
from app.repositories import animal as animal_repository
from app.repositories import milk_record as milk_record_repository
from app.schemas.milk_record import MilkRecordCreate


def create_milk_record(
    db: Session, milk_record_data: MilkRecordCreate
) -> MilkRecord:
    if milk_record_data.record_date > date.today():
        raise ValueError("Milk record date cannot be in the future")

    animal = animal_repository.get_animal_by_id(
        db, milk_record_data.animal_id
    )
    if animal is None:
        raise ValueError("Animal not found")

    return milk_record_repository.create_milk_record(db, milk_record_data)


def list_milk_records(db: Session) -> list[MilkRecord]:
    return milk_record_repository.get_milk_records(db)


def list_milk_records_by_animal_id(
    db: Session, animal_id: int
) -> list[MilkRecord]:
    return milk_record_repository.get_milk_records_by_animal_id(db, animal_id)
