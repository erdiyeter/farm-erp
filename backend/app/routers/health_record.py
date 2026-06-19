from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.health_record import (
    HealthRecordCreate,
    HealthRecordResponse,
    HealthRecordUpdate,
)
from app.services import health_record as health_record_service


router = APIRouter(tags=["health-records"])


@router.get("/health-records", response_model=list[HealthRecordResponse])
def list_health_records(
    db: Session = Depends(get_db),
) -> list[HealthRecordResponse]:
    return health_record_service.list_health_records(db)


@router.post(
    "/health-records",
    response_model=HealthRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_health_record(
    health_record_data: HealthRecordCreate,
    db: Session = Depends(get_db),
) -> HealthRecordResponse:
    try:
        return health_record_service.create_health_record(
            db, health_record_data
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.get(
    "/health-records/animal/{animal_id}",
    response_model=list[HealthRecordResponse],
)
def list_health_records_by_animal(
    animal_id: int,
    db: Session = Depends(get_db),
) -> list[HealthRecordResponse]:
    try:
        return health_record_service.list_health_records_by_animal(
            animal_id, db
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.get(
    "/health-records/{health_record_id}",
    response_model=HealthRecordResponse,
)
def get_health_record(
    health_record_id: int,
    db: Session = Depends(get_db),
) -> HealthRecordResponse:
    try:
        return health_record_service.get_health_record(
            db, health_record_id
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.patch(
    "/health-records/{health_record_id}",
    response_model=HealthRecordResponse,
)
def update_health_record(
    health_record_id: int,
    health_record_data: HealthRecordUpdate,
    db: Session = Depends(get_db),
) -> HealthRecordResponse:
    try:
        return health_record_service.update_health_record(
            db, health_record_id, health_record_data
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.delete(
    "/health-records/{health_record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_health_record(
    health_record_id: int,
    db: Session = Depends(get_db),
) -> None:
    try:
        health_record_service.delete_health_record(db, health_record_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
