from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.models.finance import FinancialRecord
from app.models.health_record import HealthRecord
from app.models.milk_record import MilkRecord
from app.models.reproduction_event import ReproductionEvent
from app.models.weight_record import WeightRecord
from app.routers.report import validate_date_range
from app.schemas.animal import AnimalCreate
from app.services import animal as animal_service
from app.services import report as report_service


def test_reporting_summary_filters_and_csv_export(db) -> None:
    start_date = date(2098, 2, 10)
    end_date = date(2098, 2, 11)
    initial = report_service.get_report_summary(db, start_date, end_date)
    animal = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"REPORT-{uuid4().hex[:12]}",
            lactation_number=3,
            lactation_start_date=date.today(),
        ),
    )
    exited_sold = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"EXIT-SOLD-{uuid4().hex[:12]}",
            exit_date=end_date,
            exit_reason="sold",
        ),
    )
    exited_died = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"EXIT-DIED-{uuid4().hex[:12]}",
            exit_date=end_date,
            exit_reason="died",
        ),
    )
    animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"EXIT-OUT-{uuid4().hex[:12]}",
            exit_date=date(2098, 2, 12),
            exit_reason="transferred",
        ),
    )
    milk_in_range = MilkRecord(
        animal_id=animal.id,
        record_date=start_date,
        milk_liters=Decimal("12.50"),
        session="morning",
    )
    milk_outside_range = MilkRecord(
        animal_id=animal.id,
        record_date=date(2098, 2, 12),
        milk_liters=Decimal("7.00"),
        session="evening",
    )
    health_record = HealthRecord(
        animal_id=animal.id,
        record_type="checkup",
        diagnosis="Reporting test",
        record_date=end_date,
    )
    weight_in_range = WeightRecord(
        animal_id=animal.id,
        record_date=end_date,
        weight_kg=Decimal("425.50"),
        notes="Reporting test",
    )
    weight_previous_in_range = WeightRecord(
        animal_id=animal.id,
        record_date=start_date,
        weight_kg=Decimal("420.00"),
    )
    weight_outside_range = WeightRecord(
        animal_id=animal.id,
        record_date=date(2098, 2, 12),
        weight_kg=Decimal("430.00"),
    )
    mating_event = ReproductionEvent(
        animal_id=animal.id,
        event_type="mating",
        event_date=start_date,
        pregnancy_outcome="unknown",
    )
    pregnancy_event = ReproductionEvent(
        animal_id=animal.id,
        event_type="pregnancy",
        event_date=start_date,
        pregnancy_status=True,
        pregnancy_outcome="pregnant",
    )
    birth_event = ReproductionEvent(
        animal_id=animal.id,
        event_type="birth",
        event_date=end_date,
        offspring_count=2,
        pregnancy_outcome="birth",
    )
    abortion_event = ReproductionEvent(
        animal_id=animal.id,
        event_type="pregnancy",
        event_date=end_date,
        pregnancy_status=True,
        pregnancy_outcome="abortion",
    )
    failed_event = ReproductionEvent(
        animal_id=animal.id,
        event_type="pregnancy",
        event_date=end_date,
        pregnancy_status=False,
        pregnancy_outcome="failed",
    )
    reproduction_outside_range = ReproductionEvent(
        animal_id=animal.id,
        event_type="birth",
        event_date=date(2098, 2, 12),
        offspring_count=1,
        pregnancy_outcome="birth",
    )
    db.add_all(
        [
            milk_in_range,
            milk_outside_range,
            health_record,
            weight_in_range,
            weight_previous_in_range,
            weight_outside_range,
            mating_event,
            pregnancy_event,
            birth_event,
            abortion_event,
            failed_event,
            reproduction_outside_range,
        ]
    )
    db.commit()

    summary = report_service.get_report_summary(db, start_date, end_date)
    milk_csv = report_service.get_milk_records_csv(db, start_date, end_date)
    health_csv = report_service.get_health_records_csv(
        db, start_date, end_date
    )
    weight_csv = report_service.get_weight_records_csv(
        db, start_date, end_date
    )

    assert summary.total_milk_records == initial.total_milk_records + 1
    assert summary.total_milk_liters == initial.total_milk_liters + 12.5
    assert summary.average_daily_milk == 12.5
    assert summary.animals_in_lactation >= initial.animals_in_lactation + 1
    assert summary.active_lactations >= initial.active_lactations + 1
    assert summary.average_days_in_milk is not None
    assert summary.total_health_records == initial.total_health_records + 1
    assert summary.total_weight_records == initial.total_weight_records + 2
    assert summary.latest_weight_kg == 425.5
    assert summary.latest_weight_record_date == end_date
    assert summary.average_weight_change_kg == 5.5
    assert summary.animals_with_weight_change == 1
    assert summary.total_reproduction_events == 5
    assert summary.total_matings == 1
    assert summary.total_pregnancies == 2
    assert summary.total_births == 1
    assert summary.total_offspring == 2
    assert summary.twin_births == 1
    assert summary.pregnant_outcomes == 1
    assert summary.abortion_outcomes == 1
    assert summary.failed_outcomes == 1
    assert summary.unknown_outcomes == 1
    assert summary.animals_with_reproduction_history == 1
    assert summary.last_birth_date == end_date
    assert summary.total_exited_animals == initial.total_exited_animals + 2
    assert summary.sold_exits == initial.sold_exits + 1
    assert summary.mortality_exits == initial.mortality_exits + 1
    assert {item.exit_reason: item.count for item in summary.exits_by_reason}[
        "sold"
    ] >= 1
    assert any(
        row.startswith(f"{milk_in_range.id},")
        for row in milk_csv.splitlines()
    )
    assert not any(
        row.startswith(f"{milk_outside_range.id},")
        for row in milk_csv.splitlines()
    )
    assert any(
        row.startswith(f"{health_record.id},")
        for row in health_csv.splitlines()
    )
    assert any(
        row.startswith(f"{weight_in_range.id},")
        for row in weight_csv.splitlines()
    )
    assert any(
        row.startswith(f"{weight_previous_in_range.id},")
        for row in weight_csv.splitlines()
    )
    assert not any(
        row.startswith(f"{weight_outside_range.id},")
        for row in weight_csv.splitlines()
    )

    details = report_service.get_report_details(db, start_date, end_date)
    exited_ids = {animal.id for animal in details.exited_animals}
    assert {exited_sold.id, exited_died.id} <= exited_ids
    reproduction_ids = {event.id for event in details.reproduction_events}
    assert {
        mating_event.id,
        pregnancy_event.id,
        birth_event.id,
        abortion_event.id,
        failed_event.id,
    } <= reproduction_ids
    assert reproduction_outside_range.id not in reproduction_ids


