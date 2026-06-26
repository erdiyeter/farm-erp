from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.repositories import dashboard as dashboard_repository
from app.services import animal as animal_service
from app.services import report as report_service
from app.schemas.dashboard import (
    DashboardDecisionSupportAnimal,
    DashboardDecisionSupportFocusItem,
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
        explanations=[
            f"Triggered by stored rule: {indicator}"
            for indicator in indicators
        ],
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
    explanations: list[str] | None = None,
) -> DashboardDecisionSupportRankingAnimal:
    return DashboardDecisionSupportRankingAnimal(
        animal_id=animal.id,
        ear_tag=animal.ear_tag,
        name=animal.name,
        metric_value=float(metric_value),
        metric_label=metric_label,
        explanations=explanations or [],
    )


def get_economic_value_explanations(economic_summary) -> list[str]:
    net_economic_value = economic_summary.net_economic_value
    if net_economic_value is None:
        return ["Net economic value is not calculable from current data"]
    if net_economic_value > 0:
        return ["Positive net economic value"]
    if net_economic_value < 0:
        return ["Negative net economic value"]
    return ["Net economic value is zero"]


def has_meaningful_economic_attention(economic_summary) -> bool:
    net_economic_value = economic_summary.net_economic_value
    if net_economic_value is None or net_economic_value >= 0:
        return False

    return (
        economic_summary.treatment_count >= 3
        or economic_summary.health_event_count >= 5
    )


def get_milk_explanations(economic_summary, is_low: bool = False) -> list[str]:
    liters = economic_summary.lifetime_milk_production
    if is_low:
        return [f"Lower lifetime milk production: {liters} L"]
    return [f"High lifetime milk production: {liters} L"]


def get_treatment_explanations(treatment_count: int) -> list[str]:
    if treatment_count >= 3:
        return [f"Repeated treatments: {treatment_count} records"]
    return [f"Treatment records: {treatment_count}"]


def get_weight_gain_explanations(weight_gain, is_low: bool = False) -> list[str]:
    if is_low:
        return [f"Lower latest weight gain: {weight_gain} kg"]
    return [f"Higher latest weight gain: {weight_gain} kg"]


def get_herd_decision_support_explanations(
    herd_kpis,
    active_lock_count: int,
    repeated_treatment_count: int,
    negative_economic_count: int,
) -> tuple[list[str], list[str]]:
    warnings = []
    opportunities = []

    if active_lock_count:
        warnings.append(f"{active_lock_count} active withdrawal lock(s)")
    if repeated_treatment_count:
        warnings.append(
            f"{repeated_treatment_count} animal(s) with repeated treatments"
        )
    if negative_economic_count:
        warnings.append(
            f"{negative_economic_count} animal(s) requiring economic attention"
        )
    if herd_kpis.mortality_count:
        warnings.append(f"{herd_kpis.mortality_count} mortality exit(s)")

    if herd_kpis.average_economic_score is not None:
        opportunities.append(
            f"Average economic score is {herd_kpis.average_economic_score:.2f}"
        )
    if herd_kpis.highest_economic_score is not None:
        opportunities.append(
            f"Highest economic score is {herd_kpis.highest_economic_score:.2f}"
        )
    if herd_kpis.active_animals:
        opportunities.append(
            f"{herd_kpis.active_animals} active animal(s) available for ranking"
        )

    return warnings[:5], opportunities[:5]


def get_golden_list_recommendations(strengths: list[str]) -> list[str]:
    recommendations = []

    if "Positive Economic Value" in strengths:
        recommendations.append("Review as a candidate for retention planning.")
    if "Milk Production Recorded" in strengths:
        recommendations.append("Continue monitoring production performance.")
    if "Low Treatment Frequency" in strengths:
        recommendations.append("Maintain current health management routine.")
    if "Low Health Activity" in strengths:
        recommendations.append("Keep routine preventive care schedule.")

    return recommendations


def get_attention_recommendations(attention_reasons: list[str]) -> list[str]:
    recommendation_by_reason = {
        "Economic Attention": "Evaluate long-term economic viability.",
        "Health Attention: Repeated Treatments": (
            "Review recent health records and treatment history."
        ),
        "Health Attention: High Health Activity": (
            "Review recent health records and treatment history."
        ),
        "Withdrawal Lock": (
            "Verify withdrawal end date before sale or use."
        ),
        "Production Attention": (
            "Review recent milk production performance."
        ),
        "Growth Attention": "Review recent weight gain records.",
        "Recently Exited": "Review exit reason and herd impact.",
    }
    recommendations = []
    for reason in attention_reasons:
        recommendation = recommendation_by_reason.get(reason)
        if recommendation and recommendation not in recommendations:
            recommendations.append(recommendation)

    return recommendations


def get_recommendation_for_attention_reason(reason: str) -> str:
    recommendations = get_attention_recommendations([reason])
    return recommendations[0] if recommendations else "Review animal record."


