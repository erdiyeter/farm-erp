from sqlalchemy.orm import Session

from app.repositories import dashboard as dashboard_repository
from app.schemas.dashboard import DashboardResponse


def get_dashboard_summary(db: Session) -> DashboardResponse:
    return DashboardResponse(
        total_animals=dashboard_repository.count_active_animals(db),
        today_milk_liters=float(
            dashboard_repository.get_today_milk_total(db)
        ),
        last_7_days_milk_liters=float(
            dashboard_repository.get_last_7_days_milk_total(db)
        ),
        recent_records=dashboard_repository.get_recent_milk_records(db),
    )
