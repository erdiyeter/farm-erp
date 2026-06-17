from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.repositories import animal as animal_repository
from app.schemas.animal import (
    AnimalCreate,
    AnimalStatsResponse,
    AnimalUpdate,
)

def list_active_animals(db: Session) -> list[Animal]:
    return animal_repository.get_active_animals(db)


def get_animal(db: Session, animal_id: int) -> Animal:
    animal = animal_repository.get_animal_by_id(db, animal_id)
    if animal is None:
        raise LookupError("Animal not found")
    return animal


def create_animal(db: Session, animal_data: AnimalCreate) -> Animal:
    existing_animal = animal_repository.get_animal_by_ear_tag(
        db, animal_data.ear_tag
    )
    if existing_animal is not None:
        raise ValueError("Ear tag already exists")
    return animal_repository.create_animal(db, animal_data)


def update_animal(
    db: Session, animal_id: int, animal_data: AnimalUpdate
) -> Animal:
    animal = get_animal(db, animal_id)

    if animal_data.ear_tag is not None and animal_data.ear_tag != animal.ear_tag:
        existing_animal = animal_repository.get_animal_by_ear_tag(
            db, animal_data.ear_tag
        )
        if existing_animal is not None:
            raise ValueError("Ear tag already exists")

    return animal_repository.update_animal(db, animal, animal_data)


def soft_delete_animal(db: Session, animal_id: int) -> Animal:
    animal = get_animal(db, animal_id)
    return animal_repository.soft_delete_animal(db, animal)

def get_animal_stats(db: Session) -> AnimalStatsResponse:
    return AnimalStatsResponse(
        total_active=animal_repository.get_total_active_animals(db),
        male_count=animal_repository.get_male_animals_count(db),
        female_count=animal_repository.get_female_animals_count(db),
    )