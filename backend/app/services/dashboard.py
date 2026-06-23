from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.repositories import dashboard as dashboard_repository
from app.services import animal as animal_service
from app.schemas.dashboard import (
    DashboardDecisionSupportAnimal,
    DashboardDecisionSupportRankingAnimal,
    DashboardDecisionSupportSummary,
    DashboardGoldenListAnimal,
    DashboardPriorityReviewAnimal,
    DashboardResponse,
)


def build_decision_support_animal(
    animal,
    indicators: list[str],
    net_economic_value=None,
) -> DashboardDecisionSupportAnimal:
    return DashboardDecisionSupportAnimal(
        animal_id=animal.id,
        ear_tag=animal.ear_tag,
        name=animal.name,
        indicators=indicators,
        net_economic_value=(
            float(net_economic_value)
            if net_economic_value is not None
            else None
        ),
        exit_date=animal.exit_date,
    )


def build_ranking_animal(
    animal,
    metric_value,
    metric_label: str,
) -> DashboardDecisionSupportRankingAnimal:
    return DashboardDecisionSupportRankingAnimal(
        animal_id=animal.id,
        ear_tag=animal.ear_tag,
        name=animal.name,
        metric_value=float(metric_value),
        metric_label=metric_label,
    )


def build_golden_list_animal(
    animal,
    economic_summary,
) -> DashboardGoldenListAnimal:
    strengths = ["Positive Economic Value", "Low Treatment Frequency"]
    if economic_summary.lifetime_milk_production > 0:
        strengths.append("Milk Production Recorded")
    if economic_summary.health_event_count < 5:
        strengths.append("Low Health Activity")

    return DashboardGoldenListAnimal(
        animal_id=animal.id,
        ear_tag=animal.ear_tag,
        name=animal.name,
        strengths=strengths,
        net_economic_value=float(economic_summary.net_economic_value),
        lifetime_milk_production=float(
            economic_summary.lifetime_milk_production
        ),
        treatment_count=economic_summary.treatment_count,
    )


def build_priority_review_animal(
    animal,
    economic_summary,
    attention_reasons: list[str],
    has_active_withdrawal_lock: bool,
    urgency_rank: int,
) -> DashboardPriorityReviewAnimal:
    net_economic_value = economic_summary.net_economic_value
    return DashboardPriorityReviewAnimal(
        animal_id=animal.id,
        ear_tag=animal.ear_tag,
        name=animal.name,
        attention_reasons=attention_reasons,
        net_economic_value=(
            float(net_economic_value)
            if net_economic_value is not None
            else None
        ),
        treatment_count=economic_summary.treatment_count,
        health_event_count=economic_summary.health_event_count,
        has_active_withdrawal_lock=has_active_withdrawal_lock,
        urgency_rank=urgency_rank,
    )


def get_weight_gain_rankings(
    animals_by_id: dict[int, object],
    active_animal_ids: set[int],
    weight_records,
) -> list[DashboardDecisionSupportRankingAnimal]:
    records_by_animal = {}
    for record in weight_records:
        if record.animal_id not in active_animal_ids:
            continue
        records_by_animal.setdefault(record.animal_id, []).append(record)

    rankings = []
    for animal_id, records in records_by_animal.items():
        if len(records) < 2:
            continue

        latest, previous = records[0], records[1]
        if latest.record_date == previous.record_date:
            continue

        weight_gain = latest.weight_kg - previous.weight_kg
        rankings.append(
            build_ranking_animal(
                animals_by_id[animal_id],
                weight_gain,
                f"{weight_gain} kg",
            )
        )

    return rankings


