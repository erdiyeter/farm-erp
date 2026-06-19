from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class WithdrawalLockBase(BaseModel):
    animal_id: int
    health_record_id: int | None = None
    start_date: date
    end_date: date
    reason: str | None = None


class WithdrawalLockCreate(WithdrawalLockBase):
    pass


class WithdrawalLockUpdate(BaseModel):
    animal_id: int | None = None
    health_record_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    reason: str | None = None
    is_active: bool | None = None


class WithdrawalLockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    animal_id: int
    health_record_id: int | None
    start_date: date
    end_date: date
    reason: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
