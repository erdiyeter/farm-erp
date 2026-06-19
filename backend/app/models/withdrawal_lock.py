from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class WithdrawalLock(Base):
    __tablename__ = "withdrawal_locks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    animal_id: Mapped[int] = mapped_column(
        ForeignKey("animals.id"), nullable=False
    )
    health_record_id: Mapped[int | None] = mapped_column(
        ForeignKey("health_records.id")
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool | None] = mapped_column(
        Boolean, server_default=text("true")
    )
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
