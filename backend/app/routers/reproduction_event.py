from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.reproduction_event import (
    ReproductionEventCreate,
    ReproductionEventResponse,
    ReproductionEventUpdate,
)
from app.services import reproduction_event as event_service


router = APIRouter(tags=["reproduction-events"])


def raise_event_error(exc: LookupError | ValueError) -> None:
    status_code = 404 if isinstance(exc, LookupError) else 400
    raise HTTPException(status_code=status_code, detail=str(exc)) from exc


@router.post(
    "/reproduction-events",
    response_model=ReproductionEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reproduction_event(
    event_data: ReproductionEventCreate,
    db: Session = Depends(get_db),
) -> ReproductionEventResponse:
    try:
        return event_service.create_reproduction_event(db, event_data)
    except (LookupError, ValueError) as exc:
        raise_event_error(exc)


@router.get(
    "/reproduction-events",
    response_model=list[ReproductionEventResponse],
)
def list_reproduction_events(
    db: Session = Depends(get_db),
) -> list[ReproductionEventResponse]:
    return event_service.list_reproduction_events(db)


@router.get(
    "/animals/{animal_id}/reproduction-events",
    response_model=list[ReproductionEventResponse],
)
def list_reproduction_events_by_animal_id(
    animal_id: int,
    db: Session = Depends(get_db),
) -> list[ReproductionEventResponse]:
    try:
        return event_service.list_reproduction_events_by_animal_id(
            db, animal_id
        )
    except LookupError as exc:
        raise_event_error(exc)


@router.get(
    "/reproduction-events/{event_id}",
    response_model=ReproductionEventResponse,
)
def get_reproduction_event(
    event_id: int,
    db: Session = Depends(get_db),
) -> ReproductionEventResponse:
    try:
        return event_service.get_reproduction_event(db, event_id)
    except LookupError as exc:
        raise_event_error(exc)


@router.patch(
    "/reproduction-events/{event_id}",
    response_model=ReproductionEventResponse,
)
def update_reproduction_event(
    event_id: int,
    event_data: ReproductionEventUpdate,
    db: Session = Depends(get_db),
) -> ReproductionEventResponse:
    try:
        return event_service.update_reproduction_event(
            db, event_id, event_data
        )
    except (LookupError, ValueError) as exc:
        raise_event_error(exc)


@router.delete(
    "/reproduction-events/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_reproduction_event(
    event_id: int,
    db: Session = Depends(get_db),
) -> None:
    try:
        event_service.delete_reproduction_event(db, event_id)
    except LookupError as exc:
        raise_event_error(exc)
