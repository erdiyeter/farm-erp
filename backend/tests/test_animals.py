from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.models.health_record import HealthRecord
from app.models.milk_record import MilkRecord
from app.schemas.animal import AnimalCreate, AnimalUpdate
from app.schemas.health_record import HealthRecordCreate
from app.schemas.inventory import InventoryItemCreate
from app.schemas.settings import SettingsUpdate
from app.services import animal as animal_service
from app.services import health_record as health_record_service
from app.services import inventory as inventory_service
from app.services import settings as settings_service


def test_animal_crud_stats_validation_and_soft_delete(db) -> None:
    initial_stats = animal_service.get_animal_stats(db)
    animal_data = AnimalCreate(
        ear_tag=f"TEST-{uuid4().hex[:12]}",
        name="Test Animal",
        sex="Male",
    )

    animal = animal_service.create_animal(db, animal_data)
    stats = animal_service.get_animal_stats(db)

    assert stats.total_active == initial_stats.total_active + 1
    assert stats.male_count == initial_stats.male_count + 1
    assert animal.exit_date is None
    assert animal.exit_reason is None
    assert animal.is_active is True

    with pytest.raises(ValueError, match="Ear tag already exists"):
        animal_service.create_animal(db, animal_data)

    updated = animal_service.update_animal(
        db, animal.id, AnimalUpdate(name="Updated Test Animal")
    )
    assert updated.name == "Updated Test Animal"

    deleted = animal_service.soft_delete_animal(db, animal.id)
    active_ids = {
        active_animal.id
        for active_animal in animal_service.list_active_animals(db)
    }
    assert deleted.is_active is False
    assert deleted.exit_date == date.today()
    assert deleted.exit_reason == "other"
    assert animal.id not in active_ids
    assert (
        animal_service.get_animal_stats(db).total_active
        == initial_stats.total_active
    )


@pytest.mark.parametrize("operation", ["get", "update", "delete"])
def test_animal_missing_id_raises_lookup_error(db, operation) -> None:
    missing_id = 2_000_000_000

    with pytest.raises(LookupError, match="Animal not found"):
        if operation == "get":
            animal_service.get_animal(db, missing_id)
        elif operation == "update":
            animal_service.update_animal(
                db, missing_id, AnimalUpdate(name="Missing")
            )
        else:
            animal_service.soft_delete_animal(db, missing_id)


def test_animal_update_rejects_duplicate_ear_tag(db) -> None:
    first = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"FIRST-{uuid4().hex[:12]}")
    )
    second = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"SECOND-{uuid4().hex[:12]}")
    )

    with pytest.raises(ValueError, match="Ear tag already exists"):
        animal_service.update_animal(
            db, second.id, AnimalUpdate(ear_tag=first.ear_tag)
        )


def test_animal_lifecycle_exited_scenario(db) -> None:
    exit_date = date.today()
    animal = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"EXITED-{uuid4().hex[:12]}",
            exit_date=exit_date,
            exit_reason="sold",
        ),
    )

    assert animal.exit_date == exit_date
    assert animal.exit_reason == "sold"
    assert animal.is_active is False

    updated = animal_service.update_animal(
        db,
        animal.id,
        AnimalUpdate(exit_date=None, exit_reason=None),
    )
    assert updated.exit_date is None
    assert updated.exit_reason is None
    assert updated.is_active is True


def test_animal_lifecycle_rejects_exit_date_without_reason() -> None:
    with pytest.raises(ValidationError, match="Exit reason is required"):
        AnimalCreate(
            ear_tag=f"EXIT-DATE-{uuid4().hex[:12]}",
            exit_date=date.today(),
        )


def test_animal_lifecycle_rejects_exit_reason_without_date() -> None:
    with pytest.raises(ValidationError, match="Exit date is required"):
        AnimalCreate(
            ear_tag=f"EXIT-REASON-{uuid4().hex[:12]}",
            exit_reason="died",
        )


def test_animal_lactation_active_and_ended_scenarios(db) -> None:
    active_start = date(2026, 6, 1)
    ended_start = date(2026, 5, 1)
    ended_end = date(2026, 5, 21)
    active = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"LACT-ACTIVE-{uuid4().hex[:12]}",
            lactation_number=2,
            lactation_start_date=active_start,
        ),
    )
    ended = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"LACT-ENDED-{uuid4().hex[:12]}",
            lactation_number=1,
            lactation_start_date=ended_start,
            lactation_end_date=ended_end,
        ),
    )

    assert active.lactation_status == "Active"
    assert active.active_lactation is True
    assert active.days_in_milk == (date.today() - active_start).days
    assert ended.lactation_status == "Ended"
    assert ended.active_lactation is False
    assert ended.days_in_milk == 20


