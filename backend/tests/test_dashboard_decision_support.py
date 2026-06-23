from datetime import date
from decimal import Decimal
from uuid import uuid4

from app.models.health_record import HealthRecord
from app.models.milk_record import MilkRecord
from app.models.weight_record import WeightRecord
from app.schemas.animal import AnimalCreate, AnimalUpdate
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


def seed_milk(db, animal_id: int, liters: str) -> None:
    db.add(
        MilkRecord(
            animal_id=animal_id,
            record_date=date.today(),
            milk_liters=Decimal(liters),
        )
    )
    db.commit()


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
    assert "Positive net economic value" in (
        rankings.top_economic_animals[0].explanations
    )
    assert "Negative net economic value" in (
        rankings.bottom_economic_animals[0].explanations
    )
    assert rankings.top_milk_producers[0].animal_id == top_milk.id
    assert rankings.low_milk_producers[0].animal_id == low_milk.id
    assert rankings.top_milk_producers[0].explanations
    assert rankings.low_milk_producers[0].explanations[0].startswith(
        "Lower lifetime milk production"
    )
    assert rankings.most_treated_animals[0].animal_id == most_treated.id
    assert rankings.highest_weight_gain_animals[0].animal_id == highest_gain.id
    assert rankings.lowest_weight_gain_animals[0].animal_id == lowest_gain.id
    assert rankings.top_performing_animals[0].animal_id == top_economic.id
    assert rankings.lowest_performing_animals[0].animal_id == bottom_economic.id
    assert "Positive economic score" in (
        rankings.top_performing_animals[0].explanations
    )
    assert "Negative economic score" in (
        rankings.lowest_performing_animals[0].explanations
    )
    assert rankings.key_herd_opportunities

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


def test_dashboard_golden_list_membership_and_order(db):
    settings_service.update_settings(
        db, SettingsUpdate(milk_price=Decimal("1.00"))
    )

    top_golden = create_dashboard_test_animal(
        db,
        "GOLD-TOP",
        purchase_price=Decimal("1.00"),
        sale_price=Decimal("999999.00"),
    )
    seed_milk(db, top_golden.id, "10.00")
    seed_costed_treatment(db, top_golden.id)

    milk_tiebreaker = create_dashboard_test_animal(
        db,
        "GOLD-MILK",
        purchase_price=Decimal("1.00"),
        sale_price=Decimal("899906.00"),
    )
    seed_milk(db, milk_tiebreaker.id, "100.00")
    seed_costed_treatment(db, milk_tiebreaker.id)

    treatment_tiebreaker = create_dashboard_test_animal(
        db,
        "GOLD-TREAT",
        purchase_price=Decimal("1.00"),
        sale_price=Decimal("899911.00"),
    )
    seed_milk(db, treatment_tiebreaker.id, "100.00")
    seed_costed_treatment(db, treatment_tiebreaker.id)
    seed_costed_treatment(db, treatment_tiebreaker.id)

    locked_animal = create_dashboard_test_animal(
        db,
        "GOLD-LOCK",
        purchase_price=Decimal("1.00"),
        sale_price=Decimal("999999.00"),
    )
    seed_costed_treatment(db, locked_animal.id)
    withdrawal_lock_service.create_withdrawal_lock(
        db,
        WithdrawalLockCreate(
            animal_id=locked_animal.id,
            start_date=date.today(),
            end_date=date.today(),
            reason="Golden List exclusion test",
        ),
    )

    negative_animal = create_dashboard_test_animal(
        db,
        "GOLD-NEG",
        purchase_price=Decimal("5000.00"),
        sale_price=Decimal("1.00"),
    )
    seed_costed_treatment(db, negative_animal.id)

    repeated_treatments = create_dashboard_test_animal(
        db,
        "GOLD-REPEAT",
        purchase_price=Decimal("1.00"),
        sale_price=Decimal("999999.00"),
    )
    for _ in range(3):
        seed_costed_treatment(db, repeated_treatments.id)

    high_health = create_dashboard_test_animal(
        db,
        "GOLD-HEALTH",
        purchase_price=Decimal("1.00"),
        sale_price=Decimal("999999.00"),
    )
    seed_costed_treatment(db, high_health.id)
    db.add_all(
        [
            HealthRecord(
                animal_id=high_health.id,
                record_type="checkup",
                record_date=date.today(),
            )
            for _ in range(4)
        ]
    )
    db.commit()

    exited_animal = create_dashboard_test_animal(
        db,
        "GOLD-EXIT",
        purchase_price=Decimal("1.00"),
        sale_price=Decimal("999999.00"),
    )
    seed_costed_treatment(db, exited_animal.id)
    animal_service.update_animal(
        db,
        exited_animal.id,
        AnimalUpdate(exit_date=date.today(), exit_reason="sold"),
    )

    golden_list = (
        dashboard_service.get_dashboard_summary(db)
        .decision_support
        .golden_list_animals
    )
    golden_ids = [animal.animal_id for animal in golden_list]

    assert golden_ids[:3] == [
        top_golden.id,
        milk_tiebreaker.id,
        treatment_tiebreaker.id,
    ]
    assert locked_animal.id not in golden_ids
    assert negative_animal.id not in golden_ids
    assert repeated_treatments.id not in golden_ids
    assert high_health.id not in golden_ids
    assert exited_animal.id not in golden_ids

    top_entry = golden_list[0]
    assert "Positive Economic Value" in top_entry.strengths
    assert "Low Treatment Frequency" in top_entry.strengths
    assert top_entry.net_economic_value > 0
    assert top_entry.lifetime_milk_production == 10
    assert top_entry.treatment_count == 1


