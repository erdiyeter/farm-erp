from pydantic import BaseModel


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
