from datetime import date

from pydantic import BaseModel, ConfigDict


class DashboardRecentRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    record_date: date
    milk_liters: float
    session: str | None
    notes: str | None


class DashboardResponse(BaseModel):
    total_animals: int
    today_milk_liters: float
    last_7_days_milk_liters: float
    recent_records: list[DashboardRecentRecord]