def get_dashboard_decision_support(
    db: Session,
) -> DashboardDecisionSupportSummary:
    today = date.today()
    recent_exit_start = today - timedelta(days=29)
    animals = dashboard_repository.list_animals(db)
    animals_by_id = {animal.id: animal for animal in animals}
    active_animals = [
        animal for animal in animals if animal.is_active is True
    ]
    active_animal_ids = {animal.id for animal in active_animals}
    active_lock_animal_ids = {
        lock.animal_id
        for lock in dashboard_repository.list_active_withdrawal_locks(db)
    }
    treatment_counts = dashboard_repository.get_treatment_counts_by_animal(db)
    milk_record_counts = (
        dashboard_repository.get_milk_record_counts_by_animal(db)
    )
    weight_gain_rankings = get_weight_gain_rankings(
        animals_by_id,
        active_animal_ids,
        dashboard_repository.list_weight_records(db),
    )

    attention_by_animal = {}
    negative_economic_animals = []
    recently_exited_animals = []
    economic_rankings = []
    milk_rankings = []
    treatment_rankings = []
    golden_list_animals = []
    economic_summaries = {}

    for animal in animals:
        indicators = []
        economic_summary = animal_service.get_animal_economic_summary(
            db, animal
        )
        economic_summaries[animal.id] = economic_summary
        net_economic_value = economic_summary.net_economic_value
        if net_economic_value is not None:
            economic_rankings.append(
                build_ranking_animal(
                    animal,
                    net_economic_value,
                    f"{net_economic_value}",
                )
            )

        if animal.id in active_animal_ids:
            if milk_record_counts.get(animal.id, 0) > 0:
                milk_rankings.append(
                    build_ranking_animal(
                        animal,
                        economic_summary.lifetime_milk_production,
                        f"{economic_summary.lifetime_milk_production} L",
                    )
                )

            treatment_count = treatment_counts.get(animal.id, 0)
            if treatment_count > 0:
                treatment_rankings.append(
                    build_ranking_animal(
                        animal,
                        treatment_count,
                        f"{treatment_count} treatments",
                    )
                )

            if (
                net_economic_value is not None
                and net_economic_value > 0
                and animal.id not in active_lock_animal_ids
                and economic_summary.treatment_count < 3
                and economic_summary.health_event_count < 5
            ):
                golden_list_animals.append(
                    build_golden_list_animal(animal, economic_summary)
                )

        if net_economic_value is not None and net_economic_value < 0:
            indicators.append("Negative Economic Value")

        if animal.id in active_lock_animal_ids:
            indicators.append("Active Withdrawal Lock")

        if treatment_counts.get(animal.id, 0) >= 3:
            indicators.append("Repeated Treatments")

        if (
            animal.exit_date is not None
            and recent_exit_start <= animal.exit_date <= today
        ):
            indicators.append("Recently Exited")

        if indicators:
            attention_by_animal[animal.id] = build_decision_support_animal(
                animal, indicators, net_economic_value
            )

        if net_economic_value is not None and net_economic_value < 0:
            negative_economic_animals.append(
                build_decision_support_animal(
                    animal,
                    ["Negative Economic Value"],
                    net_economic_value,
                )
            )

        if (
            animal.exit_date is not None
            and recent_exit_start <= animal.exit_date <= today
        ):
            recently_exited_animals.append(
                build_decision_support_animal(
                    animal,
                    ["Recently Exited"],
                    net_economic_value,
                )
            )

    attention_animals = sorted(
        attention_by_animal.values(),
        key=lambda item: (item.ear_tag, item.animal_id),
    )
    negative_economic_animals.sort(
        key=lambda item: (
            item.net_economic_value
            if item.net_economic_value is not None
            else 0,
            item.ear_tag,
        )
    )
    recently_exited_animals.sort(
        key=lambda item: (item.exit_date or date.min, item.animal_id),
        reverse=True,
    )
    economic_rankings.sort(
        key=lambda item: (item.metric_value, item.ear_tag),
        reverse=True,
    )
    bottom_economic_animals = sorted(
        economic_rankings,
        key=lambda item: (item.metric_value, item.ear_tag),
    )
    milk_rankings.sort(
        key=lambda item: (item.metric_value, item.ear_tag),
        reverse=True,
    )
    low_milk_producers = sorted(
        milk_rankings,
        key=lambda item: (item.metric_value, item.ear_tag),
    )
    treatment_rankings.sort(
        key=lambda item: (item.metric_value, item.ear_tag),
        reverse=True,
    )
    weight_gain_rankings.sort(
        key=lambda item: (item.metric_value, item.ear_tag),
        reverse=True,
    )
    lowest_weight_gain_animals = sorted(
        weight_gain_rankings,
        key=lambda item: (item.metric_value, item.ear_tag),
    )
    highest_milk_value = (
        max(item.metric_value for item in milk_rankings)
        if milk_rankings
        else None
    )
    highest_weight_gain_value = (
        max(item.metric_value for item in weight_gain_rankings)
        if weight_gain_rankings
        else None
    )
    low_milk_ids = {
        item.animal_id
        for item in low_milk_producers[:5]
        if (
            highest_milk_value is not None
            and item.metric_value < highest_milk_value
        )
    }
    low_weight_gain_ids = {
        item.animal_id
        for item in lowest_weight_gain_animals[:5]
        if (
            highest_weight_gain_value is not None
            and item.metric_value < highest_weight_gain_value
        )
    }
    golden_list_animals.sort(
        key=lambda item: (
            item.net_economic_value,
            item.lifetime_milk_production,
            -item.treatment_count,
        ),
        reverse=True,
    )
    priority_review_animals = []
    for animal in animals:
        economic_summary = economic_summaries[animal.id]
        net_economic_value = economic_summary.net_economic_value
        has_active_withdrawal_lock = animal.id in active_lock_animal_ids
        reasons = []
        urgency_ranks = []

        if has_active_withdrawal_lock:
            reasons.append("Withdrawal Lock")
            urgency_ranks.append(1)

        if net_economic_value is not None and net_economic_value < 0:
            reasons.append("Economic Attention")
            urgency_ranks.append(2)

        if economic_summary.treatment_count >= 3:
            reasons.append("Health Attention: Repeated Treatments")
            urgency_ranks.append(3)

        if economic_summary.health_event_count >= 5:
            reasons.append("Health Attention: High Health Activity")
            urgency_ranks.append(4)

        if animal.id in low_weight_gain_ids:
            reasons.append("Growth Attention")
            urgency_ranks.append(5)

        if animal.id in low_milk_ids:
            reasons.append("Production Attention")
            urgency_ranks.append(6)

        if (
            animal.exit_date is not None
            and recent_exit_start <= animal.exit_date <= today
        ):
            reasons.append("Recently Exited")
            urgency_ranks.append(7)

        if reasons:
            priority_review_animals.append(
                build_priority_review_animal(
                    animal,
                    economic_summary,
                    reasons,
                    has_active_withdrawal_lock,
                    min(urgency_ranks),
                )
            )

    priority_review_animals.sort(
        key=lambda item: (item.urgency_rank, item.ear_tag, item.animal_id)
    )
    top_performing_animals, lowest_performing_animals = (
        animal_service.get_active_animal_economic_rankings(db)
    )

    return DashboardDecisionSupportSummary(
        animals_requiring_attention=len(attention_animals),
        animals_with_negative_economic_value=len(negative_economic_animals),
        animals_with_active_withdrawal_locks=len(active_lock_animal_ids),
        animals_with_repeated_treatments=sum(
            1 for count in treatment_counts.values() if count >= 3
        ),
        recently_exited_animals=len(recently_exited_animals),
        attention_required_animals=attention_animals[:5],
        negative_economic_value_animals=negative_economic_animals[:5],
        recently_exited_animal_list=recently_exited_animals[:5],
        top_economic_animals=economic_rankings[:5],
        bottom_economic_animals=bottom_economic_animals[:5],
        top_milk_producers=milk_rankings[:5],
        low_milk_producers=low_milk_producers[:5],
        most_treated_animals=treatment_rankings[:5],
        highest_weight_gain_animals=weight_gain_rankings[:5],
        lowest_weight_gain_animals=lowest_weight_gain_animals[:5],
        golden_list_animals=golden_list_animals[:5],
        priority_review_animals=priority_review_animals[:10],
        top_performing_animals=top_performing_animals,
        lowest_performing_animals=lowest_performing_animals,
    )


