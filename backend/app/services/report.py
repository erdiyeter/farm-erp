from sqlalchemy.orm import Session

from app.repositories import report as report_repository
from app.schemas.report import (
    AnimalSummaryReport,
    FinanceSummaryReport,
    HealthSummaryReport,
    MilkSummaryReport,
)


def get_animals_summary(db: Session) -> AnimalSummaryReport:
    return AnimalSummaryReport(
        total_animals=report_repository.count_animals(db),
        active_animals=report_repository.count_active_animals(db),
        inactive_animals=report_repository.count_inactive_animals(db),
    )


def get_milk_summary(db: Session) -> MilkSummaryReport:
    return MilkSummaryReport(
        today_milk_liters=float(report_repository.get_today_milk_total(db)),
        last_7_days_milk_liters=float(
            report_repository.get_last_7_days_milk_total(db)
        ),
        total_milk_records=report_repository.count_milk_records(db),
    )


def get_health_summary(db: Session) -> HealthSummaryReport:
    return HealthSummaryReport(
        total_health_records=report_repository.count_health_records(db),
        today_health_records=report_repository.count_today_health_records(db),
        active_withdrawal_health_records=report_repository.count_active_withdrawal_health_records(
            db
        ),
    )


def get_finance_summary(db: Session) -> FinanceSummaryReport:
    income_records = report_repository.count_financial_records_by_type(
        db, "income"
    )
    expense_records = report_repository.count_financial_records_by_type(
        db, "expense"
    )

    return FinanceSummaryReport(
        total_income_records=income_records,
        total_expense_records=expense_records,
        net_record_count=income_records - expense_records,
    )
