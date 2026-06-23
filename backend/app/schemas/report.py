from datetime import date

from pydantic import BaseModel

from app.schemas.alarm import AlarmResponse
from app.schemas.animal import AnimalDetailResponse
from app.schemas.finance import FinancialRecordResponse
from app.schemas.health_record import HealthRecordResponse
from app.schemas.milk_record import MilkRecordListResponse
from app.schemas.reproduction_event import ReproductionEventResponse
from app.schemas.withdrawal_lock import WithdrawalLockResponse
from app.schemas.weight_record import WeightRecordResponse


class AnimalSummaryReport(BaseModel):
    total_animals: int
    active_animals: int
    inactive_animals: int


class MilkSummaryReport(BaseModel):
    today_milk_liters: float
    last_7_days_milk_liters: float
    total_milk_records: int


class HealthSummaryReport(BaseModel):
    total_health_records: int
    today_health_records: int
    active_withdrawal_health_records: int


class FinanceSummaryReport(BaseModel):
    total_income_records: int
    total_expense_records: int
    net_record_count: int


class ExitReasonCount(BaseModel):
    exit_reason: str
    count: int


class ReportSummary(BaseModel):
    total_animals: int
    total_milk_records: int
    total_milk_liters: float
    average_daily_milk: float
    total_health_records: int
    total_weight_records: int
    latest_weight_kg: float | None
    latest_weight_record_date: date | None
    average_weight_change_kg: float | None
    animals_with_weight_change: int
    total_reproduction_events: int
    total_matings: int
    total_pregnancies: int
    total_births: int
    total_offspring: int
    twin_births: int
    pregnant_outcomes: int
    abortion_outcomes: int
    failed_outcomes: int
    unknown_outcomes: int
    animals_with_reproduction_history: int
    last_birth_date: date | None
    total_exited_animals: int
    sold_exits: int
    mortality_exits: int
    exits_by_reason: list[ExitReasonCount]
    total_income: float
    total_expense: float
    active_withdrawal_locks: int
    open_alarms: int


class ReportDetails(BaseModel):
    milk_records: list[MilkRecordListResponse]
    health_records: list[HealthRecordResponse]
    weight_records: list[WeightRecordResponse]
    reproduction_events: list[ReproductionEventResponse]
    exited_animals: list[AnimalDetailResponse]
    financial_records: list[FinancialRecordResponse]
    withdrawal_locks: list[WithdrawalLockResponse]
    alarms: list[AlarmResponse]
