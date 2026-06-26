from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.animal import AnimalEconomicRanking
from app.schemas.report import HerdKpiSummary, HerdTrendSummary


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
    explanations: list[str]
    net_economic_value: float | None = None
    exit_date: date | None = None


class DashboardDecisionSupportRankingAnimal(BaseModel):
    animal_id: int
    ear_tag: str
    name: str | None
    metric_value: float
    metric_label: str
    explanations: list[str]


class DashboardGoldenListAnimal(BaseModel):
    animal_id: int
    ear_tag: str
    name: str | None
    strengths: list[str]
    recommended_actions: list[str]
    net_economic_value: float
    lifetime_milk_production: float
    treatment_count: int


class DashboardPriorityReviewAnimal(BaseModel):
    animal_id: int
    ear_tag: str
    name: str | None
    attention_reasons: list[str]
    recommended_actions: list[str]
    priority_level: str
    priority_rank: int
    priority_explanation: str
    net_economic_value: float | None
    treatment_count: int
    health_event_count: int
    has_active_withdrawal_lock: bool
    urgency_rank: int


class DashboardDecisionSupportFocusItem(BaseModel):
    reason: str
    animal_count: int
    recommended_action: str


class DashboardDecisionSupportSummary(BaseModel):
    animals_requiring_attention: int
    animals_with_negative_economic_value: int
    animals_with_active_withdrawal_locks: int
    animals_with_repeated_treatments: int
    recently_exited_animals: int
    key_herd_warnings: list[str]
    key_herd_opportunities: list[str]
    todays_focus: list[DashboardDecisionSupportFocusItem]
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
    black_list_animals: list[DashboardPriorityReviewAnimal]
    priority_review_animals: list[DashboardPriorityReviewAnimal]
    top_performing_animals: list[AnimalEconomicRanking]
    lowest_performing_animals: list[AnimalEconomicRanking]


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
    herd_kpis: HerdKpiSummary
    herd_trends: HerdTrendSummary
    decision_support: DashboardDecisionSupportSummary
