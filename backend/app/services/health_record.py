from sqlalchemy.orm import Session

from app.models.health_record import HealthRecord
from app.repositories import animal as animal_repository
from app.repositories import health_record as health_record_repository
from app.schemas.health_record import HealthRecordCreate


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
    animal = animal_repository.get_animal_by_id(
        db, health_record_data.animal_id
    )

    if animal is None:
        raise LookupError("Animal not found")

    if animal.is_active is not True:
        raise ValueError("Animal is inactive")

    return health_record_repository.create_health_record(
        db, health_record_data
    )
