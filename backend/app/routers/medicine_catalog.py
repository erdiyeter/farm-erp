from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.medicine_catalog import (
    MedicineCatalogCreate,
    MedicineCatalogResponse,
    MedicineCatalogUpdate,
)
from app.services import medicine_catalog as medicine_catalog_service


router = APIRouter(prefix="/medicine-catalog", tags=["medicine-catalog"])


@router.get("", response_model=list[MedicineCatalogResponse])
def list_medicine_catalog_records(
    db: Session = Depends(get_db),
) -> list[MedicineCatalogResponse]:
    return medicine_catalog_service.list_medicine_catalog_records(db)


@router.post(
    "",
    response_model=MedicineCatalogResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_medicine_catalog_record(
    medicine_catalog_data: MedicineCatalogCreate,
    db: Session = Depends(get_db),
) -> MedicineCatalogResponse:
    try:
        return medicine_catalog_service.create_medicine_catalog_record(
            db, medicine_catalog_data
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.get("/{medicine_catalog_id}", response_model=MedicineCatalogResponse)
def get_medicine_catalog_record(
    medicine_catalog_id: int,
    db: Session = Depends(get_db),
) -> MedicineCatalogResponse:
    try:
        return medicine_catalog_service.get_medicine_catalog_record(
            db, medicine_catalog_id
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.put("/{medicine_catalog_id}", response_model=MedicineCatalogResponse)
def update_medicine_catalog_record(
    medicine_catalog_id: int,
    medicine_catalog_data: MedicineCatalogUpdate,
    db: Session = Depends(get_db),
) -> MedicineCatalogResponse:
    try:
        return medicine_catalog_service.update_medicine_catalog_record(
            db, medicine_catalog_id, medicine_catalog_data
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
    "/{medicine_catalog_id}", response_model=MedicineCatalogResponse
)
def delete_medicine_catalog_record(
    medicine_catalog_id: int,
    db: Session = Depends(get_db),
) -> MedicineCatalogResponse:
    try:
        return medicine_catalog_service.soft_delete_medicine_catalog_record(
            db, medicine_catalog_id
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
