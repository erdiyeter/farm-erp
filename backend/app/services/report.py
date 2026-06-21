import csv
from datetime import date
from io import StringIO

from sqlalchemy.orm import Session

from app.repositories import report as report_repository
from app.schemas.report import (
    AnimalSummaryReport,
    FinanceSummaryReport,
    HealthSummaryReport,
    MilkSummaryReport,
    ReportDetails,
    ReportSummary,
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


def get_report_summary(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> ReportSummary:
    return ReportSummary(
        total_animals=report_repository.count_animals(db),
        total_milk_records=report_repository.count_filtered_milk_records(
            db, start_date, end_date
        ),
        total_milk_liters=float(
            report_repository.get_filtered_milk_total(
                db, start_date, end_date
            )
        ),
        total_health_records=report_repository.count_filtered_health_records(
            db, start_date, end_date
        ),
        total_income=float(
            report_repository.get_financial_total(
                db, "income", start_date, end_date
            )
        ),
        total_expense=float(
            report_repository.get_financial_total(
                db, "expense", start_date, end_date
            )
        ),
        active_withdrawal_locks=report_repository.count_active_withdrawal_locks(
            db, start_date, end_date
        ),
        open_alarms=report_repository.count_open_alarms(
            db, start_date, end_date
        ),
    )


def get_report_details(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> ReportDetails:
    return ReportDetails(
        milk_records=report_repository.list_milk_records_for_export(
            db, start_date, end_date
        ),
        health_records=report_repository.list_health_records_for_export(
            db, start_date, end_date
        ),
        financial_records=report_repository.list_financial_records_for_report(
            db, start_date, end_date
        ),
        withdrawal_locks=report_repository.list_withdrawal_locks_for_export(
            db, start_date, end_date
        ),
        alarms=report_repository.list_alarms_for_report(
            db, start_date, end_date
        ),
    )


def get_animals_csv(db: Session) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "id",
            "ear_tag",
            "name",
            "species",
            "breed",
            "sex",
            "birth_date",
            "is_active",
        ]
    )

    for animal in report_repository.list_animals_for_export(db):
        writer.writerow(
            [
                animal.id,
                animal.ear_tag,
                animal.name,
                animal.species,
                animal.breed,
                animal.sex,
                animal.birth_date,
                animal.is_active,
            ]
        )

    return output.getvalue()


def get_health_records_csv(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "id",
            "animal_id",
            "record_type",
            "diagnosis",
            "treatment",
            "medicine_name",
            "dosage",
            "record_date",
            "withdrawal_end_date",
        ]
    )

    for record in report_repository.list_health_records_for_export(
        db, start_date, end_date
    ):
        writer.writerow(
            [
                record.id,
                record.animal_id,
                record.record_type,
                record.diagnosis,
                record.treatment,
                record.medicine_name,
                record.dosage,
                record.record_date,
                record.withdrawal_end_date,
            ]
        )

    return output.getvalue()


def get_withdrawal_locks_csv(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "id",
            "animal_id",
            "health_record_id",
            "start_date",
            "end_date",
            "reason",
            "is_active",
        ]
    )

    for withdrawal_lock in report_repository.list_withdrawal_locks_for_export(
        db, start_date, end_date
    ):
        writer.writerow(
            [
                withdrawal_lock.id,
                withdrawal_lock.animal_id,
                withdrawal_lock.health_record_id,
                withdrawal_lock.start_date,
                withdrawal_lock.end_date,
                withdrawal_lock.reason,
                withdrawal_lock.is_active,
            ]
        )

    return output.getvalue()


def get_milk_records_csv(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> str:
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "id",
            "animal_id",
            "record_date",
            "milk_liters",
            "session",
            "notes",
        ]
    )

    for record in report_repository.list_milk_records_for_export(
        db, start_date, end_date
    ):
        writer.writerow(
            [
                record.id,
                record.animal_id,
                record.record_date,
                record.milk_liters,
                record.session,
                record.notes,
            ]
        )

    return output.getvalue()
