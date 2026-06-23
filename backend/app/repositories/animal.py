from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.schemas.animal import AnimalCreate, AnimalUpdate


def get_active_animals(db: Session) -> list[Animal]:
    statement = (
        select(Animal).where(Animal.is_active.is_(True)).order_by(Animal.id)
    )
    return list(db.scalars(statement).all())


def get_animal_by_id(db: Session, animal_id: int) -> Animal | None:
    return db.get(Animal, animal_id)


def get_animal_by_ear_tag(db: Session, ear_tag: str) -> Animal | None:
    statement = select(Animal).where(Animal.ear_tag == ear_tag)
    return db.scalar(statement)


def create_animal(db: Session, animal_data: AnimalCreate) -> Animal:
    animal = Animal(**animal_data.model_dump())
    db.add(animal)
    db.commit()
    db.refresh(animal)
    return animal


def update_animal(
    db: Session, animal: Animal, animal_data: AnimalUpdate
) -> Animal:
    for field, value in animal_data.model_dump(exclude_unset=True).items():
        setattr(animal, field, value)

    animal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(animal)
    return animal


def soft_delete_animal(db: Session, animal: Animal) -> Animal:
    animal.is_active = False
    if animal.exit_date is None:
        animal.exit_date = date.today()
        animal.exit_reason = "other"
    animal.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(animal)
    return animal

def get_total_active_animals(db: Session) -> int:
    statement = select(func.count()).where(Animal.is_active.is_(True))
    return db.scalar(statement) or 0


def get_male_animals_count(db: Session) -> int:
    statement = (
        select(func.count())
        .where(Animal.is_active.is_(True))
        .where(Animal.sex == "Male")
    )
    return db.scalar(statement) or 0


def get_female_animals_count(db: Session) -> int:
    statement = (
        select(func.count())
        .where(Animal.is_active.is_(True))
        .where(Animal.sex == "Female")
    )
    return db.scalar(statement) or 0
