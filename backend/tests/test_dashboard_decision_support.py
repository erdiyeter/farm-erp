from datetime import date
from decimal import Decimal
from uuid import uuid4

from app.models.health_record import HealthRecord
from app.models.milk_record import MilkRecord
from app.models.weight_record import WeightRecord
from app.schemas.animal import AnimalCreate
from app.schemas.health_record import HealthRecordCreate
from app.schemas.inventory import InventoryItemCreate
from app.schemas.settings import SettingsUpdate
from app.schemas.withdrawal_lock import WithdrawalLockCreate
from app.services import animal as animal_service
from app.services import dashboard as dashboard_service
from app.services import health_record as health_record_service
from app.services import inventory as inventory_service
from app.services import settings as settings_service
from app.services import withdrawal_lock as withdrawal_lock_service


def create_dashboard_test_animal(db, prefix: str, **kwargs):
    return animal_service.create_animal(
        db,
        AnimalCreate(
            ear_tag=f"AAA-{prefix}-{uuid4().hex[:8]}",
            **kwargs,
        ),
    )


def seed_costed_treatment(db, animal_id: int) -> None:
    inventory_item = inventory_service.create_inventory_item(
        db,
        InventoryItemCreate(
            name=f"Dashboard Treatment {uuid4().hex[:8]}",
            unit="dose",
            current_quantity=Decimal("10"),
            unit_cost=Decimal("5.00"),
        ),
    )
    health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=animal_id,
            record_type="treatment",
            record_date=date.today(),
            dosage="1",
            inventory_item_id=inventory_item.id,
        ),
    )


def test_dashboard_decision_support_indicators_change_with_seeded_records(db):
    settings_service.update_settings(
        db, SettingsUpdate(milk_price=Decimal("1.00"))
    )
    baseline = dashboard_service.get_dashboard_summary(db).decision_support

    negative_animal = create_dashboard_test_animal(
        db,
        "NEG",
        purchase_price=Decimal("1000.00"),
        sale_price=Decimal("100.00"),
    )
    seed_costed_treatment(db, negative_animal.id)

    withdrawal_animal = create_dashboard_test_animal(db, "LOCK")
    withdrawal_lock_service.create_withdrawal_lock(
        db,
        WithdrawalLockCreate(
            animal_id=withdrawal_animal.id,
            start_date=date.today(),
            end_date=date.today(),
            reason="Dashboard decision support test",
        ),
    )

    repeated_treatment_animal = create_dashboard_test_animal(db, "REPEAT")
    db.add_all(
        [
            HealthRecord(
                animal_id=repeated_treatment_animal.id,
                record_type="treatment",
                record_date=date.today(),
            ),
            HealthRecord(
                animal_id=repeated_treatment_animal.id,
                record_type="treatment",
                record_date=date.today(),
            ),
            HealthRecord(
                animal_id=repeated_treatment_animal.id,
                record_type="treatment",
                record_date=date.today(),
            ),
        ]
    )
    db.commit()

    exited_animal = create_dashboard_test_animal(
        db,
        "EXIT",
        exit_date=date.today(),
        exit_reason="sold",
    )

    summary = dashboard_service.get_dashboard_summary(db).decision_support

    assert (
        summary.animals_with_negative_economic_value
        == baseline.animals_with_negative_economic_value + 1
    )
    assert (
        summary.animals_with_active_withdrawal_locks
        == baseline.animals_with_active_withdrawal_locks + 1
    )
    assert (
        summary.animals_with_repeated_treatments
        == baseline.animals_with_repeated_treatments + 1
    )
    assert (
        summary.recently_exited_animals
        == baseline.recently_exited_animals + 1
    )
    assert (
        summary.animals_requiring_attention
        == baseline.animals_requiring_attention + 4
    )

    attention_ids = {
        animal.animal_id for animal in summary.attention_required_animals
    }
    negative_ids = {
        animal.animal_id
        for animal in summary.negative_economic_value_animals
    }
    exited_ids = {
        animal.animal_id for animal in summary.recently_exited_animal_list
    }

    assert negative_animal.id in attention_ids
    assert withdrawal_animal.id in attention_ids
    assert repeated_treatment_animal.id in attention_ids
    assert exited_animal.id in attention_ids
    assert negative_animal.id in negative_ids
    assert exited_animal.id in exited_ids

    clean_animal = create_dashboard_test_animal(db, "CLEAR")
    updated_summary = dashboard_service.get_dashboard_summary(
        db
    ).decision_support
    updated_attention_ids = {
        animal.animal_id
        for animal in updated_summary.attention_required_animals
    }

    assert (
        updated_summary.animals_requiring_attention
        == summary.animals_requiring_attention
    )
    assert clean_animal.id not in updated_attention_ids


