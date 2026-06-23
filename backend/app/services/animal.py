from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.animal import Animal
from app.repositories import animal as animal_repository
from app.repositories import health_record as health_record_repository
from app.repositories import inventory as inventory_repository
from app.repositories import milk_record as milk_record_repository
from app.repositories import settings as settings_repository
from app.schemas.animal import (
    AnimalCreate,
    AnimalDetailResponse,
    AnimalEconomicSummary,
    AnimalStatsResponse,
    AnimalUpdate,
    validate_lactation_fields,
    validate_lifecycle_fields,
)


def get_health_inventory_consumption_note(health_record_id: int) -> str:
    return f"Health record ID: {health_record_id}"


def calculate_health_cost(db: Session, health_records) -> Decimal | None:
    total_cost = Decimal("0")
    has_costed_consumption = False

    for record in health_records:
        movement = inventory_repository.get_inventory_movement_by_notes(
            db, get_health_inventory_consumption_note(record.id)
        )
        if (
            movement is None
            or movement.inventory_item is None
            or movement.inventory_item.unit_cost is None
        ):
            continue

        total_cost += movement.quantity * movement.inventory_item.unit_cost
        has_costed_consumption = True

    return total_cost if has_costed_consumption else None


def list_active_animals(db: Session) -> list[Animal]:
    return animal_repository.get_active_animals(db)


def get_animal(db: Session, animal_id: int) -> Animal:
    animal = animal_repository.get_animal_by_id(db, animal_id)
    if animal is None:
        raise LookupError("Animal not found")
    return animal


def get_animal_detail(db: Session, animal_id: int) -> AnimalDetailResponse:
    return build_animal_detail_response(db, get_animal(db, animal_id))


def build_animal_detail_response(
    db: Session, animal: Animal
) -> AnimalDetailResponse:
    return AnimalDetailResponse.model_validate(
        animal,
        from_attributes=True,
    ).model_copy(
        update={
            "economic_summary": get_animal_economic_summary(db, animal)
        }
    )


def get_animal_economic_summary(
    db: Session, animal: Animal
) -> AnimalEconomicSummary:
    milk_records = milk_record_repository.get_milk_records_by_animal_id(
        db, animal.id
    )
    health_records = health_record_repository.get_health_records_by_animal_id(
        db, animal.id
    )
    lifetime_milk_production = sum(
        (record.milk_liters for record in milk_records),
        Decimal("0"),
    )
    treatment_count = sum(
        1
        for record in health_records
        if record.record_type.lower() == "treatment"
    )
    settings = settings_repository.get_or_create_settings(db)
    lifetime_milk_revenue = (
        lifetime_milk_production * settings.milk_price
        if settings.milk_price is not None
        else None
    )
    health_cost = calculate_health_cost(db, health_records)
    profit_loss = (
        animal.sale_price - animal.purchase_price
        if animal.sale_price is not None and animal.purchase_price is not None
        else None
    )
    net_economic_value = (
        lifetime_milk_revenue
        + animal.sale_price
        - animal.purchase_price
        - health_cost
        if (
            lifetime_milk_revenue is not None
            and animal.sale_price is not None
            and animal.purchase_price is not None
            and health_cost is not None
        )
        else None
    )

    return AnimalEconomicSummary(
        purchase_value=animal.purchase_price,
        sale_value=animal.sale_price,
        profit_loss=profit_loss,
        lifetime_milk_production=lifetime_milk_production,
        lifetime_milk_revenue=lifetime_milk_revenue,
        health_event_count=len(health_records),
        treatment_count=treatment_count,
        health_cost=health_cost,
        net_economic_value=net_economic_value,
    )


def create_animal(db: Session, animal_data: AnimalCreate) -> Animal:
    existing_animal = animal_repository.get_animal_by_ear_tag(
        db, animal_data.ear_tag
    )
    if existing_animal is not None:
        raise ValueError("Ear tag already exists")
    validate_lifecycle_fields(animal_data.exit_date, animal_data.exit_reason)
    validate_lactation_fields(
        animal_data.lactation_start_date, animal_data.lactation_end_date
    )
    lifecycle_data = animal_data.model_copy(
        update={"is_active": animal_data.exit_date is None}
    )
    return animal_repository.create_animal(db, lifecycle_data)


def update_animal(
    db: Session, animal_id: int, animal_data: AnimalUpdate
) -> Animal:
    animal = get_animal(db, animal_id)

    if animal_data.ear_tag is not None and animal_data.ear_tag != animal.ear_tag:
        existing_animal = animal_repository.get_animal_by_ear_tag(
            db, animal_data.ear_tag
        )
        if existing_animal is not None:
            raise ValueError("Ear tag already exists")

    changes = animal_data.model_dump(exclude_unset=True)
    exit_date = changes.get("exit_date", animal.exit_date)
    exit_reason = changes.get("exit_reason", animal.exit_reason)
    lactation_start_date = changes.get(
        "lactation_start_date", animal.lactation_start_date
    )
    lactation_end_date = changes.get(
        "lactation_end_date", animal.lactation_end_date
    )
    validate_lifecycle_fields(exit_date, exit_reason)
    validate_lactation_fields(lactation_start_date, lactation_end_date)

    if {"exit_date", "exit_reason", "is_active"} & changes.keys():
        changes["is_active"] = exit_date is None

    return animal_repository.update_animal(
        db, animal, AnimalUpdate.model_validate(changes)
    )


def soft_delete_animal(db: Session, animal_id: int) -> Animal:
    animal = get_animal(db, animal_id)
    return animal_repository.soft_delete_animal(db, animal)

def get_animal_stats(db: Session) -> AnimalStatsResponse:
    return AnimalStatsResponse(
        total_active=animal_repository.get_total_active_animals(db),
        male_count=animal_repository.get_male_animals_count(db),
        female_count=animal_repository.get_female_animals_count(db),
    )
