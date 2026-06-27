from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.medicine_catalog import MedicineCatalog
from app.schemas.medicine_catalog import (
    MedicineCatalogCreate,
    MedicineCatalogUpdate,
)


def list_active_medicine_catalog_records(
    db: Session,
) -> list[MedicineCatalog]:
    statement = (
        select(MedicineCatalog)
        .where(MedicineCatalog.is_active.is_(True))
        .order_by(
            MedicineCatalog.product_name,
            MedicineCatalog.target_species,
            MedicineCatalog.application_route,
            MedicineCatalog.id,
        )
    )
    return list(db.scalars(statement).all())


def get_medicine_catalog_record_by_id(
    db: Session, medicine_catalog_id: int
) -> MedicineCatalog | None:
    return db.get(MedicineCatalog, medicine_catalog_id)


def get_active_duplicate(
    db: Session,
    product_name: str,
    target_species: str,
    application_route: str,
    excluded_id: int | None = None,
) -> MedicineCatalog | None:
    statement = select(MedicineCatalog).where(
        MedicineCatalog.is_active.is_(True),
        func.lower(MedicineCatalog.product_name) == product_name.lower(),
        func.lower(MedicineCatalog.target_species) == target_species.lower(),
        func.lower(MedicineCatalog.application_route)
        == application_route.lower(),
    )

    if excluded_id is not None:
        statement = statement.where(MedicineCatalog.id != excluded_id)

    return db.scalar(statement)


def create_medicine_catalog_record(
    db: Session, medicine_catalog_data: MedicineCatalogCreate
) -> MedicineCatalog:
    medicine_catalog = MedicineCatalog(**medicine_catalog_data.model_dump())
    db.add(medicine_catalog)
    db.commit()
    db.refresh(medicine_catalog)
    return medicine_catalog


def update_medicine_catalog_record(
    db: Session,
    medicine_catalog: MedicineCatalog,
    medicine_catalog_data: MedicineCatalogUpdate,
) -> MedicineCatalog:
    for field, value in medicine_catalog_data.model_dump(
        exclude_unset=True
    ).items():
        setattr(medicine_catalog, field, value)

    medicine_catalog.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(medicine_catalog)
    return medicine_catalog


def soft_delete_medicine_catalog_record(
    db: Session, medicine_catalog: MedicineCatalog
) -> MedicineCatalog:
    medicine_catalog.is_active = False
    medicine_catalog.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(medicine_catalog)
    return medicine_catalog
