from uuid import uuid4

import pytest

from app.schemas.animal import AnimalCreate, AnimalUpdate
from app.services import animal as animal_service


def test_animal_crud_stats_validation_and_soft_delete(db) -> None:
    initial_stats = animal_service.get_animal_stats(db)
    animal_data = AnimalCreate(
        ear_tag=f"TEST-{uuid4().hex[:12]}",
        name="Test Animal",
        sex="Male",
    )

    animal = animal_service.create_animal(db, animal_data)
    stats = animal_service.get_animal_stats(db)

    assert stats.total_active == initial_stats.total_active + 1
    assert stats.male_count == initial_stats.male_count + 1

    with pytest.raises(ValueError, match="Ear tag already exists"):
        animal_service.create_animal(db, animal_data)

    updated = animal_service.update_animal(
        db, animal.id, AnimalUpdate(name="Updated Test Animal")
    )
    assert updated.name == "Updated Test Animal"

    deleted = animal_service.soft_delete_animal(db, animal.id)
    active_ids = {
        active_animal.id
        for active_animal in animal_service.list_active_animals(db)
    }
    assert deleted.is_active is False
    assert animal.id not in active_ids
    assert (
        animal_service.get_animal_stats(db).total_active
        == initial_stats.total_active
    )


@pytest.mark.parametrize("operation", ["get", "update", "delete"])
def test_animal_missing_id_raises_lookup_error(db, operation) -> None:
    missing_id = 2_000_000_000

    with pytest.raises(LookupError, match="Animal not found"):
        if operation == "get":
            animal_service.get_animal(db, missing_id)
        elif operation == "update":
            animal_service.update_animal(
                db, missing_id, AnimalUpdate(name="Missing")
            )
        else:
            animal_service.soft_delete_animal(db, missing_id)


def test_animal_update_rejects_duplicate_ear_tag(db) -> None:
    first = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"FIRST-{uuid4().hex[:12]}")
    )
    second = animal_service.create_animal(
        db, AnimalCreate(ear_tag=f"SECOND-{uuid4().hex[:12]}")
    )

    with pytest.raises(ValueError, match="Ear tag already exists"):
        animal_service.update_animal(
            db, second.id, AnimalUpdate(ear_tag=first.ear_tag)
        )
