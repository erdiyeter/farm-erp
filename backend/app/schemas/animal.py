from datetime import date, datetime
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


class AnimalCreate(BaseModel):
    ear_tag: str = Field(max_length=50)
    name: str | None = Field(default=None, max_length=100)
    species: str = Field(default="cattle", max_length=50)
    breed: str | None = Field(default=None, max_length=100)
    sex: str | None = Field(default=None, max_length=10)
    birth_date: date | None = None
    exit_date: date | None = None
    exit_reason: ExitReason | None = None
    notes: str | None = None
    is_active: bool = True

    @model_validator(mode="after")
    def validate_lifecycle(self):
        validate_lifecycle_fields(self.exit_date, self.exit_reason)
        return self


class AnimalUpdate(BaseModel):
    ear_tag: str | None = Field(default=None, max_length=50)
    name: str | None = Field(default=None, max_length=100)
    species: str | None = Field(default=None, max_length=50)
    breed: str | None = Field(default=None, max_length=100)
    sex: str | None = Field(default=None, max_length=10)
    birth_date: date | None = None
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


class AnimalDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ear_tag: str
    name: str | None
    species: str | None
    breed: str | None
    sex: str | None
    birth_date: date | None
    exit_date: date | None
    exit_reason: ExitReason | None
    notes: str | None
    is_active: bool | None
    created_at: datetime | None
    updated_at: datetime | None

class AnimalStatsResponse(BaseModel):
    total_active: int
    male_count: int
    female_count: int
