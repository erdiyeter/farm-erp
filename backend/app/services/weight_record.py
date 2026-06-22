from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.weight_record import WeightRecord
from app.repositories import animal as animal_repository
from app.repositories import weight_record as weight_record_repository
from app.schemas.weight_record import WeightRecordCreate, WeightRecordUpdate


def list_weight_records(db: Session) -> list[WeightRecord]:
    return weight_record_repository.get_weight_records(db)


def list_weight_records_by_animal_id(
    db: Session, animal_id: int
) -> list[WeightRecord]:
    validate_animal_exists(db, animal_id)
    return weight_record_repository.get_weight_records_by_animal_id(
        db, animal_id
    )


def get_weight_record(
    db: Session, weight_record_id: int
) -> WeightRecord:
    weight_record = weight_record_repository.get_weight_record_by_id(
        db, weight_record_id
    )
    if weight_record is None:
        raise LookupError("Weight record not found")
    return weight_record


def create_weight_record(
    db: Session, weight_record_data: WeightRecordCreate
) -> WeightRecord:
    validate_animal_exists(db, weight_record_data.animal_id)
    validate_record_date(weight_record_data.record_date)
    validate_weight(weight_record_data.weight_kg)
    return weight_record_repository.create_weight_record(
        db, weight_record_data
    )


def update_weight_record(
    db: Session,
    weight_record_id: int,
    weight_record_data: WeightRecordUpdate,
) -> WeightRecord:
    weight_record = get_weight_record(db, weight_record_id)
    if weight_record_data.animal_id is not None:
        validate_animal_exists(db, weight_record_data.animal_id)
    if weight_record_data.record_date is not None:
        validate_record_date(weight_record_data.record_date)
    if weight_record_data.weight_kg is not None:
        validate_weight(weight_record_data.weight_kg)
    return weight_record_repository.update_weight_record(
        db, weight_record, weight_record_data
    )


def delete_weight_record(db: Session, weight_record_id: int) -> None:
    weight_record = get_weight_record(db, weight_record_id)
    weight_record_repository.delete_weight_record(db, weight_record)


def validate_animal_exists(db: Session, animal_id: int) -> None:
    if animal_repository.get_animal_by_id(db, animal_id) is None:
        raise LookupError("Animal not found")


def validate_record_date(record_date: date) -> None:
    if record_date > date.today():
        raise ValueError("Weight record date cannot be in the future")


def validate_weight(weight_kg: Decimal) -> None:
    if not weight_kg.is_finite() or weight_kg <= 0:
        raise ValueError("Weight must be greater than zero")
