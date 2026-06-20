from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.milk_record import MilkRecord
from app.models.withdrawal_lock import WithdrawalLock


def count_active_animals(db: Session) -> int:
    statement = select(func.count()).where(Animal.is_active.is_(True))
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


def get_recent_milk_records(
    db: Session, limit: int = 5
) -> list[MilkRecord]:
    statement = (
        select(MilkRecord)
        .order_by(MilkRecord.record_date.desc(), MilkRecord.id.desc())
        .limit(limit)
    )
    return list(db.scalars(statement).all())


def count_active_withdrawal_locks(db: Session) -> int:
    today = date.today()
    statement = select(func.count()).where(
        WithdrawalLock.is_active.is_(True),
        WithdrawalLock.end_date >= today,
    )
    return db.scalar(statement) or 0


def count_withdrawal_locks_expiring_today(db: Session) -> int:
    today = date.today()
    statement = select(func.count()).where(
        WithdrawalLock.is_active.is_(True),
        WithdrawalLock.end_date == today,
    )
    return db.scalar(statement) or 0


def count_overdue_withdrawal_locks(db: Session) -> int:
    today = date.today()
    statement = select(func.count()).where(
        WithdrawalLock.is_active.is_(True),
        WithdrawalLock.end_date < today,
    )
    return db.scalar(statement) or 0
