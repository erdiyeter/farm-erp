from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MedicineCatalogBase(BaseModel):
    product_name: str = Field(min_length=1, max_length=150)
    active_ingredient: str = Field(min_length=1, max_length=150)
    target_species: str = Field(min_length=1, max_length=50)
    application_route: str = Field(min_length=1, max_length=50)
    milk_withdrawal_days: Decimal | None = Field(default=None, ge=0)
    meat_withdrawal_days: Decimal | None = Field(default=None, ge=0)
    is_milk_allowed: bool = True
    is_meat_allowed: bool = True
    source_name: str | None = Field(default=None, max_length=150)
    source_type: str | None = Field(default=None, max_length=50)
    confidence_level: str = Field(default="medium", min_length=1, max_length=20)
    notes: str | None = None

    @field_validator(
        "product_name",
        "active_ingredient",
        "target_species",
        "application_route",
        "confidence_level",
    )
    @classmethod
    def required_text_must_not_be_blank(cls, value: str) -> str:
        stripped_value = value.strip()
        if not stripped_value:
            raise ValueError("Required text fields must not be empty")
        return stripped_value

    @field_validator("source_name", "source_type")
    @classmethod
    def optional_text_must_not_be_blank(
        cls, value: str | None
    ) -> str | None:
        if value is None:
            return None
        stripped_value = value.strip()
        return stripped_value or None


class MedicineCatalogCreate(MedicineCatalogBase):
    pass


class MedicineCatalogUpdate(BaseModel):
    product_name: str | None = Field(default=None, min_length=1, max_length=150)
    active_ingredient: str | None = Field(
        default=None, min_length=1, max_length=150
    )
    target_species: str | None = Field(default=None, min_length=1, max_length=50)
    application_route: str | None = Field(
        default=None, min_length=1, max_length=50
    )
    milk_withdrawal_days: Decimal | None = Field(default=None, ge=0)
    meat_withdrawal_days: Decimal | None = Field(default=None, ge=0)
    is_milk_allowed: bool | None = None
    is_meat_allowed: bool | None = None
    source_name: str | None = Field(default=None, max_length=150)
    source_type: str | None = Field(default=None, max_length=50)
    confidence_level: str | None = Field(
        default=None, min_length=1, max_length=20
    )
    notes: str | None = None

    @field_validator(
        "product_name",
        "active_ingredient",
        "target_species",
        "application_route",
        "confidence_level",
    )
    @classmethod
    def required_text_must_not_be_blank(
        cls, value: str | None
    ) -> str | None:
        if value is None:
            return None
        stripped_value = value.strip()
        if not stripped_value:
            raise ValueError("Required text fields must not be empty")
        return stripped_value

    @field_validator("source_name", "source_type")
    @classmethod
    def optional_text_must_not_be_blank(
        cls, value: str | None
    ) -> str | None:
        if value is None:
            return None
        stripped_value = value.strip()
        return stripped_value or None


class MedicineCatalogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_name: str
    active_ingredient: str
    target_species: str
    application_route: str
    milk_withdrawal_days: Decimal | None
    meat_withdrawal_days: Decimal | None
    is_milk_allowed: bool
    is_meat_allowed: bool
    source_name: str | None
    source_type: str | None
    confidence_level: str
    notes: str | None
    is_active: bool
    created_at: datetime | None
    updated_at: datetime | None
