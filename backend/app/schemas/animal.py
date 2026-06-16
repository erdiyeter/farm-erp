from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class AnimalCreate(BaseModel):
    ear_tag: str = Field(max_length=50)
    name: str | None = Field(default=None, max_length=100)
    species: str = Field(default="cattle", max_length=50)
    breed: str | None = Field(default=None, max_length=100)
    sex: str | None = Field(default=None, max_length=10)
    birth_date: date | None = None
    notes: str | None = None
    is_active: bool = True


class AnimalUpdate(BaseModel):
    ear_tag: str | None = Field(default=None, max_length=50)
    name: str | None = Field(default=None, max_length=100)
    species: str | None = Field(default=None, max_length=50)
    breed: str | None = Field(default=None, max_length=100)
    sex: str | None = Field(default=None, max_length=10)
    birth_date: date | None = None
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
    notes: str | None
    is_active: bool | None
    created_at: datetime | None
    updated_at: datetime | None
