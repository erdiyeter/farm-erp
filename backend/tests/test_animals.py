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
