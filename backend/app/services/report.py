import csv
from datetime import date
from io import StringIO

from sqlalchemy.orm import Session

from app.repositories import report as report_repository
from app.schemas.report import (
    AnimalSummaryReport,
    ExitReasonCount,
    FinanceSummaryReport,
    HealthSummaryReport,
    MilkSummaryReport,
    ReportDetails,
    ReportSummary,
)


def get_weight_change_metrics(
    weight_records,
) -> tuple[object | None, float | None, int]:
    sorted_records = sorted(
        weight_records,
        key=lambda record: (record.record_date, record.id),
        reverse=True,
    )
    latest_record = sorted_records[0] if sorted_records else None
    records_by_animal = {}
    for record in sorted_records:
        records_by_animal.setdefault(record.animal_id, []).append(record)

    changes = []
    for records in records_by_animal.values():
        if len(records) < 2:
            continue
        latest, previous = records[0], records[1]
        if latest.record_date == previous.record_date:
            continue
        changes.append(float(latest.weight_kg - previous.weight_kg))

    average_change = sum(changes) / len(changes) if changes else None
    return latest_record, average_change, len(changes)


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
    total_milk = report_repository.get_filtered_milk_total(
        db, start_date, end_date
    )
    milk_days = report_repository.count_filtered_milk_days(
        db, start_date, end_date
    )
    weight_records = report_repository.list_weight_records_for_export(
        db, start_date, end_date
    )
    latest_weight_record, average_weight_change, animals_with_weight_change = (
        get_weight_change_metrics(weight_records)
    )

    return ReportSummary(
        total_animals=report_repository.count_animals(db),
        total_milk_records=report_repository.count_filtered_milk_records(
            db, start_date, end_date
        ),
        total_milk_liters=float(total_milk),
        average_daily_milk=float(total_milk / milk_days) if milk_days else 0,
        animals_in_lactation=report_repository.count_animals_in_lactation(db),
        active_lactations=report_repository.count_animals_in_lactation(db),
        average_days_in_milk=report_repository.get_average_active_days_in_milk(
            db
        ),
        total_health_records=report_repository.count_filtered_health_records(
            db, start_date, end_date
        ),
        total_weight_records=report_repository.count_filtered_weight_records(
            db, start_date, end_date
        ),
        latest_weight_kg=(
            float(latest_weight_record.weight_kg)
            if latest_weight_record
            else None
        ),
        latest_weight_record_date=(
            latest_weight_record.record_date if latest_weight_record else None
        ),
        average_weight_change_kg=average_weight_change,
        animals_with_weight_change=animals_with_weight_change,
        total_reproduction_events=report_repository.count_filtered_reproduction_events(
            db, start_date, end_date
        ),
        total_matings=report_repository.count_filtered_reproduction_events_by_type(
            db, "mating", start_date, end_date
        ),
        total_pregnancies=report_repository.count_filtered_reproduction_events_by_type(
            db, "pregnancy", start_date, end_date
        ),
        total_births=report_repository.count_filtered_reproduction_events_by_type(
            db, "birth", start_date, end_date
        ),
        total_offspring=report_repository.get_filtered_offspring_total(
            db, start_date, end_date
        ),
        twin_births=report_repository.count_filtered_twin_births(
            db, start_date, end_date
        ),
        pregnant_outcomes=report_repository.count_filtered_pregnancy_outcomes(
            db, "pregnant", start_date, end_date
        ),
        abortion_outcomes=report_repository.count_filtered_pregnancy_outcomes(
            db, "abortion", start_date, end_date
        ),
        failed_outcomes=report_repository.count_filtered_pregnancy_outcomes(
            db, "failed", start_date, end_date
        ),
        unknown_outcomes=report_repository.count_filtered_pregnancy_outcomes(
            db, "unknown", start_date, end_date
        ),
        animals_with_reproduction_history=report_repository.count_animals_with_reproduction_history(
            db, start_date, end_date
        ),
        last_birth_date=report_repository.get_latest_birth_date(
            db, start_date, end_date
        ),
        total_exited_animals=report_repository.count_exited_animals(
            db, start_date, end_date
        ),
        sold_exits=report_repository.count_exits_by_reason(
            db, "sold", start_date, end_date
        ),
        mortality_exits=report_repository.count_exits_by_reason(
            db, "died", start_date, end_date
        ),
        exits_by_reason=[
            ExitReasonCount(exit_reason=reason, count=count)
            for reason, count in report_repository.list_exit_reason_counts(
                db, start_date, end_date
            )
        ],
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
        weight_records=report_repository.list_weight_records_for_export(
            db, start_date, end_date
        ),
        reproduction_events=report_repository.list_reproduction_events_for_report(
            db, start_date, end_date
        ),
        exited_animals=report_repository.list_exited_animals_for_report(
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


def get_weight_records_csv(
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
            "weight_kg",
            "notes",
        ]
    )

    for record in report_repository.list_weight_records_for_export(
        db, start_date, end_date
    ):
        writer.writerow(
            [
                record.id,
                record.animal_id,
                record.record_date,
                record.weight_kg,
                record.notes,
            ]
        )

    return output.getvalue()
