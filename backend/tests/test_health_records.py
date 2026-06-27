from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import func, select

from app.models.health_record import HealthRecord
from app.models.inventory import InventoryItem, InventoryMovement
from app.models.withdrawal_lock import WithdrawalLock
from app.schemas.animal import AnimalCreate
from app.schemas.health_record import HealthRecordCreate, HealthRecordUpdate
from app.schemas.medicine_catalog import MedicineCatalogCreate
from app.services import animal as animal_service
from app.services import health_record as health_record_service
from app.services import medicine_catalog as medicine_catalog_service


def create_test_animal(db):
    return animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"HEALTH-{uuid4().hex[:12]}")
    )


def create_test_medicine(
    db,
    milk_withdrawal_days: Decimal | None = Decimal("1.5"),
    meat_withdrawal_days: Decimal | None = None,
    is_milk_allowed: bool = True,
    is_meat_allowed: bool = True,
    source_name: str | None = "Test label",
):
    return medicine_catalog_service.create_medicine_catalog_record(
        db,
        MedicineCatalogCreate(
            product_name=f"Catalog Medicine {uuid4().hex[:8]}",
            active_ingredient="catalog ingredient",
            target_species="cattle",
            application_route="intramuscular",
            milk_withdrawal_days=milk_withdrawal_days,
            meat_withdrawal_days=meat_withdrawal_days,
            is_milk_allowed=is_milk_allowed,
            is_meat_allowed=is_meat_allowed,
            source_name=source_name,
        ),
    )


def test_health_record_without_inventory_remains_supported(db) -> None:
    animal = create_test_animal(db)
    record = health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=animal.id,
            record_type="checkup",
            diagnosis="Routine check",
            record_date=date(2026, 1, 10),
        ),
    )

    assert record.diagnosis == "Routine check"
    assert health_record_service.get_inventory_consumption(db, record.id) is None
    assert (
        db.scalar(
            select(func.count())
            .select_from(WithdrawalLock)
            .where(WithdrawalLock.health_record_id == record.id)
        )
        == 0
    )


def test_treatment_consumes_inventory_and_exposes_detail(db) -> None:
    animal = create_test_animal(db)
    item = InventoryItem(
        name=f"Test Medicine {uuid4().hex[:8]}",
        unit="ml",
        current_quantity=Decimal("10"),
        minimum_quantity=Decimal("0"),
        is_active=True,
    )
    db.add(item)
    db.flush()

    record = health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=animal.id,
            record_type="treatment",
            dosage="2.5",
            inventory_item_id=item.id,
            record_date=date(2026, 1, 11),
        ),
    )
    db.refresh(item)
    detail = health_record_service.get_health_record_detail(db, record.id)

    assert item.current_quantity == Decimal("7.50")
    assert detail.inventory_consumption is not None
    assert detail.inventory_consumption.item_id == item.id
    assert detail.inventory_consumption.quantity == Decimal("2.50")


def test_medicine_catalog_creates_withdrawal_lock_with_latest_date(db) -> None:
    animal = create_test_animal(db)
    medicine = create_test_medicine(
        db,
        milk_withdrawal_days=Decimal("1.5"),
        meat_withdrawal_days=Decimal("5"),
        source_name="Official label",
    )

    record = health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=animal.id,
            record_type="treatment",
            medicine_catalog_id=medicine.id,
            record_date=date(2026, 2, 1),
        ),
    )
    locks = db.scalars(
        select(WithdrawalLock).where(WithdrawalLock.health_record_id == record.id)
    ).all()

    assert record.medicine_catalog_id == medicine.id
    assert len(locks) == 1
    assert locks[0].health_record_id == record.id
    assert locks[0].animal_id == animal.id
    assert locks[0].start_date == date(2026, 2, 1)
    assert locks[0].end_date == date(2026, 2, 6)
    assert medicine.product_name in locks[0].reason
    assert "Süt arınma süresi: 1.5 gün" in locks[0].reason
    assert "Et arınma süresi: 5 gün" in locks[0].reason
    assert "Kaynak: Official label" in locks[0].reason


def test_medicine_catalog_warning_only_creates_same_day_lock(db) -> None:
    animal = create_test_animal(db)
    medicine = create_test_medicine(
        db,
        milk_withdrawal_days=None,
        meat_withdrawal_days=None,
        is_milk_allowed=False,
        is_meat_allowed=False,
    )

    record = health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=animal.id,
            record_type="treatment",
            medicine_catalog_id=medicine.id,
            record_date=date(2026, 2, 2),
        ),
    )
    lock = db.scalars(
        select(WithdrawalLock).where(WithdrawalLock.health_record_id == record.id)
    ).one()

    assert lock.health_record_id == record.id
    assert lock.start_date == date(2026, 2, 2)
    assert lock.end_date == date(2026, 2, 2)
    assert health_record_service.MILK_NOT_ALLOWED_WARNING in lock.reason
    assert health_record_service.MEAT_NOT_ALLOWED_WARNING in lock.reason


