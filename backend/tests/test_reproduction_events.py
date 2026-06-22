from datetime import date, timedelta
from uuid import uuid4

import pytest

from app.main import app
from app.schemas.animal import AnimalCreate
from app.schemas.reproduction_event import (
    ReproductionEventCreate,
    ReproductionEventUpdate,
)
from app.services import animal as animal_service
from app.services import reproduction_event as event_service


def create_test_animal(db):
    return animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"REPRO-{uuid4().hex[:12]}")
    )


def test_reproduction_event_crud_history_and_twin_tracking(db) -> None:
    animal = create_test_animal(db)
    mating = event_service.create_reproduction_event(
        db,
        ReproductionEventCreate(
            animal_id=animal.id,
            event_type="mating",
            event_date=date.today() - timedelta(days=90),
        ),
    )
    pregnancy = event_service.create_reproduction_event(
        db,
        ReproductionEventCreate(
            animal_id=animal.id,
            event_type="pregnancy",
            event_date=date.today() - timedelta(days=60),
            pregnancy_status=True,
        ),
    )
    birth = event_service.create_reproduction_event(
        db,
        ReproductionEventCreate(
            animal_id=animal.id,
            event_type="birth",
            event_date=date.today(),
            offspring_count=2,
        ),
    )

    history = event_service.list_reproduction_events_by_animal_id(
        db, animal.id
    )
    assert [event.id for event in history[:3]] == [
        birth.id,
        pregnancy.id,
        mating.id,
    ]
    assert birth.is_twin_birth is True

    updated = event_service.update_reproduction_event(
        db, birth.id, ReproductionEventUpdate(offspring_count=1)
    )
    assert updated.offspring_count == 1
    assert updated.is_twin_birth is False

    event_service.delete_reproduction_event(db, mating.id)
    with pytest.raises(LookupError, match="Reproduction event not found"):
        event_service.get_reproduction_event(db, mating.id)


def test_reproduction_event_validation(db) -> None:
    animal = create_test_animal(db)

    with pytest.raises(ValueError, match="Pregnancy status is required"):
        event_service.create_reproduction_event(
            db,
            ReproductionEventCreate(
                animal_id=animal.id,
                event_type="pregnancy",
                event_date=date.today(),
            ),
        )

    with pytest.raises(ValueError, match="Offspring count is required"):
        event_service.create_reproduction_event(
            db,
            ReproductionEventCreate(
                animal_id=animal.id,
                event_type="birth",
                event_date=date.today(),
            ),
        )

    with pytest.raises(ValueError, match="cannot be in the future"):
        event_service.create_reproduction_event(
            db,
            ReproductionEventCreate(
                animal_id=animal.id,
                event_type="mating",
                event_date=date.today() + timedelta(days=1),
            ),
        )


def test_reproduction_event_routes_are_registered() -> None:
    registered = {
        (included_router.include_context.prefix + route.path, method)
        for included_router in app.routes
        if hasattr(included_router, "original_router")
        for route in included_router.original_router.routes
        for method in route.methods
    }
    expected = {
        ("/api/v1/reproduction-events", "POST"),
        ("/api/v1/reproduction-events", "GET"),
        ("/api/v1/animals/{animal_id}/reproduction-events", "GET"),
        ("/api/v1/reproduction-events/{event_id}", "GET"),
        ("/api/v1/reproduction-events/{event_id}", "PATCH"),
        ("/api/v1/reproduction-events/{event_id}", "DELETE"),
    }
    assert expected <= registered
