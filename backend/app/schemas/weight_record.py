from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class WeightRecordCreate(BaseModel):
    animal_id: int
    record_date: date
    weight_kg: Decimal = Field(gt=0)
    notes: str | None = None


class WeightRecordUpdate(BaseModel):
    animal_id: int | None = None
    record_date: date | None = None
    weight_kg: Decimal | None = Field(default=None, gt=0)
    notes: str | None = None


class WeightRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    record_date: date
    weight_kg: Decimal
    notes: str | None
    created_at: datetime | None
    updated_at: datetime | None