def test_animal_lactation_rejects_end_before_start() -> None:
    with pytest.raises(ValidationError, match="cannot be before"):
        AnimalCreate(
            ear_tag=f"LACT-BAD-{uuid4().hex[:12]}",
            lactation_start_date=date(2026, 6, 2),
            lactation_end_date=date(2026, 6, 1),
        )


def test_animal_lactation_rejects_end_without_start() -> None:
    with pytest.raises(ValidationError, match="start date is required"):
        AnimalCreate(
            ear_tag=f"LACT-END-{uuid4().hex[:12]}",
            lactation_end_date=date(2026, 6, 1),
        )


def test_animal_economic_fields_optional(db) -> None:
    animal = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"ECON-EMPTY-{uuid4().hex[:12]}")
    )

    assert animal.purchase_date is None
    assert animal.purchase_price is None
    assert animal.sale_price is None


def test_animal_create_and_update_purchase_fields(db) -> None:
    purchase_date = date(2026, 1, 15)
    animal = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"ECON-PURCHASE-{uuid4().hex[:12]}",
            purchase_date=purchase_date,
            purchase_price=Decimal("1250.50"),
        ),
    )

    assert animal.purchase_date == purchase_date
    assert animal.purchase_price == Decimal("1250.50")

    updated = animal_service.update_animal(
        db,
        animal.id,
        AnimalUpdate(
            purchase_date=date(2026, 2, 1),
            purchase_price=Decimal("1300.00"),
        ),
    )
    assert updated.purchase_date == date(2026, 2, 1)
    assert updated.purchase_price == Decimal("1300.00")


def test_animal_sold_lifecycle_allows_sale_price(db) -> None:
    animal = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"ECON-SOLD-{uuid4().hex[:12]}")
    )

    updated = animal_service.update_animal(
        db,
        animal.id,
        AnimalUpdate(
            exit_date=date.today(),
            exit_reason="sold",
            sale_price=Decimal("2100.00"),
        ),
    )

    assert updated.exit_reason == "sold"
    assert updated.is_active is False
    assert updated.sale_price == Decimal("2100.00")


def test_animal_sale_price_allowed_for_non_sold_exit(db) -> None:
    animal = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"ECON-NONSOLD-{uuid4().hex[:12]}",
            exit_date=date.today(),
            exit_reason="died",
            sale_price=Decimal("0.00"),
        ),
    )

    assert animal.exit_reason == "died"
    assert animal.sale_price == Decimal("0.00")


def test_animal_economic_prices_reject_negative_values() -> None:
    with pytest.raises(ValidationError):
        AnimalCreate(
            ear_tag=f"ECON-BAD-PURCHASE-{uuid4().hex[:12]}",
            purchase_price=Decimal("-1.00"),
        )

    with pytest.raises(ValidationError):
        AnimalCreate(
            ear_tag=f"ECON-BAD-SALE-{uuid4().hex[:12]}",
            sale_price=Decimal("-1.00"),
        )


def test_animal_economic_summary_uses_actual_records(db) -> None:
    settings_service.update_settings(
        db, SettingsUpdate(milk_price=Decimal("2.50"))
    )
    animal = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"ECON-CALC-{uuid4().hex[:12]}",
            purchase_price=Decimal("1000.00"),
            sale_price=Decimal("1400.00"),
        ),
    )
    other_animal = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"ECON-OTHER-{uuid4().hex[:12]}")
    )
    db.add_all(
        [
            MilkRecord(
                animal_id=animal.id,
                record_date=date.today(),
                milk_liters=Decimal("12.50"),
                session="morning",
            ),
            MilkRecord(
                animal_id=animal.id,
                record_date=date.today(),
                milk_liters=Decimal("7.25"),
                session="evening",
            ),
            MilkRecord(
                animal_id=other_animal.id,
                record_date=date.today(),
                milk_liters=Decimal("99.00"),
            ),
            HealthRecord(
                animal_id=animal.id,
                record_type="checkup",
                record_date=date.today(),
            ),
            HealthRecord(
                animal_id=other_animal.id,
                record_type="treatment",
                record_date=date.today(),
            ),
        ]
    )
    db.commit()
    inventory_item = inventory_service.create_inventory_item(
        db,
        InventoryItemCreate(
            name=f"Econ Treatment {uuid4().hex[:8]}",
            unit="dose",
            current_quantity=Decimal("10"),
            unit_cost=Decimal("4.00"),
        ),
    )
    health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=animal.id,
            record_type="treatment",
            record_date=date.today(),
            dosage="2",
            inventory_item_id=inventory_item.id,
        ),
    )

    detail = animal_service.get_animal_detail(db, animal.id)
    expected_milk_revenue = Decimal("19.75") * Decimal("2.50")
    expected_health_cost = Decimal("2.00") * Decimal("4.00")

    assert detail.economic_summary is not None
    assert detail.economic_summary.purchase_value == Decimal("1000.00")
    assert detail.economic_summary.sale_value == Decimal("1400.00")
    assert detail.economic_summary.profit_loss == Decimal("400.00")
    assert detail.economic_summary.lifetime_milk_production == Decimal("19.75")
    assert detail.economic_summary.lifetime_milk_revenue == expected_milk_revenue
    assert detail.economic_summary.health_event_count == 2
    assert detail.economic_summary.treatment_count == 1
    assert detail.economic_summary.health_cost == expected_health_cost
    assert detail.economic_summary.net_economic_value == (
        expected_milk_revenue
        + Decimal("1400.00")
        - Decimal("1000.00")
        - expected_health_cost
    )


