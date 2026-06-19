from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.withdrawal_lock import (
    WithdrawalLockCreate,
    WithdrawalLockResponse,
    WithdrawalLockUpdate,
)
from app.services import withdrawal_lock as withdrawal_lock_service


router = APIRouter(prefix="/withdrawal-locks", tags=["withdrawal-locks"])


@router.get("", response_model=list[WithdrawalLockResponse])
def list_withdrawal_locks(
    db: Session = Depends(get_db),
) -> list[WithdrawalLockResponse]:
    return withdrawal_lock_service.list_withdrawal_locks(db)


@router.get("/active", response_model=list[WithdrawalLockResponse])
def list_active_withdrawal_locks(
    db: Session = Depends(get_db),
) -> list[WithdrawalLockResponse]:
    return withdrawal_lock_service.list_active_withdrawal_locks(db)


@router.post(
    "",
    response_model=WithdrawalLockResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_withdrawal_lock(
    data: WithdrawalLockCreate,
    db: Session = Depends(get_db),
) -> WithdrawalLockResponse:
    try:
        return withdrawal_lock_service.create_withdrawal_lock(db, data)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.get("/{lock_id}", response_model=WithdrawalLockResponse)
def get_withdrawal_lock(
    lock_id: int,
    db: Session = Depends(get_db),
) -> WithdrawalLockResponse:
    try:
        return withdrawal_lock_service.get_withdrawal_lock(db, lock_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc


@router.patch("/{lock_id}", response_model=WithdrawalLockResponse)
def update_withdrawal_lock(
    lock_id: int,
    data: WithdrawalLockUpdate,
    db: Session = Depends(get_db),
) -> WithdrawalLockResponse:
    try:
        return withdrawal_lock_service.update_withdrawal_lock(
            db, lock_id, data
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.delete("/{lock_id}", response_model=WithdrawalLockResponse)
def delete_withdrawal_lock(
    lock_id: int,
    db: Session = Depends(get_db),
) -> WithdrawalLockResponse:
    try:
        return withdrawal_lock_service.deactivate_withdrawal_lock(db, lock_id)
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
