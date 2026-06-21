from pydantic import BaseModel

from app.schemas.alarm import AlarmResponse
from app.schemas.finance import FinancialRecordResponse
from app.schemas.health_record import HealthRecordResponse
from app.schemas.milk_record import MilkRecordListResponse
from app.schemas.withdrawal_lock import WithdrawalLockResponse


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


class ReportSummary(BaseModel):
    total_animals: int
    total_milk_records: int
    total_milk_liters: float
    total_health_records: int
    total_income: float
    total_expense: float
    active_withdrawal_locks: int
    open_alarms: int


class ReportDetails(BaseModel):
    milk_records: list[MilkRecordListResponse]
    health_records: list[HealthRecordResponse]
    financial_records: list[FinancialRecordResponse]
    withdrawal_locks: list[WithdrawalLockResponse]
    alarms: list[AlarmResponse]
