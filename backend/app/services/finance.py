from sqlalchemy.orm import Session

from app.models.finance import FinancialRecord
from app.repositories import finance as finance_repository
from app.schemas.finance import FinancialRecordCreate, FinancialRecordUpdate


def create_financial_record(
    db: Session, financial_record_data: FinancialRecordCreate
) -> FinancialRecord:
    return finance_repository.create_financial_record(
        db, financial_record_data
    )


def list_financial_records(db: Session) -> list[FinancialRecord]:
    return finance_repository.list_financial_records(db)


def get_financial_record(
    db: Session, finance_record_id: int
) -> FinancialRecord:
    financial_record = finance_repository.get_financial_record_by_id(
        db, finance_record_id
    )
    if financial_record is None or financial_record.is_active is not True:
        raise LookupError("Finance record not found")
    return financial_record


def update_financial_record(
    db: Session,
    finance_record_id: int,
    financial_record_data: FinancialRecordUpdate,
) -> FinancialRecord:
    financial_record = get_financial_record(db, finance_record_id)
    return finance_repository.update_financial_record(
        db, financial_record, financial_record_data
    )


def soft_delete_financial_record(
    db: Session, finance_record_id: int
) -> FinancialRecord:
    financial_record = get_financial_record(db, finance_record_id)
    return finance_repository.soft_delete_financial_record(
        db, financial_record
    )
