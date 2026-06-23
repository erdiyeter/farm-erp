from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


ExitReason = Literal["sold", "died", "culled", "transferred", "other"]


def validate_lifecycle_fields(
    exit_date: date | None, exit_reason: ExitReason | None
) -> None:
    if exit_date is not None and exit_reason is None:
        raise ValueError("Exit reason is required when exit date is provided")
    if exit_reason is not None and exit_date is None:
        raise ValueError("Exit date is required when exit reason is provided")


def validate_lactation_fields(
    lactation_start_date: date | None,
    lactation_end_date: date | None,
) -> None:
    if lactation_end_date is not None and lactation_start_date is None:
        raise ValueError(
            "Lactation start date is required when lactation end date is provided"
        )
    if (
        lactation_start_date is not None
        and lactation_end_date is not None
        and lactation_end_date < lactation_start_date
    ):
        raise ValueError(
            "Lactation end date cannot be before lactation start date"
        )


class AnimalCreate(BaseModel):
    ear_tag: str = Field(max_length=50)
    name: str | None = Field(default=None, max_length=100)
    species: str = Field(default="cattle", max_length=50)
    breed: str | None = Field(default=None, max_length=100)
    sex: str | None = Field(default=None, max_length=10)
    birth_date: date | None = None
    purchase_date: date | None = None
    purchase_price: Decimal | None = Field(default=None, ge=0)
    sale_price: Decimal | None = Field(default=None, ge=0)
    lactation_number: int | None = Field(default=None, ge=1)
    lactation_start_date: date | None = None
    lactation_end_date: date | None = None
    exit_date: date | None = None
    exit_reason: ExitReason | None = None
    notes: str | None = None
    is_active: bool = True

    @model_validator(mode="after")
    def validate_lifecycle(self):
        validate_lifecycle_fields(self.exit_date, self.exit_reason)
        validate_lactation_fields(
            self.lactation_start_date, self.lactation_end_date
        )
        return self


class AnimalUpdate(BaseModel):
    ear_tag: str | None = Field(default=None, max_length=50)
    name: str | None = Field(default=None, max_length=100)
    species: str | None = Field(default=None, max_length=50)
    breed: str | None = Field(default=None, max_length=100)
    sex: str | None = Field(default=None, max_length=10)
    birth_date: date | None = None
    purchase_date: date | None = None
    purchase_price: Decimal | None = Field(default=None, ge=0)
    sale_price: Decimal | None = Field(default=None, ge=0)
    lactation_number: int | None = Field(default=None, ge=1)
    lactation_start_date: date | None = None
    lactation_end_date: date | None = None
    exit_date: date | None = None
    exit_reason: ExitReason | None = None
    notes: str | None = None
    is_active: bool | None = None


class AnimalListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ear_tag: str
    name: str | None
    breed: str | None
    sex: str | None
    purchase_date: date | None
    purchase_price: Decimal | None
    sale_price: Decimal | None


class AnimalEconomicSummary(BaseModel):
    purchase_value: Decimal | None
    sale_value: Decimal | None
    profit_loss: Decimal | None
    lifetime_milk_production: Decimal
    lifetime_milk_revenue: Decimal | None
    health_event_count: int
    treatment_count: int
    health_cost: Decimal | None
    net_economic_value: Decimal | None


class AnimalEconomicRanking(BaseModel):
    animal_id: int
    ear_tag: str
    name: str | None
    economic_score: float
    rank_position: int


class AnimalDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ear_tag: str
    name: str | None
    species: str | None
    breed: str | None
    sex: str | None
    birth_date: date | None
    purchase_date: date | None
    purchase_price: Decimal | None
    sale_price: Decimal | None
    lactation_number: int | None
    lactation_start_date: date | None
    lactation_end_date: date | None
    lactation_status: str
    active_lactation: bool
    days_in_milk: int | None
    exit_date: date | None
    exit_reason: ExitReason | None
    notes: str | None
    is_active: bool | None
    created_at: datetime | None
    updated_at: datetime | None
    economic_summary: AnimalEconomicSummary | None = None

class AnimalStatsResponse(BaseModel):
    total_active: int
    male_count: int
    female_count: int
