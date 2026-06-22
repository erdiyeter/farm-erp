from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.main import app
from app.schemas.animal import AnimalCreate
from app.schemas.weight_record import WeightRecordCreate, WeightRecordUpdate
from app.services import animal as animal_service
from app.services import weight_record as weight_record_service


def create_test_animal(db):
    return animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"WEIGHT-{uuid4().hex[:12]}")
    )


def test_weight_record_crud_and_ordering(db) -> None:
    animal = create_test_animal(db)
    yesterday = date.today() - timedelta(days=1)
    first = weight_record_service.create_weight_record(
        db,
        WeightRecordCreate(
            animal_id=animal.id,
            record_date=yesterday,
            weight_kg=Decimal("425.50"),
        ),
    )
    second = weight_record_service.create_weight_record(
        db,
        WeightRecordCreate(
            animal_id=animal.id,
            record_date=date.today(),
            weight_kg=Decimal("430.25"),
        ),
    )
    duplicate_date = weight_record_service.create_weight_record(
        db,
        WeightRecordCreate(
            animal_id=animal.id,
            record_date=date.today(),
            weight_kg=Decimal("431.00"),
        ),
    )

    listed = weight_record_service.list_weight_records_by_animal_id(
        db, animal.id
    )
    assert [record.id for record in listed[:3]] == [
        duplicate_date.id,
        second.id,
        first.id,
    ]

    updated = weight_record_service.update_weight_record(
        db,
        first.id,
        WeightRecordUpdate(weight_kg=Decimal("426.75"), notes="Corrected"),
    )
    assert updated.weight_kg == Decimal("426.75")
    assert updated.notes == "Corrected"

    weight_record_service.delete_weight_record(db, first.id)
    with pytest.raises(LookupError, match="Weight record not found"):
        weight_record_service.get_weight_record(db, first.id)


def test_weight_history_remains_for_inactive_animal(db) -> None:
    animal = create_test_animal(db)
    record = weight_record_service.create_weight_record(
        db,
        WeightRecordCreate(
            animal_id=animal.id,
            record_date=date.today(),
            weight_kg=Decimal("390.00"),
        ),
    )
    animal_service.soft_delete_animal(db, animal.id)

    history = weight_record_service.list_weight_records_by_animal_id(
        db, animal.id
    )
    assert record.id in {item.id for item in history}


def test_weight_record_validation(db) -> None:
    animal = create_test_animal(db)

    with pytest.raises(LookupError, match="Animal not found"):
        weight_record_service.create_weight_record(
            db,
            WeightRecordCreate(
                animal_id=2_000_000_000,
                record_date=date.today(),
                weight_kg=Decimal("100"),
            ),
        )

    with pytest.raises(ValueError, match="cannot be in the future"):
        weight_record_service.create_weight_record(
            db,
            WeightRecordCreate(
                animal_id=animal.id,
                record_date=date.today() + timedelta(days=1),
                weight_kg=Decimal("100"),
            ),
        )

    with pytest.raises(ValidationError):
        WeightRecordCreate(
            animal_id=animal.id,
            record_date=date.today(),
            weight_kg=Decimal("0"),
        )


def test_weight_record_routes_are_registered() -> None:
    registered = {
        (included_router.include_context.prefix + route.path, method)
        for included_router in app.routes
        if hasattr(included_router, "original_router")
        for route in included_router.original_router.routes
        for method in route.methods
    }
    expected = {
        ("/api/v1/weight-records", "POST"),
        ("/api/v1/weight-records", "GET"),
        ("/api/v1/animals/{animal_id}/weight-records", "GET"),
        ("/api/v1/weight-records/{weight_record_id}", "GET"),
        ("/api/v1/weight-records/{weight_record_id}", "PATCH"),
        ("/api/v1/weight-records/{weight_record_id}", "DELETE"),
    }
    assert expected <= registered