def test_medicine_catalog_without_days_or_warnings_does_not_create_lock(db) -> None:
    animal = create_test_animal(db)
    medicine = create_test_medicine(
        db,
        milk_withdrawal_days=None,
        meat_withdrawal_days=None,
        is_milk_allowed=True,
        is_meat_allowed=True,
    )

    record = health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=animal.id,
            record_type="treatment",
            medicine_catalog_id=medicine.id,
            record_date=date(2026, 2, 3),
        ),
    )

    assert (
        db.scalar(
            select(func.count())
            .select_from(WithdrawalLock)
            .where(WithdrawalLock.health_record_id == record.id)
        )
        == 0
    )


def test_health_record_rejects_missing_and_inactive_medicine_catalog(db) -> None:
    animal = create_test_animal(db)

    with pytest.raises(LookupError, match="Medicine catalog record not found"):
        health_record_service.create_health_record(
            db,
            HealthRecordCreate(
                animal_id=animal.id,
                record_type="treatment",
                medicine_catalog_id=2_000_000_000,
                record_date=date(2026, 2, 4),
            ),
        )

    medicine = create_test_medicine(db)
    medicine_catalog_service.soft_delete_medicine_catalog_record(
        db, medicine.id
    )

    with pytest.raises(LookupError, match="Medicine catalog record not found"):
        health_record_service.create_health_record(
            db,
            HealthRecordCreate(
                animal_id=animal.id,
                record_type="treatment",
                medicine_catalog_id=medicine.id,
                record_date=date(2026, 2, 4),
            ),
        )


def test_insufficient_stock_rolls_back_record_and_movement(db) -> None:
    animal = create_test_animal(db)
    item = InventoryItem(
        name=f"Low Stock Medicine {uuid4().hex[:8]}",
        unit="ml",
        current_quantity=Decimal("1"),
        minimum_quantity=Decimal("0"),
        is_active=True,
    )
    db.add(item)
    db.flush()
    health_count = db.scalar(select(func.count()).select_from(HealthRecord))
    movement_count = db.scalar(
        select(func.count()).select_from(InventoryMovement)
    )

    with pytest.raises(ValueError, match="Not enough stock"):
        health_record_service.create_health_record(
            db,
            HealthRecordCreate(
                animal_id=animal.id,
                record_type="treatment",
                dosage="2",
                inventory_item_id=item.id,
                record_date=date(2026, 1, 12),
            ),
        )

    assert (
        db.scalar(select(func.count()).select_from(HealthRecord))
        == health_count
    )
    assert (
        db.scalar(select(func.count()).select_from(InventoryMovement))
        == movement_count
    )


def test_health_record_update_and_delete(db) -> None:
    animal = create_test_animal(db)
    record = health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=animal.id,
            record_type="illness",
            record_date=date(2026, 1, 13),
        ),
    )

    updated = health_record_service.update_health_record(
        db, record.id, HealthRecordUpdate(diagnosis="Updated diagnosis")
    )
    assert updated.diagnosis == "Updated diagnosis"
    assert record.id in {
        listed.id
        for listed in health_record_service.list_health_records_by_animal(
            animal.id, db
        )
    }

    health_record_service.delete_health_record(db, record.id)
    with pytest.raises(LookupError, match="Health record not found"):
        health_record_service.get_health_record(db, record.id)


def test_health_record_rejects_missing_and_inactive_animals(db) -> None:
    with pytest.raises(LookupError, match="Animal not found"):
        health_record_service.create_health_record(
            db,
            HealthRecordCreate(
                animal_id=2_000_000_000,
                record_type="checkup",
                record_date=date(2026, 1, 14),
            ),
        )

    animal = create_test_animal(db)
    animal_service.soft_delete_animal(db, animal.id)
    with pytest.raises(ValueError, match="Animal is inactive"):
        health_record_service.create_health_record(
            db,
            HealthRecordCreate(
                animal_id=animal.id,
                record_type="checkup",
                record_date=date(2026, 1, 14),
            ),
        )


@pytest.mark.parametrize("dosage", [None, "not-a-number", "0", "-1", "NaN"])
def test_inventory_treatment_rejects_invalid_dosage(db, dosage) -> None:
    animal = create_test_animal(db)
    item = InventoryItem(
        name=f"Dosage Test {uuid4().hex[:8]}",
        unit="ml",
        current_quantity=Decimal("10"),
        minimum_quantity=Decimal("0"),
        is_active=True,
    )
    db.add(item)
    db.flush()

    with pytest.raises(ValueError, match="Dosage"):
        health_record_service.create_health_record(
            db,
            HealthRecordCreate(
                animal_id=animal.id,
                record_type="treatment",
                dosage=dosage,
                inventory_item_id=item.id,
                record_date=date(2026, 1, 15),
            ),
        )


def test_consumed_inventory_fields_cannot_be_changed(db) -> None:
    animal = create_test_animal(db)
    item = InventoryItem(
        name=f"Locked Medicine {uuid4().hex[:8]}",
        unit="ml",
        current_quantity=Decimal("10"),
        minimum_quantity=Decimal("0"),
        is_active=True,
    )
    db.add(item)
    db.flush()
    record = health_record_service.create_health_record(
        db,
        HealthRecordCreate(
            animal_id=animal.id,
            record_type="treatment",
            dosage="2",
            inventory_item_id=item.id,
            record_date=date(2026, 1, 16),
        ),
    )

    with pytest.raises(ValueError, match="Dosage cannot change"):
        health_record_service.update_health_record(
            db, record.id, HealthRecordUpdate(dosage="3")
        )