def test_dashboard_decision_support_rankings_order_seeded_records(db):
    settings_service.update_settings(
        db, SettingsUpdate(milk_price=Decimal("1.00"))
    )

    top_economic = create_dashboard_test_animal(
        db,
        "RANK-ECON-TOP",
        purchase_price=Decimal("1.00"),
        sale_price=Decimal("999999.00"),
    )
    bottom_economic = create_dashboard_test_animal(
        db,
        "RANK-ECON-BOTTOM",
        purchase_price=Decimal("999999.00"),
        sale_price=Decimal("1.00"),
    )
    seed_costed_treatment(db, top_economic.id)
    seed_costed_treatment(db, bottom_economic.id)

    top_milk = create_dashboard_test_animal(db, "RANK-MILK-TOP")
    low_milk = create_dashboard_test_animal(db, "RANK-MILK-LOW")
    no_data = create_dashboard_test_animal(db, "RANK-NODATA")
    db.add_all(
        [
            MilkRecord(
                animal_id=top_milk.id,
                record_date=date.today(),
                milk_liters=Decimal("9999.99"),
            ),
            MilkRecord(
                animal_id=low_milk.id,
                record_date=date.today(),
                milk_liters=Decimal("1.00"),
            ),
        ]
    )

    most_treated = create_dashboard_test_animal(db, "RANK-TREAT")
    for _ in range(7):
        db.add(
            HealthRecord(
                animal_id=most_treated.id,
                record_type="treatment",
                record_date=date.today(),
            )
        )

    highest_gain = create_dashboard_test_animal(db, "RANK-WEIGHT-HIGH")
    lowest_gain = create_dashboard_test_animal(db, "RANK-WEIGHT-LOW")
    db.add_all(
        [
            WeightRecord(
                animal_id=highest_gain.id,
                record_date=date(2026, 1, 1),
                weight_kg=Decimal("100.00"),
            ),
            WeightRecord(
                animal_id=highest_gain.id,
                record_date=date(2026, 2, 1),
                weight_kg=Decimal("9000.00"),
            ),
            WeightRecord(
                animal_id=lowest_gain.id,
                record_date=date(2026, 1, 1),
                weight_kg=Decimal("9000.00"),
            ),
            WeightRecord(
                animal_id=lowest_gain.id,
                record_date=date(2026, 2, 1),
                weight_kg=Decimal("100.00"),
            ),
        ]
    )
    db.commit()

    rankings = dashboard_service.get_dashboard_summary(db).decision_support

    assert rankings.top_economic_animals[0].animal_id == top_economic.id
    assert rankings.bottom_economic_animals[0].animal_id == bottom_economic.id
    assert rankings.top_milk_producers[0].animal_id == top_milk.id
    assert rankings.low_milk_producers[0].animal_id == low_milk.id
    assert rankings.most_treated_animals[0].animal_id == most_treated.id
    assert rankings.highest_weight_gain_animals[0].animal_id == highest_gain.id
    assert rankings.lowest_weight_gain_animals[0].animal_id == lowest_gain.id

    ranking_ids = {
        item.animal_id
        for ranking in [
            rankings.top_economic_animals,
            rankings.bottom_economic_animals,
            rankings.top_milk_producers,
            rankings.low_milk_producers,
            rankings.most_treated_animals,
            rankings.highest_weight_gain_animals,
            rankings.lowest_weight_gain_animals,
        ]
        for item in ranking
    }
    assert no_data.id not in ranking_ids