def get_dashboard_summary(db: Session) -> DashboardResponse:
    total_health_records = dashboard_repository.count_health_records(db)
    today_health_records = (
        dashboard_repository.count_today_health_records(db)
    )
    last_7_days_health_records = (
        dashboard_repository.count_last_7_days_health_records(db)
    )
    active_withdrawal_health_records = (
        dashboard_repository.count_active_withdrawal_health_records(db)
    )
    active_withdrawal_locks = (
        dashboard_repository.count_active_withdrawal_locks(db)
    )
    expiring_today = (
        dashboard_repository.count_withdrawal_locks_expiring_today(db)
    )
    overdue_withdrawal_locks = (
        dashboard_repository.count_overdue_withdrawal_locks(db)
    )

    return DashboardResponse(
        total_animals=dashboard_repository.count_active_animals(db),
        today_milk_liters=float(
            dashboard_repository.get_today_milk_total(db)
        ),
        last_7_days_milk_liters=float(
            dashboard_repository.get_last_7_days_milk_total(db)
        ),
        total_health_records=total_health_records,
        today_health_records=today_health_records,
        last_7_days_health_records=last_7_days_health_records,
        active_withdrawal_health_records=active_withdrawal_health_records,
        active_withdrawal_locks=active_withdrawal_locks,
        withdrawal_locks_expiring_today=expiring_today,
        overdue_withdrawal_locks=overdue_withdrawal_locks,
        recent_records=dashboard_repository.get_recent_milk_records(db),
        decision_support=get_dashboard_decision_support(db),
    )
