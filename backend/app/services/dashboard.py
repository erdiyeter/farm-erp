from sqlalchemy.orm import Session

from app.repositories import dashboard as dashboard_repository
from app.schemas.dashboard import DashboardResponse


def get_dashboard_summary(db: Session) -> DashboardResponse:
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
        active_withdrawal_locks=active_withdrawal_locks,
        withdrawal_locks_expiring_today=expiring_today,
        overdue_withdrawal_locks=overdue_withdrawal_locks,
        recent_records=dashboard_repository.get_recent_milk_records(db),
    )
