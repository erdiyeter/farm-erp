from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class FinancialRecordCreate(BaseModel):
    record_type: Literal["income", "expense"]
    category: str = Field(min_length=1, max_length=100)
    amount: Decimal = Field(gt=0)
    record_date: date
    description: str | None = None

    @field_validator("category")
    @classmethod
    def category_must_not_be_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Category must not be empty")
        return value


class FinancialRecordUpdate(BaseModel):
    record_type: Literal["income", "expense"] | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    amount: Decimal | None = Field(default=None, gt=0)
    record_date: date | None = None
    description: str | None = None

    @field_validator("category")
    @classmethod
    def category_must_not_be_empty(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Category must not be empty")
        return value


class FinancialRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    record_type: str
    category: str
    amount: Decimal
    record_date: date
    description: str | None
    is_active: bool
    created_at: datetime | None
