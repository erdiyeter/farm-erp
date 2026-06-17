from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.vaccination import VaccinationCreate, VaccinationResponse
from app.services import vaccination as vaccination_service


router = APIRouter(tags=["vaccinations"])


@router.get("/vaccinations", response_model=list[VaccinationResponse])
def list_vaccinations(
    db: Session = Depends(get_db),
) -> list[VaccinationResponse]:
    return vaccination_service.list_vaccinations(db)


@router.post(
    "/vaccinations",
    response_model=VaccinationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vaccination(
    vaccination_data: VaccinationCreate,
    db: Session = Depends(get_db),
) -> VaccinationResponse:
    try:
        return vaccination_service.create_vaccination(db, vaccination_data)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.get(
    "/animals/{animal_id}/vaccinations",
    response_model=list[VaccinationResponse],
)
def list_animal_vaccinations(
    animal_id: int,
    db: Session = Depends(get_db),
) -> list[VaccinationResponse]:
    try:
        return vaccination_service.list_animal_vaccinations(db, animal_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
