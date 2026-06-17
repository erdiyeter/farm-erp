from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.vaccination import Vaccination
from app.schemas.vaccination import VaccinationCreate


def get_vaccinations(db: Session) -> list[Vaccination]:
    statement = select(Vaccination).order_by(Vaccination.id)
    return list(db.scalars(statement).all())


def get_vaccinations_by_animal_id(
    db: Session, animal_id: int
) -> list[Vaccination]:
    statement = (
        select(Vaccination)
        .where(Vaccination.animal_id == animal_id)
        .order_by(Vaccination.id)
    )
    return list(db.scalars(statement).all())


def create_vaccination(
    db: Session, vaccination_data: VaccinationCreate
) -> Vaccination:
    vaccination = Vaccination(**vaccination_data.model_dump())
    db.add(vaccination)
    db.commit()
    db.refresh(vaccination)
    return vaccination