def test_reporting_rejects_invalid_date_range() -> None:
    with pytest.raises(HTTPException) as exc_info:
        validate_date_range(date(2026, 2, 2), date(2026, 2, 1))

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "start_date cannot be after end_date"


def test_reporting_empty_filtered_period_returns_zero_values(db) -> None:
    empty_date = date(9999, 12, 31)
    summary = report_service.get_report_summary(db, empty_date, empty_date)
    details = report_service.get_report_details(db, empty_date, empty_date)

    assert summary.total_milk_records == 0
    assert summary.total_milk_liters == 0
    assert summary.average_daily_milk == 0
    assert summary.animals_in_lactation >= 0
    assert summary.active_lactations >= 0
    assert summary.total_health_records == 0
    assert summary.total_weight_records == 0
    assert summary.latest_weight_kg is None
    assert summary.latest_weight_record_date is None
    assert summary.average_weight_change_kg is None
    assert summary.animals_with_weight_change == 0
    assert summary.total_reproduction_events == 0
    assert summary.total_matings == 0
    assert summary.total_pregnancies == 0
    assert summary.total_births == 0
    assert summary.total_offspring == 0
    assert summary.twin_births == 0
    assert summary.pregnant_outcomes == 0
    assert summary.abortion_outcomes == 0
    assert summary.failed_outcomes == 0
    assert summary.unknown_outcomes == 0
    assert summary.animals_with_reproduction_history == 0
    assert summary.last_birth_date is None
    assert summary.total_exited_animals == 0
    assert summary.sold_exits == 0
    assert summary.mortality_exits == 0
    assert summary.exits_by_reason == []
    assert summary.total_income == 0
    assert summary.total_expense == 0
    assert summary.herd_trends.milk_production.current_value == 0
    assert summary.herd_trends.milk_production.previous_value == 0
    assert summary.herd_trends.milk_production.direction == "no_data"
    assert details.milk_records == []
    assert details.health_records == []
    assert details.weight_records == []
    assert details.reproduction_events == []
    assert details.exited_animals == []
    assert details.financial_records == []


