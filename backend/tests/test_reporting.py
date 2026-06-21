from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.models.health_record import HealthRecord
from app.models.milk_record import MilkRecord
from app.routers.report import validate_date_range
from app.schemas.animal import AnimalCreate
from app.services import animal as animal_service
from app.services import report as report_service


def test_reporting_summary_filters_and_csv_export(db) -> None:
    start_date = date(2098, 2, 10)
    end_date = date(2098, 2, 11)
    initial = report_service.get_report_summary(db, start_date, end_date)
    animal = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"REPORT-{uuid4().hex[:12]}")
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
    db.add_all([milk_in_range, milk_outside_range, health_record])
    db.commit()

    summary = report_service.get_report_summary(db, start_date, end_date)
    milk_csv = report_service.get_milk_records_csv(db, start_date, end_date)
    health_csv = report_service.get_health_records_csv(
        db, start_date, end_date
    )

    assert summary.total_milk_records == initial.total_milk_records + 1
    assert summary.total_milk_liters == initial.total_milk_liters + 12.5
    assert summary.total_health_records == initial.total_health_records + 1
    assert str(milk_in_range.id) in milk_csv
    assert str(milk_outside_range.id) not in milk_csv
    assert str(health_record.id) in health_csv


def test_reporting_rejects_invalid_date_range() -> None:
    with pytest.raises(HTTPException) as exc_info:
        validate_date_range(date(2026, 2, 2), date(2026, 2, 1))

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "start_date cannot be after end_date"
