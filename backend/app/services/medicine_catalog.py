from sqlalchemy.orm import Session

from app.models.medicine_catalog import MedicineCatalog
from app.repositories import medicine_catalog as medicine_catalog_repository
from app.schemas.medicine_catalog import (
    MedicineCatalogCreate,
    MedicineCatalogUpdate,
)


def list_medicine_catalog_records(db: Session) -> list[MedicineCatalog]:
    return medicine_catalog_repository.list_active_medicine_catalog_records(db)


def get_medicine_catalog_record(
    db: Session, medicine_catalog_id: int
) -> MedicineCatalog:
    medicine_catalog = (
        medicine_catalog_repository.get_medicine_catalog_record_by_id(
            db, medicine_catalog_id
        )
    )
    if medicine_catalog is None or medicine_catalog.is_active is not True:
        raise LookupError("Medicine catalog record not found")
    return medicine_catalog


def ensure_unique_active_catalog_record(
    db: Session,
    product_name: str,
    target_species: str,
    application_route: str,
    excluded_id: int | None = None,
) -> None:
    duplicate = medicine_catalog_repository.get_active_duplicate(
        db,
        product_name,
        target_species,
        application_route,
        excluded_id,
    )
    if duplicate is not None:
        raise ValueError(
            "Medicine catalog record already exists for this product, "
            "species, and route"
        )


def create_medicine_catalog_record(
    db: Session, medicine_catalog_data: MedicineCatalogCreate
) -> MedicineCatalog:
    ensure_unique_active_catalog_record(
        db,
        medicine_catalog_data.product_name,
        medicine_catalog_data.target_species,
        medicine_catalog_data.application_route,
    )
    return medicine_catalog_repository.create_medicine_catalog_record(
        db, medicine_catalog_data
    )


def update_medicine_catalog_record(
    db: Session,
    medicine_catalog_id: int,
    medicine_catalog_data: MedicineCatalogUpdate,
) -> MedicineCatalog:
    medicine_catalog = get_medicine_catalog_record(db, medicine_catalog_id)
    update_data = medicine_catalog_data.model_dump(exclude_unset=True)

    product_name = update_data.get(
        "product_name", medicine_catalog.product_name
    )
    target_species = update_data.get(
        "target_species", medicine_catalog.target_species
    )
    application_route = update_data.get(
        "application_route", medicine_catalog.application_route
    )
    ensure_unique_active_catalog_record(
        db,
        product_name,
        target_species,
        application_route,
        excluded_id=medicine_catalog.id,
    )
    return medicine_catalog_repository.update_medicine_catalog_record(
        db, medicine_catalog, medicine_catalog_data
    )


def soft_delete_medicine_catalog_record(
    db: Session, medicine_catalog_id: int
) -> MedicineCatalog:
    medicine_catalog = get_medicine_catalog_record(db, medicine_catalog_id)
    return medicine_catalog_repository.soft_delete_medicine_catalog_record(
        db, medicine_catalog
    )
