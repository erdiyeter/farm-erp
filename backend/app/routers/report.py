from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.report import (
    AnimalSummaryReport,
    FinanceSummaryReport,
    HealthSummaryReport,
    MilkSummaryReport,
)
from app.services import report as report_service


router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/animals/summary", response_model=AnimalSummaryReport)
def get_animals_summary(
    db: Session = Depends(get_db),
) -> AnimalSummaryReport:
    return report_service.get_animals_summary(db)


@router.get("/milk/summary", response_model=MilkSummaryReport)
def get_milk_summary(
    db: Session = Depends(get_db),
) -> MilkSummaryReport:
    return report_service.get_milk_summary(db)


@router.get("/health/summary", response_model=HealthSummaryReport)
def get_health_summary(
    db: Session = Depends(get_db),
) -> HealthSummaryReport:
    return report_service.get_health_summary(db)


@router.get("/finance/summary", response_model=FinanceSummaryReport)
def get_finance_summary(
    db: Session = Depends(get_db),
) -> FinanceSummaryReport:
    return report_service.get_finance_summary(db)