def get_attention_priority(
    attention_reasons: list[str],
) -> tuple[str, int, str]:
    has_health = any(
        reason.startswith("Health Attention")
        for reason in attention_reasons
    )
    has_withdrawal = "Withdrawal Lock" in attention_reasons
    has_economic = "Economic Attention" in attention_reasons
    has_production = "Production Attention" in attention_reasons
    has_growth = "Growth Attention" in attention_reasons

    if has_health and (has_withdrawal or len(attention_reasons) > 1):
        return (
            "Critical",
            1,
            "Health attention combined with another attention reason.",
        )

    if has_economic and (has_production or has_growth):
        return (
            "High",
            2,
            "Economic attention combined with production or growth attention.",
        )

    if has_health or has_production or has_growth or has_economic or has_withdrawal:
        return (
            "Medium",
            3,
            "Single operational attention reason.",
        )

    return (
        "Low",
        4,
        "Informational review item.",
    )


def build_decision_support_focus(
    priority_review_animals: list[DashboardPriorityReviewAnimal],
) -> list[DashboardDecisionSupportFocusItem]:
    reason_counts = {}
    for animal in priority_review_animals:
        for reason in animal.attention_reasons:
            reason_counts[reason] = reason_counts.get(reason, 0) + 1

    reason_order = {
        "Health Attention: Repeated Treatments": 1,
        "Health Attention: High Health Activity": 2,
        "Production Attention": 3,
        "Growth Attention": 4,
        "Economic Attention": 5,
        "Withdrawal Lock": 6,
        "Recently Exited": 7,
    }

    return [
        DashboardDecisionSupportFocusItem(
            reason=reason,
            animal_count=count,
            recommended_action=get_recommendation_for_attention_reason(reason),
        )
        for reason, count in sorted(
            reason_counts.items(),
            key=lambda item: (reason_order.get(item[0], 99), item[0]),
        )
    ]


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
        recommended_actions=get_golden_list_recommendations(strengths),
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
    priority_level, priority_rank, priority_explanation = (
        get_attention_priority(attention_reasons)
    )
    return DashboardPriorityReviewAnimal(
        animal_id=animal.id,
        ear_tag=animal.ear_tag,
        name=animal.name,
        attention_reasons=attention_reasons,
        recommended_actions=get_attention_recommendations(attention_reasons),
        priority_level=priority_level,
        priority_rank=priority_rank,
        priority_explanation=priority_explanation,
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
                get_weight_gain_explanations(weight_gain),
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
                    get_economic_value_explanations(economic_summary),
                )
            )

        if animal.id in active_animal_ids:
            if milk_record_counts.get(animal.id, 0) > 0:
                milk_rankings.append(
                    build_ranking_animal(
                        animal,
                        economic_summary.lifetime_milk_production,
                        f"{economic_summary.lifetime_milk_production} L",
                        get_milk_explanations(economic_summary),
                    )
                )

            treatment_count = treatment_counts.get(animal.id, 0)
            if treatment_count > 0:
                treatment_rankings.append(
                    build_ranking_animal(
                        animal,
                        treatment_count,
                        f"{treatment_count} treatments",
                        get_treatment_explanations(treatment_count),
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

        has_economic_attention = has_meaningful_economic_attention(
            economic_summary
        )

        if has_economic_attention:
            indicators.append("Economic Attention")

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

        if has_economic_attention:
            negative_economic_animals.append(
                build_decision_support_animal(
                    animal,
                    ["Economic Attention"],
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
    low_milk_producers = [
        item.model_copy(
            update={
                "explanations": [
                    f"Lower lifetime milk production: {item.metric_label}"
                ]
            }
        )
        for item in low_milk_producers
    ]
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
    lowest_weight_gain_animals = [
        item.model_copy(
            update={
                "explanations": [
                    f"Lower latest weight gain: {item.metric_label}"
                ]
            }
        )
        for item in lowest_weight_gain_animals
    ]
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

        if has_meaningful_economic_attention(economic_summary):
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
        key=lambda item: (
            item.priority_rank,
            item.urgency_rank,
            item.ear_tag,
            item.animal_id,
        )
    )
    top_performing_animals, lowest_performing_animals = (
        animal_service.get_active_animal_economic_rankings(db)
    )
    herd_kpis = report_service.get_herd_kpis(db)
    herd_warnings, herd_opportunities = get_herd_decision_support_explanations(
        herd_kpis,
        len(active_lock_animal_ids),
        sum(1 for count in treatment_counts.values() if count >= 3),
        len(negative_economic_animals),
    )

    return DashboardDecisionSupportSummary(
        animals_requiring_attention=len(attention_animals),
        animals_with_negative_economic_value=len(negative_economic_animals),
        animals_with_active_withdrawal_locks=len(active_lock_animal_ids),
        animals_with_repeated_treatments=sum(
            1 for count in treatment_counts.values() if count >= 3
        ),
        recently_exited_animals=len(recently_exited_animals),
        key_herd_warnings=herd_warnings,
        key_herd_opportunities=herd_opportunities,
        todays_focus=build_decision_support_focus(priority_review_animals),
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
        black_list_animals=priority_review_animals,
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
        herd_kpis=report_service.get_herd_kpis(db),
        herd_trends=report_service.get_herd_trends(db),
        decision_support=get_dashboard_decision_support(db),
    )
