from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.models.alarm import Alarm
from app.models.finance import FinancialRecord
from app.models.health_record import HealthRecord
from app.models.milk_record import MilkRecord
from app.models.reproduction_event import ReproductionEvent
from app.models.weight_record import WeightRecord
from app.models.withdrawal_lock import WithdrawalLock


def count_animals(db: Session) -> int:
    statement = select(func.count()).select_from(Animal)
    return db.scalar(statement) or 0


def count_active_animals(db: Session) -> int:
    statement = select(func.count()).where(Animal.is_active.is_(True))
    return db.scalar(statement) or 0


def count_inactive_animals(db: Session) -> int:
    statement = select(func.count()).where(Animal.is_active.is_(False))
    return db.scalar(statement) or 0


def count_exited_animals(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count()).where(Animal.exit_date.is_not(None))
    if start_date:
        statement = statement.where(Animal.exit_date >= start_date)
    if end_date:
        statement = statement.where(Animal.exit_date <= end_date)
    return db.scalar(statement) or 0


def count_exits_by_reason(
    db: Session,
    exit_reason: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count()).where(
        Animal.exit_date.is_not(None),
        Animal.exit_reason == exit_reason,
    )
    if start_date:
        statement = statement.where(Animal.exit_date >= start_date)
    if end_date:
        statement = statement.where(Animal.exit_date <= end_date)
    return db.scalar(statement) or 0


