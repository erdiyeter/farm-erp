from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.alarm import AlarmCreate, AlarmResponse, AlarmUpdate
from app.services import alarm as alarm_service


router = APIRouter(prefix="/alarms", tags=["alarms"])


@router.get("", response_model=list[AlarmResponse])
def list_alarms(db: Session = Depends(get_db)) -> list[AlarmResponse]:
    return alarm_service.list_alarms(db)


@router.post(
    "",
    response_model=AlarmResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_alarm(
    alarm_data: AlarmCreate,
    db: Session = Depends(get_db),
) -> AlarmResponse:
    return alarm_service.create_alarm(db, alarm_data)


@router.get("/{alarm_id}", response_model=AlarmResponse)
def get_alarm(
    alarm_id: int,
    db: Session = Depends(get_db),
) -> AlarmResponse:
    try:
        return alarm_service.get_alarm(db, alarm_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.patch("/{alarm_id}", response_model=AlarmResponse)
def update_alarm(
    alarm_id: int,
    alarm_data: AlarmUpdate,
    db: Session = Depends(get_db),
) -> AlarmResponse:
    try:
        return alarm_service.update_alarm(db, alarm_id, alarm_data)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.delete("/{alarm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alarm(
    alarm_id: int,
    db: Session = Depends(get_db),
) -> None:
    try:
        alarm_service.delete_alarm(db, alarm_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
