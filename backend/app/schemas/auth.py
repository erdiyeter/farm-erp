from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


UserRole = Literal["admin", "worker", "veterinarian"]


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime | None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
