from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ReproductionEvent(Base):
    __tablename__ = "reproduction_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    animal_id: Mapped[int] = mapped_column(
        ForeignKey("animals.id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    pregnancy_status: Mapped[bool | None] = mapped_column(Boolean)
    pregnancy_outcome: Mapped[str | None] = mapped_column(String(20))
    offspring_count: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    @property
    def is_twin_birth(self) -> bool:
        return self.event_type == "birth" and self.offspring_count == 2