def test_dashboard_priority_review_membership_reasons_and_order(db):
    settings_service.update_settings(
        db, SettingsUpdate(milk_price=Decimal("1.00"))
    )

    withdrawal_animal = create_dashboard_test_animal(
        db, "000-PRIORITY-01-LOCK"
    )
    withdrawal_lock_service.create_withdrawal_lock(
        db,
        WithdrawalLockCreate(
            animal_id=withdrawal_animal.id,
            start_date=date.today(),
            end_date=date.today(),
            reason="Priority Review test",
        ),
    )

    negative_animal = create_dashboard_test_animal(
        db,
        "000-PRIORITY-02-ECON",
        purchase_price=Decimal("1000.00"),
        sale_price=Decimal("1.00"),
    )
    seed_costed_treatment(db, negative_animal.id)

    repeated_treatments = create_dashboard_test_animal(
        db,
        "000-PRIORITY-03-TREAT",
    )
    for _ in range(3):
        db.add(
            HealthRecord(
                animal_id=repeated_treatments.id,
                record_type="treatment",
                record_date=date.today(),
            )
        )

    high_health = create_dashboard_test_animal(
        db, "000-PRIORITY-04-HEALTH"
    )
    db.add_all(
        [
            HealthRecord(
                animal_id=high_health.id,
                record_type="checkup",
                record_date=date.today(),
            )
            for _ in range(5)
        ]
    )

    low_weight = create_dashboard_test_animal(
        db, "000-PRIORITY-05-WEIGHT"
    )
    high_weight = create_dashboard_test_animal(
        db, "000-PRIORITY-05-WEIGHT-HIGH"
    )
    db.add_all(
        [
            WeightRecord(
                animal_id=low_weight.id,
                record_date=date(2026, 1, 1),
                weight_kg=Decimal("500.00"),
            ),
            WeightRecord(
                animal_id=low_weight.id,
                record_date=date(2026, 2, 1),
                weight_kg=Decimal("100.00"),
            ),
            WeightRecord(
                animal_id=high_weight.id,
                record_date=date(2026, 1, 1),
                weight_kg=Decimal("100.00"),
            ),
            WeightRecord(
                animal_id=high_weight.id,
                record_date=date(2026, 2, 1),
                weight_kg=Decimal("500.00"),
            ),
        ]
    )

    low_milk = create_dashboard_test_animal(db, "000-PRIORITY-06-MILK")
    high_milk = create_dashboard_test_animal(
        db, "000-PRIORITY-06-MILK-HIGH"
    )
    db.add_all(
        [
            MilkRecord(
                animal_id=low_milk.id,
                record_date=date.today(),
                milk_liters=Decimal("1.00"),
            ),
            MilkRecord(
                animal_id=high_milk.id,
                record_date=date.today(),
                milk_liters=Decimal("500.00"),
            ),
        ]
    )
    db.commit()

    exited_animal = create_dashboard_test_animal(
        db,
        "000-PRIORITY-07-EXIT",
        exit_date=date.today(),
        exit_reason="sold",
    )
    clean_animal = create_dashboard_test_animal(
        db, "000-PRIORITY-08-CLEAN"
    )

    priority_review = (
        dashboard_service.get_dashboard_summary(db)
        .decision_support
        .priority_review_animals
    )
    priority_ids = [animal.animal_id for animal in priority_review]
    reasons_by_id = {
        animal.animal_id: animal.attention_reasons
        for animal in priority_review
    }

    seeded_order = [
        animal_id
        for animal_id in priority_ids
        if animal_id
        in {
            withdrawal_animal.id,
            negative_animal.id,
            repeated_treatments.id,
            high_health.id,
            low_weight.id,
            low_milk.id,
            exited_animal.id,
        }
    ]

    assert seeded_order == [
        withdrawal_animal.id,
        negative_animal.id,
        repeated_treatments.id,
        high_health.id,
        low_weight.id,
        low_milk.id,
        exited_animal.id,
    ]
    assert reasons_by_id[withdrawal_animal.id] == ["Withdrawal Lock"]
    assert reasons_by_id[negative_animal.id] == ["Economic Attention"]
    assert reasons_by_id[repeated_treatments.id] == [
        "Health Attention: Repeated Treatments"
    ]
    assert reasons_by_id[high_health.id] == [
        "Health Attention: High Health Activity"
    ]
    assert reasons_by_id[low_weight.id] == ["Growth Attention"]
    assert reasons_by_id[low_milk.id] == ["Production Attention"]
    assert reasons_by_id[exited_animal.id] == ["Recently Exited"]
    assert clean_animal.id not in priority_ids
    assert high_weight.id not in priority_ids
    assert high_milk.id not in priority_ids

    withdrawal_entry = priority_review[0]
    assert withdrawal_entry.has_active_withdrawal_lock is True
    assert withdrawal_entry.net_economic_value is None
    assert withdrawal_entry.treatment_count == 0
    assert withdrawal_entry.health_event_count == 0
