from sqlalchemy.orm import Session

from app.models.settings import Settings
from app.repositories import settings as settings_repository
from app.schemas.settings import SettingsUpdate


def get_settings(db: Session) -> Settings:
    return settings_repository.get_or_create_settings(db)


def update_settings(db: Session, data: SettingsUpdate) -> Settings:
    settings = settings_repository.get_or_create_settings(db)
    return settings_repository.update_settings(db, settings, data)
