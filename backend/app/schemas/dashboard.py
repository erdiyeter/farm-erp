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


class DashboardDecisionSupportAnimal(BaseModel):
    animal_id: int
    ear_tag: str
    name: str | None
    indicators: list[str]
    net_economic_value: float | None = None
    exit_date: date | None = None


class DashboardDecisionSupportRankingAnimal(BaseModel):
    animal_id: int
    ear_tag: str
    name: str | None
    metric_value: float
    metric_label: str


class DashboardGoldenListAnimal(BaseModel):
    animal_id: int
    ear_tag: str
    name: str | None
    strengths: list[str]
    net_economic_value: float
    lifetime_milk_production: float
    treatment_count: int


class DashboardDecisionSupportSummary(BaseModel):
    animals_requiring_attention: int
    animals_with_negative_economic_value: int
    animals_with_active_withdrawal_locks: int
    animals_with_repeated_treatments: int
    recently_exited_animals: int
    attention_required_animals: list[DashboardDecisionSupportAnimal]
    negative_economic_value_animals: list[DashboardDecisionSupportAnimal]
    recently_exited_animal_list: list[DashboardDecisionSupportAnimal]
    top_economic_animals: list[DashboardDecisionSupportRankingAnimal]
    bottom_economic_animals: list[DashboardDecisionSupportRankingAnimal]
    top_milk_producers: list[DashboardDecisionSupportRankingAnimal]
    low_milk_producers: list[DashboardDecisionSupportRankingAnimal]
    most_treated_animals: list[DashboardDecisionSupportRankingAnimal]
    highest_weight_gain_animals: list[DashboardDecisionSupportRankingAnimal]
    lowest_weight_gain_animals: list[DashboardDecisionSupportRankingAnimal]
    golden_list_animals: list[DashboardGoldenListAnimal]


class DashboardResponse(BaseModel):
    total_animals: int
    today_milk_liters: float
    last_7_days_milk_liters: float
    total_health_records: int
    today_health_records: int
    last_7_days_health_records: int
    active_withdrawal_health_records: int
    active_withdrawal_locks: int
    withdrawal_locks_expiring_today: int
    overdue_withdrawal_locks: int
    recent_records: list[DashboardRecentRecord]
    decision_support: DashboardDecisionSupportSummary
