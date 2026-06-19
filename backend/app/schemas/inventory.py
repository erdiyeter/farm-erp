from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class InventoryItemCreate(BaseModel):
    name: str = Field(max_length=100)
    category: str | None = Field(default=None, max_length=50)
    unit: str = Field(max_length=50)
    current_quantity: Decimal = Field(default=Decimal("0"), ge=0)
    minimum_quantity: Decimal | None = Field(default=Decimal("0"), ge=0)
    notes: str | None = None


class InventoryItemUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=50)
    unit: str | None = Field(default=None, max_length=50)
    current_quantity: Decimal | None = Field(default=None, ge=0)
    minimum_quantity: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None
    is_active: bool | None = None


class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str | None
    unit: str
    current_quantity: Decimal
    minimum_quantity: Decimal | None
    notes: str | None
    is_active: bool | None
    created_at: datetime | None
    updated_at: datetime | None


class InventoryMovementCreate(BaseModel):
    item_id: int
    movement_type: Literal["in", "out", "adjustment"]
    quantity: Decimal = Field(gt=0)
    movement_date: date
    notes: str | None = None


class InventoryMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_id: int
    movement_type: str
    quantity: Decimal
    movement_date: date
    notes: str | None
    created_at: datetime | None
