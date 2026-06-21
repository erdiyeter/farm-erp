from datetime import date
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import Session

from app.models.health_record import HealthRecord
from app.repositories import animal as animal_repository
from app.repositories import health_record as health_record_repository
from app.repositories import inventory as inventory_repository
from app.schemas.health_record import (
    HealthInventoryConsumption,
    HealthRecordCreate,
    HealthRecordDetailResponse,
    HealthRecordUpdate,
)
from app.schemas.inventory import InventoryMovementCreate
from app.services import inventory as inventory_service


def list_health_records(db: Session) -> list[HealthRecord]:
    return health_record_repository.get_all_health_records(db)


def list_health_records_by_animal(
    animal_id: int, db: Session
) -> list[HealthRecord]:
    validate_active_animal(db, animal_id)
    return health_record_repository.get_health_records_by_animal_id(
        db, animal_id
    )


def create_health_record(
    db: Session, health_record_data: HealthRecordCreate
) -> HealthRecord:
    validate_active_animal(db, health_record_data.animal_id)

    if should_create_inventory_consumption(
        health_record_data.record_type,
        health_record_data.inventory_item_id,
    ):
        quantity = parse_inventory_quantity(health_record_data.dosage)
        try:
            health_record = health_record_repository.create_health_record(
                db, health_record_data, commit=False
            )
            create_inventory_consumption(
                db,
                health_record.id,
                health_record_data.inventory_item_id,
                quantity,
                health_record_data.record_date,
            )
            db.commit()
            db.refresh(health_record)
            return health_record
        except Exception:
            db.rollback()
            raise

    return health_record_repository.create_health_record(
        db, health_record_data
    )


def get_health_record(db: Session, health_record_id: int) -> HealthRecord:
    health_record = health_record_repository.get_health_record_by_id(
        db, health_record_id
    )
    if health_record is None:
        raise LookupError("Health record not found")
    return health_record


def get_health_record_detail(
    db: Session, health_record_id: int
) -> HealthRecordDetailResponse:
    health_record = get_health_record(db, health_record_id)
    response = HealthRecordDetailResponse.model_validate(health_record)
    movement = get_inventory_consumption(db, health_record_id)
    if movement is None:
        return response

    item = inventory_repository.get_inventory_item_by_id(
        db, movement.item_id
    )
    if item is None:
        return response

    consumption = HealthInventoryConsumption(
        item_id=item.id,
        item_name=item.name,
        quantity=movement.quantity,
        movement_date=movement.movement_date,
    )
    return response.model_copy(
        update={"inventory_consumption": consumption}
    )


def update_health_record(
    db: Session,
    health_record_id: int,
    health_record_data: HealthRecordUpdate,
) -> HealthRecord:
    health_record = get_health_record(db, health_record_id)

    if health_record_data.animal_id is not None:
        validate_active_animal(db, health_record_data.animal_id)

    existing_consumption = get_inventory_consumption(db, health_record_id)
    inventory_item_id = health_record_data.inventory_item_id
    if existing_consumption is not None:
        if (
            inventory_item_id is not None
            and inventory_item_id != existing_consumption.item_id
        ):
            raise ValueError(
                "Inventory consumption already exists for this health record"
            )
        if (
            health_record_data.record_type is not None
            and health_record_data.record_type != health_record.record_type
        ):
            raise ValueError(
                "Record type cannot change after inventory consumption"
            )
        if (
            health_record_data.record_date is not None
            and health_record_data.record_date != health_record.record_date
        ):
            raise ValueError(
                "Record date cannot change after inventory consumption"
            )
        if health_record_data.dosage is not None:
            quantity = parse_inventory_quantity(health_record_data.dosage)
            if quantity != existing_consumption.quantity:
                raise ValueError(
                    "Dosage cannot change after inventory consumption"
                )
        return health_record_repository.update_health_record(
            db, health_record, health_record_data
        )

    record_type = health_record_data.record_type or health_record.record_type
    if should_create_inventory_consumption(record_type, inventory_item_id):
        dosage = (
            health_record_data.dosage
            if health_record_data.dosage is not None
            else health_record.dosage
        )
        record_date = (
            health_record_data.record_date or health_record.record_date
        )
        quantity = parse_inventory_quantity(dosage)
        try:
            updated_record = health_record_repository.update_health_record(
                db, health_record, health_record_data, commit=False
            )
            create_inventory_consumption(
                db,
                health_record_id,
                inventory_item_id,
                quantity,
                record_date,
            )
            db.commit()
            db.refresh(updated_record)
            return updated_record
        except Exception:
            db.rollback()
            raise

    return health_record_repository.update_health_record(
        db, health_record, health_record_data
    )


def delete_health_record(db: Session, health_record_id: int) -> None:
    health_record = get_health_record(db, health_record_id)
    health_record_repository.delete_health_record(db, health_record)


def validate_active_animal(db: Session, animal_id: int) -> None:
    animal = animal_repository.get_animal_by_id(db, animal_id)

    if animal is None:
        raise LookupError("Animal not found")

    if animal.is_active is not True:
        raise ValueError("Animal is inactive")


def should_create_inventory_consumption(
    record_type: str, inventory_item_id: int | None
) -> bool:
    return record_type == "treatment" and inventory_item_id is not None


def parse_inventory_quantity(dosage: str | None) -> Decimal:
    if dosage is None:
        raise ValueError(
            "Dosage is required when an inventory item is selected"
        )

    try:
        quantity = Decimal(dosage)
    except InvalidOperation as exc:
        raise ValueError(
            "Dosage must be a positive number for inventory consumption"
        ) from exc

    if not quantity.is_finite() or quantity <= 0:
        raise ValueError(
            "Dosage must be a positive number for inventory consumption"
        )
    return quantity


def inventory_consumption_note(health_record_id: int) -> str:
    return f"Health record ID: {health_record_id}"


def get_inventory_consumption(db: Session, health_record_id: int):
    return inventory_repository.get_inventory_movement_by_notes(
        db, inventory_consumption_note(health_record_id)
    )


def create_inventory_consumption(
    db: Session,
    health_record_id: int,
    inventory_item_id: int,
    quantity: Decimal,
    movement_date: date,
) -> None:
    movement_data = InventoryMovementCreate(
        item_id=inventory_item_id,
        movement_type="out",
        quantity=quantity,
        movement_date=movement_date,
        notes=inventory_consumption_note(health_record_id),
    )
    inventory_service.create_inventory_movement(
        db, movement_data, commit=False
    )
