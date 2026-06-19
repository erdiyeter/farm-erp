from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class HealthRecord(Base):
    __tablename__ = "health_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    animal_id: Mapped[int] = mapped_column(
        ForeignKey("animals.id"), nullable=False
    )
    record_type: Mapped[str] = mapped_column(String(50), nullable=False)
    diagnosis: Mapped[str | None] = mapped_column(String(150))
    treatment: Mapped[str | None] = mapped_column(Text)
    medicine_name: Mapped[str | None] = mapped_column(String(150))
    dosage: Mapped[str | None] = mapped_column(String(100))
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    withdrawal_end_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