def list_exit_reason_counts(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[tuple[str, int]]:
    statement = (
        select(Animal.exit_reason, func.count())
        .where(Animal.exit_date.is_not(None))
        .group_by(Animal.exit_reason)
        .order_by(Animal.exit_reason)
    )
    if start_date:
        statement = statement.where(Animal.exit_date >= start_date)
    if end_date:
        statement = statement.where(Animal.exit_date <= end_date)
    return [(reason, count) for reason, count in db.execute(statement).all()]


def list_exited_animals_for_report(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[Animal]:
    statement = select(Animal).where(Animal.exit_date.is_not(None))
    if start_date:
        statement = statement.where(Animal.exit_date >= start_date)
    if end_date:
        statement = statement.where(Animal.exit_date <= end_date)
    statement = statement.order_by(Animal.exit_date.desc(), Animal.id.desc())
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


def list_animals_for_export(db: Session) -> list[Animal]:
    statement = select(Animal).order_by(Animal.id)
    return list(db.scalars(statement).all())


def list_health_records_for_export(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[HealthRecord]:
    statement = select(HealthRecord).order_by(HealthRecord.id)
    if start_date:
        statement = statement.where(HealthRecord.record_date >= start_date)
    if end_date:
        statement = statement.where(HealthRecord.record_date <= end_date)
    return list(db.scalars(statement).all())


def list_withdrawal_locks_for_export(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[WithdrawalLock]:
    statement = select(WithdrawalLock).order_by(WithdrawalLock.id)
    if start_date:
        statement = statement.where(WithdrawalLock.start_date >= start_date)
    if end_date:
        statement = statement.where(WithdrawalLock.start_date <= end_date)
    return list(db.scalars(statement).all())


def list_milk_records_for_export(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[MilkRecord]:
    statement = select(MilkRecord).order_by(MilkRecord.id)
    if start_date:
        statement = statement.where(MilkRecord.record_date >= start_date)
    if end_date:
        statement = statement.where(MilkRecord.record_date <= end_date)
    return list(db.scalars(statement).all())


def list_weight_records_for_export(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[WeightRecord]:
    statement = select(WeightRecord).order_by(WeightRecord.id)
    if start_date:
        statement = statement.where(WeightRecord.record_date >= start_date)
    if end_date:
        statement = statement.where(WeightRecord.record_date <= end_date)
    return list(db.scalars(statement).all())


def list_reproduction_events_for_report(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[ReproductionEvent]:
    statement = select(ReproductionEvent).order_by(
        ReproductionEvent.event_date.desc(), ReproductionEvent.id.desc()
    )
    if start_date:
        statement = statement.where(ReproductionEvent.event_date >= start_date)
    if end_date:
        statement = statement.where(ReproductionEvent.event_date <= end_date)
    return list(db.scalars(statement).all())


def count_filtered_reproduction_events(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count()).select_from(ReproductionEvent)
    if start_date:
        statement = statement.where(ReproductionEvent.event_date >= start_date)
    if end_date:
        statement = statement.where(ReproductionEvent.event_date <= end_date)
    return db.scalar(statement) or 0


def count_filtered_reproduction_events_by_type(
    db: Session,
    event_type: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count()).where(
        ReproductionEvent.event_type == event_type
    )
    if event_type == "pregnancy":
        statement = statement.where(
            ReproductionEvent.pregnancy_status.is_(True)
        )
    if start_date:
        statement = statement.where(ReproductionEvent.event_date >= start_date)
    if end_date:
        statement = statement.where(ReproductionEvent.event_date <= end_date)
    return db.scalar(statement) or 0


def get_filtered_offspring_total(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(
        func.coalesce(func.sum(ReproductionEvent.offspring_count), 0)
    ).where(ReproductionEvent.event_type == "birth")
    if start_date:
        statement = statement.where(ReproductionEvent.event_date >= start_date)
    if end_date:
        statement = statement.where(ReproductionEvent.event_date <= end_date)
    return db.scalar(statement) or 0


def count_filtered_twin_births(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count()).where(
        ReproductionEvent.event_type == "birth",
        ReproductionEvent.offspring_count == 2,
    )
    if start_date:
        statement = statement.where(ReproductionEvent.event_date >= start_date)
    if end_date:
        statement = statement.where(ReproductionEvent.event_date <= end_date)
    return db.scalar(statement) or 0


def count_filtered_pregnancy_outcomes(
    db: Session,
    pregnancy_outcome: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count()).where(
        ReproductionEvent.pregnancy_outcome == pregnancy_outcome
    )
    if start_date:
        statement = statement.where(ReproductionEvent.event_date >= start_date)
    if end_date:
        statement = statement.where(ReproductionEvent.event_date <= end_date)
    return db.scalar(statement) or 0


def count_animals_with_reproduction_history(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(
        func.count(func.distinct(ReproductionEvent.animal_id))
    )
    if start_date:
        statement = statement.where(ReproductionEvent.event_date >= start_date)
    if end_date:
        statement = statement.where(ReproductionEvent.event_date <= end_date)
    return db.scalar(statement) or 0


def get_latest_birth_date(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> date | None:
    statement = select(func.max(ReproductionEvent.event_date)).where(
        ReproductionEvent.event_type == "birth"
    )
    if start_date:
        statement = statement.where(ReproductionEvent.event_date >= start_date)
    if end_date:
        statement = statement.where(ReproductionEvent.event_date <= end_date)
    return db.scalar(statement)


def count_filtered_weight_records(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count()).select_from(WeightRecord)
    if start_date:
        statement = statement.where(WeightRecord.record_date >= start_date)
    if end_date:
        statement = statement.where(WeightRecord.record_date <= end_date)
    return db.scalar(statement) or 0


def count_filtered_milk_records(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count()).select_from(MilkRecord)
    if start_date:
        statement = statement.where(MilkRecord.record_date >= start_date)
    if end_date:
        statement = statement.where(MilkRecord.record_date <= end_date)
    return db.scalar(statement) or 0


def get_filtered_milk_total(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> Decimal:
    statement = select(func.coalesce(func.sum(MilkRecord.milk_liters), 0))
    if start_date:
        statement = statement.where(MilkRecord.record_date >= start_date)
    if end_date:
        statement = statement.where(MilkRecord.record_date <= end_date)
    return db.scalar(statement) or Decimal("0")


def count_filtered_milk_days(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count(func.distinct(MilkRecord.record_date)))
    if start_date:
        statement = statement.where(MilkRecord.record_date >= start_date)
    if end_date:
        statement = statement.where(MilkRecord.record_date <= end_date)
    return db.scalar(statement) or 0


def count_filtered_health_records(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count()).select_from(HealthRecord)
    if start_date:
        statement = statement.where(HealthRecord.record_date >= start_date)
    if end_date:
        statement = statement.where(HealthRecord.record_date <= end_date)
    return db.scalar(statement) or 0


def get_financial_total(
    db: Session,
    record_type: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> Decimal:
    statement = select(
        func.coalesce(func.sum(FinancialRecord.amount), 0)
    ).where(
        FinancialRecord.is_active.is_(True),
        FinancialRecord.record_type == record_type,
    )
    if start_date:
        statement = statement.where(FinancialRecord.record_date >= start_date)
    if end_date:
        statement = statement.where(FinancialRecord.record_date <= end_date)
    return db.scalar(statement) or Decimal("0")


def count_active_withdrawal_locks(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    today = date.today()
    statement = select(func.count()).where(
        WithdrawalLock.is_active.is_(True),
        WithdrawalLock.end_date >= today,
    )
    if start_date:
        statement = statement.where(WithdrawalLock.start_date >= start_date)
    if end_date:
        statement = statement.where(WithdrawalLock.start_date <= end_date)
    return db.scalar(statement) or 0


def count_open_alarms(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> int:
    statement = select(func.count()).where(Alarm.is_completed.is_(False))
    if start_date:
        statement = statement.where(Alarm.due_date >= start_date)
    if end_date:
        statement = statement.where(Alarm.due_date <= end_date)
    return db.scalar(statement) or 0


def list_financial_records_for_report(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[FinancialRecord]:
    statement = select(FinancialRecord).where(
        FinancialRecord.is_active.is_(True)
    )
    if start_date:
        statement = statement.where(FinancialRecord.record_date >= start_date)
    if end_date:
        statement = statement.where(FinancialRecord.record_date <= end_date)
    statement = statement.order_by(
        FinancialRecord.record_date.desc(), FinancialRecord.id.desc()
    )
    return list(db.scalars(statement).all())


def list_alarms_for_report(
    db: Session,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[Alarm]:
    statement = select(Alarm)
    if start_date:
        statement = statement.where(Alarm.due_date >= start_date)
    if end_date:
        statement = statement.where(Alarm.due_date <= end_date)
    statement = statement.order_by(Alarm.due_date.desc(), Alarm.id.desc())
    return list(db.scalars(statement).all())
