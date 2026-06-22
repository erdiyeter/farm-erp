from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.report import (
    AnimalSummaryReport,
    FinanceSummaryReport,
    HealthSummaryReport,
    MilkSummaryReport,
    ReportDetails,
    ReportSummary,
)
from app.services import report as report_service


router = APIRouter(prefix="/reports", tags=["reports"])


def validate_date_range(
    start_date: date | None, end_date: date | None
) -> None:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date cannot be after end_date",
        )


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


@router.get("/summary", response_model=ReportSummary)
def get_report_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
) -> ReportSummary:
    validate_date_range(start_date, end_date)
    return report_service.get_report_summary(db, start_date, end_date)


@router.get("/details", response_model=ReportDetails)
def get_report_details(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
) -> ReportDetails:
    validate_date_range(start_date, end_date)
    return report_service.get_report_details(db, start_date, end_date)


@router.get("/animals/export.csv")
def export_animals_csv(db: Session = Depends(get_db)) -> Response:
    return csv_response(
        report_service.get_animals_csv(db),
        "animals_export.csv",
    )


@router.get("/health-records/export.csv")
def export_health_records_csv(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
) -> Response:
    validate_date_range(start_date, end_date)
    return csv_response(
        report_service.get_health_records_csv(db, start_date, end_date),
        "health_records_export.csv",
    )


@router.get("/withdrawal-locks/export.csv")
def export_withdrawal_locks_csv(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
) -> Response:
    validate_date_range(start_date, end_date)
    return csv_response(
        report_service.get_withdrawal_locks_csv(db, start_date, end_date),
        "withdrawal_locks_export.csv",
    )


@router.get("/milk-records/export.csv")
def export_milk_records_csv(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
) -> Response:
    validate_date_range(start_date, end_date)
    return csv_response(
        report_service.get_milk_records_csv(db, start_date, end_date),
        "milk_records_export.csv",
    )


@router.get("/weight-records/export.csv")
def export_weight_records_csv(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
) -> Response:
    validate_date_range(start_date, end_date)
    return csv_response(
        report_service.get_weight_records_csv(db, start_date, end_date),
        "weight_records_export.csv",
    )
