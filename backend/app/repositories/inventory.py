from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inventory import InventoryItem, InventoryMovement
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryMovementCreate,
)


def get_active_inventory_items(db: Session) -> list[InventoryItem]:
    statement = (
        select(InventoryItem)
        .where(InventoryItem.is_active.is_(True))
        .order_by(InventoryItem.id)
    )
    return list(db.scalars(statement).all())


def get_inventory_item_by_id(
    db: Session, item_id: int
) -> InventoryItem | None:
    return db.get(InventoryItem, item_id)


def create_inventory_item(
    db: Session, item_data: InventoryItemCreate
) -> InventoryItem:
    item = InventoryItem(**item_data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_inventory_item(
    db: Session, item: InventoryItem, item_data: InventoryItemUpdate
) -> InventoryItem:
    for field, value in item_data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item


def soft_delete_inventory_item(
    db: Session, item: InventoryItem
) -> InventoryItem:
    item.is_active = False
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item


def get_inventory_movements(db: Session) -> list[InventoryMovement]:
    statement = (
        select(InventoryMovement)
        .order_by(
            InventoryMovement.movement_date.desc(),
            InventoryMovement.id.desc(),
        )
    )
    return list(db.scalars(statement).all())


def get_inventory_movement_by_notes(
    db: Session, notes: str
) -> InventoryMovement | None:
    statement = select(InventoryMovement).where(
        InventoryMovement.notes == notes,
        InventoryMovement.movement_type == "out",
    )
    return db.scalar(statement)


def create_inventory_movement(
    db: Session,
    item: InventoryItem,
    movement_data: InventoryMovementCreate,
    new_quantity: Decimal,
    commit: bool = True,
) -> InventoryMovement:
    movement = InventoryMovement(**movement_data.model_dump())
    item.current_quantity = new_quantity
    item.updated_at = datetime.now(timezone.utc)
    db.add(movement)
    if commit:
        db.commit()
    else:
        db.flush()
    db.refresh(movement)
    db.refresh(item)
    return movement
