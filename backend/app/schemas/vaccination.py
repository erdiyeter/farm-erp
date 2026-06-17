from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class VaccinationCreate(BaseModel):
    animal_id: int
    vaccine_name: str = Field(max_length=100)
    dose: str | None = Field(default=None, max_length=50)
    application_date: date
    next_due_date: date | None = None
    notes: str | None = None


class VaccinationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    vaccine_name: str
    dose: str | None
    application_date: date
    next_due_date: date | None
    notes: str | None
    created_at: datetime | None
