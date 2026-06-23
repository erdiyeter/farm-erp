from decimal import Decimal

from sqlalchemy import Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Settings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    farm_name: Mapped[str | None] = mapped_column(String(150))
    owner_name: Mapped[str | None] = mapped_column(String(150))
    contact_phone: Mapped[str | None] = mapped_column(String(50))
    milk_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    address: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
