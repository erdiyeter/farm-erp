from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.inventory import InventoryItem, InventoryMovement
from app.repositories import inventory as inventory_repository
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryMovementCreate,
)


def list_inventory_items(db: Session) -> list[InventoryItem]:
    return inventory_repository.get_active_inventory_items(db)


def get_inventory_item(db: Session, item_id: int) -> InventoryItem:
    item = inventory_repository.get_inventory_item_by_id(db, item_id)
    if item is None or item.is_active is not True:
        raise LookupError("Inventory item not found")
    return item


def create_inventory_item(
    db: Session, item_data: InventoryItemCreate
) -> InventoryItem:
    return inventory_repository.create_inventory_item(db, item_data)


def update_inventory_item(
    db: Session, item_id: int, item_data: InventoryItemUpdate
) -> InventoryItem:
    item = get_inventory_item(db, item_id)
    return inventory_repository.update_inventory_item(db, item, item_data)


def soft_delete_inventory_item(
    db: Session, item_id: int
) -> InventoryItem:
    item = get_inventory_item(db, item_id)
    return inventory_repository.soft_delete_inventory_item(db, item)


def list_inventory_movements(db: Session) -> list[InventoryMovement]:
    return inventory_repository.get_inventory_movements(db)


def create_inventory_movement(
    db: Session,
    movement_data: InventoryMovementCreate,
    commit: bool = True,
) -> InventoryMovement:
    item = get_inventory_item(db, movement_data.item_id)
    current_quantity = item.current_quantity or Decimal("0")

    if movement_data.movement_type == "in":
        new_quantity = current_quantity + movement_data.quantity
    elif movement_data.movement_type == "out":
        if current_quantity < movement_data.quantity:
            raise ValueError("Not enough stock")
        new_quantity = current_quantity - movement_data.quantity
    elif movement_data.movement_type == "adjustment":
        new_quantity = movement_data.quantity
    else:
        raise ValueError("Invalid inventory movement")

    return inventory_repository.create_inventory_movement(
        db, item, movement_data, new_quantity, commit
    )
