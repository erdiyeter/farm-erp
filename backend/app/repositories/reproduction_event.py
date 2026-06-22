from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.reproduction_event import ReproductionEvent
from app.schemas.reproduction_event import (
    ReproductionEventCreate,
    ReproductionEventUpdate,
)


def get_reproduction_events(db: Session) -> list[ReproductionEvent]:
    statement = select(ReproductionEvent).order_by(
        ReproductionEvent.event_date.desc(), ReproductionEvent.id.desc()
    )
    return list(db.scalars(statement).all())


def get_reproduction_events_by_animal_id(
    db: Session, animal_id: int
) -> list[ReproductionEvent]:
    statement = (
        select(ReproductionEvent)
        .where(ReproductionEvent.animal_id == animal_id)
        .order_by(
            ReproductionEvent.event_date.desc(), ReproductionEvent.id.desc()
        )
    )
    return list(db.scalars(statement).all())


def get_reproduction_event_by_id(
    db: Session, event_id: int
) -> ReproductionEvent | None:
    return db.get(ReproductionEvent, event_id)


def create_reproduction_event(
    db: Session, event_data: ReproductionEventCreate
) -> ReproductionEvent:
    event = ReproductionEvent(**event_data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_reproduction_event(
    db: Session,
    event: ReproductionEvent,
    event_data: ReproductionEventUpdate,
) -> ReproductionEvent:
    for field, value in event_data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    event.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(event)
    return event


def delete_reproduction_event(
    db: Session, event: ReproductionEvent
) -> None:
    db.delete(event)
    db.commit()
