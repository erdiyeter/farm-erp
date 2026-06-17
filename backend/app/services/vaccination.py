from sqlalchemy.orm import Session

from app.models.vaccination import Vaccination
from app.repositories import animal as animal_repository
from app.repositories import vaccination as vaccination_repository
from app.schemas.vaccination import VaccinationCreate


def list_vaccinations(db: Session) -> list[Vaccination]:
    return vaccination_repository.get_vaccinations(db)


def create_vaccination(
    db: Session, vaccination_data: VaccinationCreate
) -> Vaccination:
    animal = animal_repository.get_animal_by_id(
        db, vaccination_data.animal_id
    )
    if animal is None:
        raise LookupError("Animal not found")

    return vaccination_repository.create_vaccination(db, vaccination_data)


def list_animal_vaccinations(
    db: Session, animal_id: int
) -> list[Vaccination]:
    animal = animal_repository.get_animal_by_id(db, animal_id)
    if animal is None:
        raise LookupError("Animal not found")

    return vaccination_repository.get_vaccinations_by_animal_id(db, animal_id)
