from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.finance import (
    FinancialRecordCreate,
    FinancialRecordResponse,
    FinancialRecordUpdate,
)
from app.services import finance as finance_service


router = APIRouter(tags=["Finance"])


@router.get("", response_model=list[FinancialRecordResponse])
def list_financial_records(
    db: Session = Depends(get_db),
) -> list[FinancialRecordResponse]:
    return finance_service.list_financial_records(db)


@router.post(
    "",
    response_model=FinancialRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_financial_record(
    financial_record_data: FinancialRecordCreate,
    db: Session = Depends(get_db),
) -> FinancialRecordResponse:
    return finance_service.create_financial_record(
        db, financial_record_data
    )


@router.get("/{finance_record_id}", response_model=FinancialRecordResponse)
def get_financial_record(
    finance_record_id: int,
    db: Session = Depends(get_db),
) -> FinancialRecordResponse:
    try:
        return finance_service.get_financial_record(db, finance_record_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.patch("/{finance_record_id}", response_model=FinancialRecordResponse)
def update_financial_record(
    finance_record_id: int,
    financial_record_data: FinancialRecordUpdate,
    db: Session = Depends(get_db),
) -> FinancialRecordResponse:
    try:
        return finance_service.update_financial_record(
            db, finance_record_id, financial_record_data
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.delete("/{finance_record_id}", response_model=FinancialRecordResponse)
def delete_financial_record(
    finance_record_id: int,
    db: Session = Depends(get_db),
) -> FinancialRecordResponse:
    try:
        return finance_service.soft_delete_financial_record(
            db, finance_record_id
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
