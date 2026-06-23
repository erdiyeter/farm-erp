from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ReproductionEventType = Literal["mating", "pregnancy", "birth"]
PregnancyOutcome = Literal[
    "pregnant", "birth", "abortion", "failed", "unknown"
]


class ReproductionEventCreate(BaseModel):
    animal_id: int
    event_type: ReproductionEventType
    event_date: date
    pregnancy_status: bool | None = None
    pregnancy_outcome: PregnancyOutcome | None = None
    offspring_count: int | None = Field(default=None, ge=1)
    notes: str | None = None


class ReproductionEventUpdate(BaseModel):
    animal_id: int | None = None
    event_type: ReproductionEventType | None = None
    event_date: date | None = None
    pregnancy_status: bool | None = None
    pregnancy_outcome: PregnancyOutcome | None = None
    offspring_count: int | None = Field(default=None, ge=1)
    notes: str | None = None


class ReproductionEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    event_type: ReproductionEventType
    event_date: date
    pregnancy_status: bool | None
    pregnancy_outcome: PregnancyOutcome | None
    offspring_count: int | None
    is_twin_birth: bool
    notes: str | None
    created_at: datetime | None
    updated_at: datetime | None
