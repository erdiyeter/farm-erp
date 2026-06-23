from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.animal import (
    AnimalCreate,
    AnimalDetailResponse,
    AnimalListResponse,
    AnimalStatsResponse,
    AnimalUpdate,
)
from app.services import animal as animal_service


router = APIRouter(prefix="/animals", tags=["animals"])


@router.get("", response_model=list[AnimalListResponse])
def list_animals(db: Session = Depends(get_db)) -> list[AnimalListResponse]:
    return animal_service.list_active_animals(db)


@router.get("/stats", response_model=AnimalStatsResponse)
def get_animal_stats(db: Session = Depends(get_db)) -> AnimalStatsResponse:
    return animal_service.get_animal_stats(db)


@router.post(
    "",
    response_model=AnimalDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_animal(
    animal_data: AnimalCreate, db: Session = Depends(get_db)
) -> AnimalDetailResponse:
    try:
        animal = animal_service.create_animal(db, animal_data)
        return animal_service.build_animal_detail_response(db, animal)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.get("/{animal_id}", response_model=AnimalDetailResponse)
def get_animal(
    animal_id: int, db: Session = Depends(get_db)
) -> AnimalDetailResponse:
    try:
        return animal_service.get_animal_detail(db, animal_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.put("/{animal_id}", response_model=AnimalDetailResponse)
def update_animal(
    animal_id: int,
    animal_data: AnimalUpdate,
    db: Session = Depends(get_db),
) -> AnimalDetailResponse:
    try:
        animal = animal_service.update_animal(db, animal_id, animal_data)
        return animal_service.build_animal_detail_response(db, animal)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.delete("/{animal_id}", response_model=AnimalDetailResponse)
def delete_animal(
    animal_id: int, db: Session = Depends(get_db)
) -> AnimalDetailResponse:
    try:
        animal = animal_service.soft_delete_animal(db, animal_id)
        return animal_service.build_animal_detail_response(db, animal)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
