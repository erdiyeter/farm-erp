import csv
from io import StringIO

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


def get_health_records_csv(db: Session) -> str:
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

    for record in report_repository.list_health_records_for_export(db):
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


def get_withdrawal_locks_csv(db: Session) -> str:
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
        db
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


def get_milk_records_csv(db: Session) -> str:
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

    for record in report_repository.list_milk_records_for_export(db):
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
