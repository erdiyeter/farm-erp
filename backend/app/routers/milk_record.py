from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.milk_record import (
    MilkRecordCreate,
    MilkRecordListResponse,
    MilkRecordResponse,
)
from app.services import milk_record as milk_record_service


router = APIRouter(tags=["milk-records"])


@router.post(
    "/milk-records",
    response_model=MilkRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_milk_record(
    milk_record_data: MilkRecordCreate,
    db: Session = Depends(get_db),
) -> MilkRecordResponse:
    try:
        return milk_record_service.create_milk_record(db, milk_record_data)
    except ValueError as exc:
        if str(exc) == "Milk record date cannot be in the future":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.get(
    "/milk-records",
    response_model=list[MilkRecordListResponse],
)
def list_milk_records(
    db: Session = Depends(get_db),
) -> list[MilkRecordListResponse]:
    return milk_record_service.list_milk_records(db)


@router.get(
    "/animals/{animal_id}/milk-records",
    response_model=list[MilkRecordListResponse],
)
def list_animal_milk_records(
    animal_id: int,
    db: Session = Depends(get_db),
) -> list[MilkRecordListResponse]:
    return milk_record_service.list_milk_records_by_animal_id(db, animal_id)
