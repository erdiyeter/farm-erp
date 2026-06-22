from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.weight_record import (
    WeightRecordCreate,
    WeightRecordResponse,
    WeightRecordUpdate,
)
from app.services import weight_record as weight_record_service


router = APIRouter(tags=["weight-records"])


@router.post(
    "/weight-records",
    response_model=WeightRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_weight_record(
    weight_record_data: WeightRecordCreate,
    db: Session = Depends(get_db),
) -> WeightRecordResponse:
    try:
        return weight_record_service.create_weight_record(
            db, weight_record_data
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
    "/weight-records",
    response_model=list[WeightRecordResponse],
)
def list_weight_records(
    db: Session = Depends(get_db),
) -> list[WeightRecordResponse]:
    return weight_record_service.list_weight_records(db)


@router.get(
    "/animals/{animal_id}/weight-records",
    response_model=list[WeightRecordResponse],
)
def list_weight_records_by_animal_id(
    animal_id: int,
    db: Session = Depends(get_db),
) -> list[WeightRecordResponse]:
    try:
        return weight_record_service.list_weight_records_by_animal_id(
            db, animal_id
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.get(
    "/weight-records/{weight_record_id}",
    response_model=WeightRecordResponse,
)
def get_weight_record(
    weight_record_id: int,
    db: Session = Depends(get_db),
) -> WeightRecordResponse:
    try:
        return weight_record_service.get_weight_record(db, weight_record_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.patch(
    "/weight-records/{weight_record_id}",
    response_model=WeightRecordResponse,
)
def update_weight_record(
    weight_record_id: int,
    weight_record_data: WeightRecordUpdate,
    db: Session = Depends(get_db),
) -> WeightRecordResponse:
    try:
        return weight_record_service.update_weight_record(
            db, weight_record_id, weight_record_data
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
    "/weight-records/{weight_record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_weight_record(
    weight_record_id: int,
    db: Session = Depends(get_db),
) -> None:
    try:
        weight_record_service.delete_weight_record(db, weight_record_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