def test_herd_kpis_and_trends_use_existing_records(db) -> None:
    today = date.today()
    current_date = today
    previous_date = today - timedelta(days=30)
    initial = report_service.get_report_summary(db)

    active_animal = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"HERD-ACTIVE-{uuid4().hex[:12]}",
            purchase_price=Decimal("100.00"),
            sale_price=Decimal("250.00"),
        ),
    )
    animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"HERD-SOLD-{uuid4().hex[:12]}",
            exit_date=current_date,
            exit_reason="sold",
        ),
    )
    animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"HERD-DIED-{uuid4().hex[:12]}",
            exit_date=current_date,
            exit_reason="died",
        ),
    )
    db.add_all(
        [
            MilkRecord(
                animal_id=active_animal.id,
                record_date=current_date,
                milk_liters=Decimal("30.00"),
                session="morning",
            ),
            MilkRecord(
                animal_id=active_animal.id,
                record_date=previous_date,
                milk_liters=Decimal("10.00"),
                session="morning",
            ),
            WeightRecord(
                animal_id=active_animal.id,
                record_date=current_date,
                weight_kg=Decimal("300.00"),
            ),
            WeightRecord(
                animal_id=active_animal.id,
                record_date=previous_date,
                weight_kg=Decimal("100.00"),
            ),
            HealthRecord(
                animal_id=active_animal.id,
                record_type="checkup",
                diagnosis="Current herd trend",
                record_date=current_date,
            ),
            HealthRecord(
                animal_id=active_animal.id,
                record_type="checkup",
                diagnosis="Previous herd trend",
                record_date=previous_date,
            ),
            FinancialRecord(
                record_type="income",
                category="Herd trend",
                amount=Decimal("120.00"),
                record_date=current_date,
                description="Current trend income",
            ),
            FinancialRecord(
                record_type="expense",
                category="Herd trend",
                amount=Decimal("20.00"),
                record_date=current_date,
                description="Current trend expense",
            ),
            FinancialRecord(
                record_type="income",
                category="Herd trend",
                amount=Decimal("50.00"),
                record_date=previous_date,
                description="Previous trend income",
            ),
            FinancialRecord(
                record_type="expense",
                category="Herd trend",
                amount=Decimal("10.00"),
                record_date=previous_date,
                description="Previous trend expense",
            ),
        ]
    )
    db.commit()

    summary = report_service.get_report_summary(db)

    assert summary.herd_kpis.total_animals == (
        initial.herd_kpis.total_animals + 3
    )
    assert summary.herd_kpis.active_animals == (
        initial.herd_kpis.active_animals + 1
    )
    assert summary.herd_kpis.exited_animals == (
        initial.herd_kpis.exited_animals + 2
    )
    assert summary.herd_kpis.sales_count == initial.herd_kpis.sales_count + 1
    assert summary.herd_kpis.mortality_count == (
        initial.herd_kpis.mortality_count + 1
    )
    assert summary.herd_kpis.exit_rate == (
        summary.herd_kpis.exited_animals / summary.herd_kpis.total_animals
    )
    assert summary.herd_kpis.average_economic_score is not None
    assert summary.herd_kpis.highest_economic_score is not None
    assert summary.herd_kpis.lowest_economic_score is not None
    assert summary.herd_trends.milk_production.current_value == (
        initial.herd_trends.milk_production.current_value + 30
    )
    assert summary.herd_trends.milk_production.previous_value == (
        initial.herd_trends.milk_production.previous_value + 10
    )
    assert summary.herd_trends.weight.current_value == (
        initial.herd_trends.weight.current_value + 300
    )
    assert summary.herd_trends.weight.previous_value == (
        initial.herd_trends.weight.previous_value + 100
    )
    assert summary.herd_trends.health_activity.current_value == (
        initial.herd_trends.health_activity.current_value + 1
    )
    assert summary.herd_trends.health_activity.previous_value == (
        initial.herd_trends.health_activity.previous_value + 1
    )
    assert summary.herd_trends.financial.current_value == (
        initial.herd_trends.financial.current_value + 100
    )
    assert summary.herd_trends.financial.previous_value == (
        initial.herd_trends.financial.previous_value + 40
    )
    assert summary.herd_trends.economic_score.direction in {
        "no_baseline",
        "no_data",
    }
