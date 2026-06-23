from datetime import date

from sqlalchemy.orm import Session

from app.models.reproduction_event import ReproductionEvent
from app.repositories import animal as animal_repository
from app.repositories import reproduction_event as event_repository
from app.schemas.reproduction_event import (
    ReproductionEventCreate,
    ReproductionEventUpdate,
)


def list_reproduction_events(db: Session) -> list[ReproductionEvent]:
    return event_repository.get_reproduction_events(db)


def list_reproduction_events_by_animal_id(
    db: Session, animal_id: int
) -> list[ReproductionEvent]:
    validate_animal_exists(db, animal_id)
    return event_repository.get_reproduction_events_by_animal_id(
        db, animal_id
    )


def get_reproduction_event(
    db: Session, event_id: int
) -> ReproductionEvent:
    event = event_repository.get_reproduction_event_by_id(db, event_id)
    if event is None:
        raise LookupError("Reproduction event not found")
    return event


def create_reproduction_event(
    db: Session, event_data: ReproductionEventCreate
) -> ReproductionEvent:
    validate_animal_exists(db, event_data.animal_id)
    validate_event_date(event_data.event_date)
    validate_event_fields(
        event_data.event_type,
        event_data.pregnancy_status,
        event_data.pregnancy_outcome,
        event_data.offspring_count,
    )
    event_data = event_data.model_copy(
        update={
            "pregnancy_outcome": get_normalized_pregnancy_outcome(
                event_data.event_type,
                event_data.pregnancy_status,
                event_data.pregnancy_outcome,
            )
        }
    )
    return event_repository.create_reproduction_event(db, event_data)


def update_reproduction_event(
    db: Session,
    event_id: int,
    event_data: ReproductionEventUpdate,
) -> ReproductionEvent:
    event = get_reproduction_event(db, event_id)
    changes = event_data.model_dump(exclude_unset=True)
    animal_id = changes.get("animal_id", event.animal_id)
    event_type = changes.get("event_type", event.event_type)
    event_date = changes.get("event_date", event.event_date)
    pregnancy_status = changes.get(
        "pregnancy_status", event.pregnancy_status
    )
    pregnancy_outcome = changes.get(
        "pregnancy_outcome", event.pregnancy_outcome
    )
    offspring_count = changes.get("offspring_count", event.offspring_count)

    validate_animal_exists(db, animal_id)
    validate_event_date(event_date)
    validate_event_fields(
        event_type, pregnancy_status, pregnancy_outcome, offspring_count
    )
    event_data = event_data.model_copy(
        update={
            "pregnancy_outcome": get_normalized_pregnancy_outcome(
                event_type, pregnancy_status, pregnancy_outcome
            )
        }
    )
    return event_repository.update_reproduction_event(db, event, event_data)


def delete_reproduction_event(db: Session, event_id: int) -> None:
    event = get_reproduction_event(db, event_id)
    event_repository.delete_reproduction_event(db, event)


def validate_animal_exists(db: Session, animal_id: int) -> None:
    if animal_repository.get_animal_by_id(db, animal_id) is None:
        raise LookupError("Animal not found")


def validate_event_date(event_date: date) -> None:
    if event_date > date.today():
        raise ValueError("Reproduction event date cannot be in the future")


def validate_event_fields(
    event_type: str,
    pregnancy_status: bool | None,
    pregnancy_outcome: str | None,
    offspring_count: int | None,
) -> None:
    valid_outcomes = {"pregnant", "birth", "abortion", "failed", "unknown"}
    if pregnancy_outcome is not None and pregnancy_outcome not in valid_outcomes:
        raise ValueError("Invalid pregnancy outcome")

    if event_type == "pregnancy":
        if pregnancy_status is None:
            raise ValueError("Pregnancy status is required for pregnancy events")
        if offspring_count is not None:
            raise ValueError("Offspring count is only valid for birth events")
    elif event_type == "birth":
        if offspring_count is None:
            raise ValueError("Offspring count is required for birth events")
        if pregnancy_status is not None:
            raise ValueError("Pregnancy status is only valid for pregnancy events")
        if pregnancy_outcome not in (None, "birth"):
            raise ValueError("Birth events must use the birth pregnancy outcome")
    elif offspring_count is not None:
        raise ValueError("Offspring count is only valid for birth events")


def get_normalized_pregnancy_outcome(
    event_type: str,
    pregnancy_status: bool | None,
    pregnancy_outcome: str | None,
) -> str:
    if event_type == "birth":
        return "birth"
    if pregnancy_outcome is not None:
        return pregnancy_outcome
    if pregnancy_status is True:
        return "pregnant"
    if pregnancy_status is False:
        return "failed"
    return "unknown"
