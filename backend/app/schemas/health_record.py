from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


HealthRecordType = Literal["treatment", "illness", "checkup", "vaccination"]


class HealthRecordBase(BaseModel):
    animal_id: int
    record_type: HealthRecordType
    diagnosis: str | None = Field(default=None, max_length=150)
    treatment: str | None = None
    medicine_name: str | None = Field(default=None, max_length=150)
    medicine_catalog_id: int | None = None
    dosage: str | None = Field(default=None, max_length=100)
    record_date: date
    withdrawal_end_date: date | None = None
    notes: str | None = None


class HealthRecordCreate(HealthRecordBase):
    inventory_item_id: int | None = None


class HealthRecordUpdate(BaseModel):
    animal_id: int | None = None
    record_type: HealthRecordType | None = None
    diagnosis: str | None = Field(default=None, max_length=150)
    treatment: str | None = None
    medicine_name: str | None = Field(default=None, max_length=150)
    medicine_catalog_id: int | None = None
    dosage: str | None = Field(default=None, max_length=100)
    record_date: date | None = None
    withdrawal_end_date: date | None = None
    notes: str | None = None
    inventory_item_id: int | None = None


class HealthRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    record_type: str
    diagnosis: str | None
    treatment: str | None
    medicine_name: str | None
    medicine_catalog_id: int | None
    dosage: str | None
    record_date: date
    withdrawal_end_date: date | None
    notes: str | None
    created_at: datetime | None


class HealthInventoryConsumption(BaseModel):
    item_id: int
    item_name: str
    quantity: Decimal
    movement_date: date


class HealthRecordDetailResponse(HealthRecordResponse):
    inventory_consumption: HealthInventoryConsumption | None = None
