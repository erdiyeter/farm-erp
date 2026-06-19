from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemResponse,
    InventoryItemUpdate,
    InventoryMovementCreate,
    InventoryMovementResponse,
)
from app.services import inventory as inventory_service


router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("/items", response_model=list[InventoryItemResponse])
def list_inventory_items(
    db: Session = Depends(get_db),
) -> list[InventoryItemResponse]:
    return inventory_service.list_inventory_items(db)


@router.post(
    "/items",
    response_model=InventoryItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_item(
    item_data: InventoryItemCreate,
    db: Session = Depends(get_db),
) -> InventoryItemResponse:
    return inventory_service.create_inventory_item(db, item_data)


@router.get("/items/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
) -> InventoryItemResponse:
    try:
        return inventory_service.get_inventory_item(db, item_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.put("/items/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: int,
    item_data: InventoryItemUpdate,
    db: Session = Depends(get_db),
) -> InventoryItemResponse:
    try:
        return inventory_service.update_inventory_item(
            db, item_id, item_data
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.delete("/items/{item_id}", response_model=InventoryItemResponse)
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
) -> InventoryItemResponse:
    try:
        return inventory_service.soft_delete_inventory_item(db, item_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.get("/movements", response_model=list[InventoryMovementResponse])
def list_inventory_movements(
    db: Session = Depends(get_db),
) -> list[InventoryMovementResponse]:
    return inventory_service.list_inventory_movements(db)


@router.post(
    "/movements",
    response_model=InventoryMovementResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_movement(
    movement_data: InventoryMovementCreate,
    db: Session = Depends(get_db),
) -> InventoryMovementResponse:
    try:
        return inventory_service.create_inventory_movement(db, movement_data)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
