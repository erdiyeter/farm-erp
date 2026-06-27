from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.medicine_catalog import (
    MedicineCatalogCreate,
    MedicineCatalogUpdate,
)
from app.services import medicine_catalog as medicine_catalog_service


def make_catalog_data(
    product_name: str | None = None,
    target_species: str = "cattle",
    application_route: str = "intramuscular",
    milk_withdrawal_days: Decimal | None = Decimal("1.5"),
    meat_withdrawal_days: Decimal | None = None,
) -> MedicineCatalogCreate:
    return MedicineCatalogCreate(
        product_name=product_name or f"Test Medicine {uuid4().hex[:8]}",
        active_ingredient="test ingredient",
        target_species=target_species,
        application_route=application_route,
        milk_withdrawal_days=milk_withdrawal_days,
        meat_withdrawal_days=meat_withdrawal_days,
        source_name="Test label",
        source_type="label",
    )


def test_medicine_catalog_crud_and_soft_delete(db) -> None:
    record = medicine_catalog_service.create_medicine_catalog_record(
        db, make_catalog_data()
    )

    assert record.id is not None
    assert record.milk_withdrawal_days == Decimal("1.50")
    assert record.meat_withdrawal_days is None
    assert record.is_milk_allowed is True
    assert record.is_meat_allowed is True
    assert record.confidence_level == "medium"
    assert record in medicine_catalog_service.list_medicine_catalog_records(db)

    updated = medicine_catalog_service.update_medicine_catalog_record(
        db,
        record.id,
        MedicineCatalogUpdate(
            milk_withdrawal_days=Decimal("6.5"),
            notes="Updated withdrawal guidance",
            is_milk_allowed=False,
        ),
    )

    assert updated.milk_withdrawal_days == Decimal("6.50")
    assert updated.notes == "Updated withdrawal guidance"
    assert updated.is_milk_allowed is False

    deleted = medicine_catalog_service.soft_delete_medicine_catalog_record(
        db, record.id
    )

    assert deleted.is_active is False
    assert deleted not in medicine_catalog_service.list_medicine_catalog_records(
        db
    )
    with pytest.raises(
        LookupError, match="Medicine catalog record not found"
    ):
        medicine_catalog_service.get_medicine_catalog_record(db, record.id)


def test_medicine_catalog_rejects_active_duplicates(db) -> None:
    product_name = f"Duplicate Medicine {uuid4().hex[:8]}"
    medicine_catalog_service.create_medicine_catalog_record(
        db,
        make_catalog_data(
            product_name=product_name,
            target_species="cattle",
            application_route="oral",
        ),
    )

    with pytest.raises(ValueError, match="already exists"):
        medicine_catalog_service.create_medicine_catalog_record(
            db,
            make_catalog_data(
                product_name=product_name.upper(),
                target_species="CATTLE",
                application_route="ORAL",
            ),
        )

    medicine_catalog_service.create_medicine_catalog_record(
        db,
        make_catalog_data(
            product_name=product_name,
            target_species="cattle",
            application_route="subcutaneous",
        ),
    )


def test_medicine_catalog_rejects_duplicate_updates(db) -> None:
    first = medicine_catalog_service.create_medicine_catalog_record(
        db, make_catalog_data(target_species="cattle", application_route="oral")
    )
    second = medicine_catalog_service.create_medicine_catalog_record(
        db,
        make_catalog_data(
            target_species="cattle", application_route="intramuscular"
        ),
    )

    with pytest.raises(ValueError, match="already exists"):
        medicine_catalog_service.update_medicine_catalog_record(
            db,
            second.id,
            MedicineCatalogUpdate(
                product_name=first.product_name,
                target_species=first.target_species,
                application_route=first.application_route,
            ),
        )


def test_medicine_catalog_validation() -> None:
    with pytest.raises(ValidationError):
        MedicineCatalogCreate(
            product_name=" ",
            active_ingredient="ingredient",
            target_species="cattle",
            application_route="oral",
        )

    with pytest.raises(ValidationError):
        make_catalog_data(milk_withdrawal_days=Decimal("-1"))
