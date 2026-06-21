from sqlalchemy.orm import Session

from app.models.settings import Settings
from app.schemas.settings import SettingsUpdate


SETTINGS_ID = 1


def get_or_create_settings(db: Session) -> Settings:
    settings = db.get(Settings, SETTINGS_ID)
    if settings is not None:
        return settings

    settings = Settings(id=SETTINGS_ID)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def update_settings(
    db: Session, settings: Settings, data: SettingsUpdate
) -> Settings:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings
