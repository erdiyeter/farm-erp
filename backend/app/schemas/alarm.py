from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


AlarmType = Literal["vaccination", "withdrawal", "health", "reminder"]
AlarmPriority = Literal["low", "medium", "high"]


class AlarmCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str | None = None
    alarm_type: AlarmType
    priority: AlarmPriority
    due_date: date
    is_completed: bool = False


class AlarmUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    alarm_type: AlarmType | None = None
    priority: AlarmPriority | None = None
    due_date: date | None = None
    is_completed: bool | None = None


class AlarmResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    alarm_type: str
    priority: str
    due_date: date
    is_completed: bool
    created_at: datetime | None
