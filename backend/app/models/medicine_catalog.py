from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MedicineCatalog(Base):
    __tablename__ = "medicine_catalog"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_name: Mapped[str] = mapped_column(String(150), nullable=False)
    active_ingredient: Mapped[str] = mapped_column(String(150), nullable=False)
    target_species: Mapped[str] = mapped_column(String(50), nullable=False)
    application_route: Mapped[str] = mapped_column(String(50), nullable=False)
    milk_withdrawal_days: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2)
    )
    meat_withdrawal_days: Mapped[Decimal | None] = mapped_column(
        Numeric(6, 2)
    )
    is_milk_allowed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    is_meat_allowed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    source_name: Mapped[str | None] = mapped_column(String(150))
    source_type: Mapped[str | None] = mapped_column(String(50))
    confidence_level: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'medium'")
    )
    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
