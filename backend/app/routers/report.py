from fastapi import APIRouter, Depends, Response
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


def csv_response(content: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )


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


@router.get("/animals/export.csv")
def export_animals_csv(db: Session = Depends(get_db)) -> Response:
    return csv_response(
        report_service.get_animals_csv(db),
        "animals_export.csv",
    )


@router.get("/health-records/export.csv")
def export_health_records_csv(db: Session = Depends(get_db)) -> Response:
    return csv_response(
        report_service.get_health_records_csv(db),
        "health_records_export.csv",
    )


@router.get("/withdrawal-locks/export.csv")
def export_withdrawal_locks_csv(db: Session = Depends(get_db)) -> Response:
    return csv_response(
        report_service.get_withdrawal_locks_csv(db),
        "withdrawal_locks_export.csv",
    )


@router.get("/milk-records/export.csv")
def export_milk_records_csv(db: Session = Depends(get_db)) -> Response:
    return csv_response(
        report_service.get_milk_records_csv(db),
        "milk_records_export.csv",
    )
