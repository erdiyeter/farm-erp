from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Integer, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Animal(Base):
    __tablename__ = "animals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ear_tag: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(100))
    species: Mapped[str | None] = mapped_column(
        String(50), server_default=text("'cattle'")
    )
    breed: Mapped[str | None] = mapped_column(String(100))
    sex: Mapped[str | None] = mapped_column(String(10))
    birth_date: Mapped[date | None] = mapped_column(Date)
    lactation_number: Mapped[int | None] = mapped_column(Integer)
    lactation_start_date: Mapped[date | None] = mapped_column(Date)
    lactation_end_date: Mapped[date | None] = mapped_column(Date)
    exit_date: Mapped[date | None] = mapped_column(Date)
    exit_reason: Mapped[str | None] = mapped_column(String(20))
    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool | None] = mapped_column(
        Boolean, server_default=text("true")
    )
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    @property
    def lactation_status(self) -> str:
        if self.lactation_start_date and self.lactation_end_date is None:
            return "Active"
        if self.lactation_end_date:
            return "Ended"
        return "Unknown"

    @property
    def active_lactation(self) -> bool:
        return self.lactation_status == "Active"

    @property
    def days_in_milk(self) -> int | None:
        if self.lactation_start_date is None:
            return None
        end_date = self.lactation_end_date or date.today()
        return (end_date - self.lactation_start_date).days
