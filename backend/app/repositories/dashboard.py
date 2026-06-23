from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.health_record import HealthRecord
from app.models.milk_record import MilkRecord
from app.models.weight_record import WeightRecord
from app.models.withdrawal_lock import WithdrawalLock


def count_active_animals(db: Session) -> int:
    statement = select(func.count()).where(Animal.is_active.is_(True))
    return db.scalar(statement) or 0


def list_animals(db: Session) -> list[Animal]:
    statement = select(Animal).order_by(Animal.id)
    return list(db.scalars(statement).all())


def list_active_withdrawal_locks(db: Session) -> list[WithdrawalLock]:
    today = date.today()
    statement = select(WithdrawalLock).where(
        WithdrawalLock.is_active.is_(True),
        WithdrawalLock.end_date >= today,
    )
    return list(db.scalars(statement).all())


def get_treatment_counts_by_animal(db: Session) -> dict[int, int]:
    statement = (
        select(HealthRecord.animal_id, func.count())
        .where(HealthRecord.record_type == "treatment")
        .group_by(HealthRecord.animal_id)
    )
    return {
        animal_id: count
        for animal_id, count in db.execute(statement).all()
    }


def get_milk_record_counts_by_animal(db: Session) -> dict[int, int]:
    statement = (
        select(MilkRecord.animal_id, func.count())
        .group_by(MilkRecord.animal_id)
    )
    return {
        animal_id: count
        for animal_id, count in db.execute(statement).all()
    }


def list_weight_records(db: Session) -> list[WeightRecord]:
    statement = select(WeightRecord).order_by(
        WeightRecord.animal_id,
        WeightRecord.record_date.desc(),
        WeightRecord.id.desc(),
    )
    return list(db.scalars(statement).all())


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


def count_health_records(db: Session) -> int:
    statement = select(func.count()).select_from(HealthRecord)
    return db.scalar(statement) or 0


def count_today_health_records(db: Session) -> int:
    today = date.today()
    statement = select(func.count()).where(
        HealthRecord.record_date == today
    )
    return db.scalar(statement) or 0


def count_last_7_days_health_records(db: Session) -> int:
    today = date.today()
    start_date = today - timedelta(days=6)
    statement = select(func.count()).where(
        HealthRecord.record_date >= start_date,
        HealthRecord.record_date <= today,
    )
    return db.scalar(statement) or 0


def count_active_withdrawal_health_records(db: Session) -> int:
    today = date.today()
    statement = select(func.count()).where(
        HealthRecord.withdrawal_end_date.is_not(None),
        HealthRecord.withdrawal_end_date >= today,
    )
    return db.scalar(statement) or 0


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
