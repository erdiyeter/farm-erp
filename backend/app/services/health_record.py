from sqlalchemy.orm import Session

from app.models.health_record import HealthRecord
from app.repositories import animal as animal_repository
from app.repositories import health_record as health_record_repository
from app.schemas.health_record import HealthRecordCreate, HealthRecordUpdate


def list_health_records(db: Session) -> list[HealthRecord]:
    return health_record_repository.get_all_health_records(db)


def list_health_records_by_animal(
    animal_id: int, db: Session
) -> list[HealthRecord]:
    return health_record_repository.get_health_records_by_animal_id(
        db, animal_id
    )


def create_health_record(
    db: Session, health_record_data: HealthRecordCreate
) -> HealthRecord:
    validate_active_animal(db, health_record_data.animal_id)

    return health_record_repository.create_health_record(
        db, health_record_data
    )


def get_health_record(db: Session, health_record_id: int) -> HealthRecord:
    health_record = health_record_repository.get_health_record_by_id(
        db, health_record_id
    )
    if health_record is None:
        raise LookupError("Health record not found")
    return health_record


def update_health_record(
    db: Session,
    health_record_id: int,
    health_record_data: HealthRecordUpdate,
) -> HealthRecord:
    health_record = get_health_record(db, health_record_id)

    if health_record_data.animal_id is not None:
        validate_active_animal(db, health_record_data.animal_id)

    return health_record_repository.update_health_record(
        db, health_record, health_record_data
    )


def delete_health_record(db: Session, health_record_id: int) -> None:
    health_record = get_health_record(db, health_record_id)
    health_record_repository.delete_health_record(db, health_record)


def validate_active_animal(db: Session, animal_id: int) -> None:
    animal = animal_repository.get_animal_by_id(db, animal_id)

    if animal is None:
        raise LookupError("Animal not found")

    if animal.is_active is not True:
        raise ValueError("Animal is inactive")
