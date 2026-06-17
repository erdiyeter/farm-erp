from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MilkRecordBase(BaseModel):
    animal_id: int
    record_date: date
    milk_liters: Decimal
    session: str | None = None
    notes: str | None = None


class MilkRecordCreate(MilkRecordBase):
    milk_liters: Decimal = Field(gt=0)


class MilkRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    record_date: date
    milk_liters: Decimal
    session: str | None
    notes: str | None
    created_at: datetime | None


class MilkRecordListResponse(MilkRecordResponse):
    pass
