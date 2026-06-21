from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import func, select

from app.models.inventory import InventoryMovement
from app.schemas.inventory import InventoryItemCreate, InventoryMovementCreate
from app.services import inventory as inventory_service


def create_item(db, quantity: str = "10"):
    return inventory_service.create_inventory_item(
        db,
        InventoryItemCreate(
            name=f"Test Item {uuid4().hex[:8]}",
            unit="units",
            current_quantity=Decimal(quantity),
        ),
    )


def create_movement(db, item_id: int, movement_type: str, quantity: str):
    return inventory_service.create_inventory_movement(
        db,
        InventoryMovementCreate(
            item_id=item_id,
            movement_type=movement_type,
            quantity=Decimal(quantity),
            movement_date=date(2026, 3, 1),
        ),
    )


def test_inventory_movements_update_stock_for_all_movement_types(db) -> None:
    item = create_item(db)

    incoming = create_movement(db, item.id, "in", "5")
    db.refresh(item)
    assert item.current_quantity == Decimal("15.00")

    outgoing = create_movement(db, item.id, "out", "4")
    db.refresh(item)
    assert item.current_quantity == Decimal("11.00")

    adjustment = create_movement(db, item.id, "adjustment", "3")
    db.refresh(item)
    assert item.current_quantity == Decimal("3.00")
    movement_ids = {
        movement.id for movement in inventory_service.list_inventory_movements(db)
    }
    assert {incoming.id, outgoing.id, adjustment.id} <= movement_ids


def test_inventory_out_rejects_insufficient_stock_without_movement(db) -> None:
    item = create_item(db, "2")
    initial_count = db.scalar(
        select(func.count()).select_from(InventoryMovement)
    )

    with pytest.raises(ValueError, match="Not enough stock"):
        create_movement(db, item.id, "out", "3")

    db.refresh(item)
    assert item.current_quantity == Decimal("2.00")
    assert (
        db.scalar(select(func.count()).select_from(InventoryMovement))
        == initial_count
    )


def test_inventory_movements_reject_missing_and_inactive_items(db) -> None:
    missing_id = 2_000_000_000
    with pytest.raises(LookupError, match="Inventory item not found"):
        create_movement(db, missing_id, "in", "1")

    item = create_item(db)
    inventory_service.soft_delete_inventory_item(db, item.id)

    with pytest.raises(LookupError, match="Inventory item not found"):
        create_movement(db, item.id, "out", "1")