def test_animal_economic_summary_handles_missing_prices(db) -> None:
    settings_service.update_settings(db, SettingsUpdate(milk_price=None))
    animal = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"ECON-MISSING-{uuid4().hex[:12]}")
    )

    detail = animal_service.get_animal_detail(db, animal.id)

    assert detail.economic_summary is not None
    assert detail.economic_summary.purchase_value is None
    assert detail.economic_summary.sale_value is None
    assert detail.economic_summary.profit_loss is None
    assert detail.economic_summary.lifetime_milk_revenue is None
    assert detail.economic_summary.health_cost is None
    assert detail.economic_summary.net_economic_value is None
    assert detail.economic_summary.lifetime_milk_production == Decimal("0")
    assert detail.economic_summary.health_event_count == 0
    assert detail.economic_summary.treatment_count == 0


def test_animal_economic_score_rankings_are_deterministic_and_active_only(db):
    settings_service.update_settings(
        db, SettingsUpdate(milk_price=Decimal("1.00"))
    )
    strong = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"AAA-SCORE-STRONG-{uuid4().hex[:8]}",
            purchase_price=Decimal("1.00"),
            sale_price=Decimal("999999.00"),
            lactation_start_date=date(2026, 1, 1),
        ),
    )
    lower = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"AAA-SCORE-LOWER-{uuid4().hex[:8]}",
            purchase_price=Decimal("999999.00"),
            sale_price=Decimal("1.00"),
        ),
    )
    exited = animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"AAA-SCORE-EXITED-{uuid4().hex[:8]}",
            purchase_price=Decimal("1.00"),
            sale_price=Decimal("9999.00"),
            exit_date=date.today(),
            exit_reason="sold",
        ),
    )
    db.add_all(
        [
            MilkRecord(
                animal_id=strong.id,
                record_date=date.today(),
                milk_liters=Decimal("100.00"),
            ),
            MilkRecord(
                animal_id=lower.id,
                record_date=date.today(),
                milk_liters=Decimal("1.00"),
            ),
        ]
    )
    db.commit()
    inventory_item = inventory_service.create_inventory_item(
        db,
        InventoryItemCreate(
            name=f"Score Treatment {uuid4().hex[:8]}",
            unit="dose",
            current_quantity=Decimal("10"),
            unit_cost=Decimal("1.00"),
        ),
    )
    health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=strong.id,
            record_type="treatment",
            record_date=date.today(),
            dosage="1",
            inventory_item_id=inventory_item.id,
        ),
    )
    db.add_all(
        [
            HealthRecord(
                animal_id=lower.id,
                record_type="treatment",
                record_date=date.today(),
            ),
            HealthRecord(
                animal_id=lower.id,
                record_type="treatment",
                record_date=date.today(),
            ),
            HealthRecord(
                animal_id=lower.id,
                record_type="checkup",
                record_date=date.today(),
            ),
            HealthRecord(
                animal_id=lower.id,
                record_type="checkup",
                record_date=date.today(),
            ),
        ]
    )
    db.commit()

    strong_score = animal_service.calculate_animal_economic_score(db, strong)
    lower_score = animal_service.calculate_animal_economic_score(db, lower)
    top_rankings, lowest_rankings = (
        animal_service.get_active_animal_economic_rankings(db)
    )
    top_ids = [ranking.animal_id for ranking in top_rankings]
    lowest_ids = [ranking.animal_id for ranking in lowest_rankings]

    assert strong_score > lower_score
    assert top_ids[0] == strong.id
    assert lower.id in lowest_ids
    assert exited.id not in top_ids
    assert exited.id not in lowest_ids
    assert top_rankings[0].rank_position == 1
    assert isinstance(top_rankings[0].economic_score, float)
