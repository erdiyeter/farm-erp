from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.finance import FinancialRecord
from app.schemas.finance import FinancialRecordCreate, FinancialRecordUpdate


def create_financial_record(
    db: Session, financial_record_data: FinancialRecordCreate
) -> FinancialRecord:
    financial_record = FinancialRecord(**financial_record_data.model_dump())
    db.add(financial_record)
    db.commit()
    db.refresh(financial_record)
    return financial_record


def list_financial_records(db: Session) -> list[FinancialRecord]:
    statement = (
        select(FinancialRecord)
        .where(FinancialRecord.is_active.is_(True))
        .order_by(
            FinancialRecord.record_date.desc(),
            FinancialRecord.created_at.desc(),
            FinancialRecord.id.desc(),
        )
    )
    return list(db.scalars(statement).all())


def get_financial_record_by_id(
    db: Session, finance_record_id: int
) -> FinancialRecord | None:
    return db.get(FinancialRecord, finance_record_id)


def update_financial_record(
    db: Session,
    financial_record: FinancialRecord,
    financial_record_data: FinancialRecordUpdate,
) -> FinancialRecord:
    for field, value in financial_record_data.model_dump(
        exclude_unset=True
    ).items():
        setattr(financial_record, field, value)

    db.commit()
    db.refresh(financial_record)
    return financial_record


def soft_delete_financial_record(
    db: Session, financial_record: FinancialRecord
) -> FinancialRecord:
    financial_record.is_active = False
    db.commit()
    db.refresh(financial_record)
    return financial_record
