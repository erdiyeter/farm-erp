from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.finance import FinancialRecord
from app.models.health_record import HealthRecord
from app.models.milk_record import MilkRecord


def count_animals(db: Session) -> int:
    statement = select(func.count()).select_from(Animal)
    return db.scalar(statement) or 0


def count_active_animals(db: Session) -> int:
    statement = select(func.count()).where(Animal.is_active.is_(True))
    return db.scalar(statement) or 0


def count_inactive_animals(db: Session) -> int:
    statement = select(func.count()).where(Animal.is_active.is_(False))
    return db.scalar(statement) or 0


def get_today_milk_total(db: Session) -> Decimal:
    today = date.today()
    statement = select(func.coalesce(func.sum(MilkRecord.milk_liters), 0)).where(
        MilkRecord.record_date == today
    )
    return db.scalar(statement) or Decimal("0")


def get_last_7_days_milk_total(db: Session) -> Decimal:
    today = date.today()
    start_date = today - timedelta(days=6)
    statement = select(func.coalesce(func.sum(MilkRecord.milk_liters), 0)).where(
        MilkRecord.record_date >= start_date,
        MilkRecord.record_date <= today,
    )
    return db.scalar(statement) or Decimal("0")


def count_milk_records(db: Session) -> int:
    statement = select(func.count()).select_from(MilkRecord)
    return db.scalar(statement) or 0


def count_health_records(db: Session) -> int:
    statement = select(func.count()).select_from(HealthRecord)
    return db.scalar(statement) or 0


def count_today_health_records(db: Session) -> int:
    today = date.today()
    statement = select(func.count()).where(HealthRecord.record_date == today)
    return db.scalar(statement) or 0


def count_active_withdrawal_health_records(db: Session) -> int:
    today = date.today()
    statement = select(func.count()).where(
        HealthRecord.withdrawal_end_date.is_not(None),
        HealthRecord.withdrawal_end_date >= today,
    )
    return db.scalar(statement) or 0


def count_financial_records_by_type(
    db: Session, record_type: str
) -> int:
    statement = select(func.count()).where(
        FinancialRecord.is_active.is_(True),
        FinancialRecord.record_type == record_type,
    )
    return db.scalar(statement) or 0
