from pydantic import BaseModel, ConfigDict, Field, field_validator


class SettingsUpdate(BaseModel):
    farm_name: str | None = Field(default=None, max_length=150)
    owner_name: str | None = Field(default=None, max_length=150)
    contact_phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    notes: str | None = None

    @field_validator("farm_name")
    @classmethod
    def farm_name_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Farm name must not be blank")
        return value


class SettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    farm_name: str | None
    owner_name: str | None
    contact_phone: str | None
    address: str | None
    notes: str | None
