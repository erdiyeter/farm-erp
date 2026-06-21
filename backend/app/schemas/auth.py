from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    is_active: bool
    created_at: datetime | None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
