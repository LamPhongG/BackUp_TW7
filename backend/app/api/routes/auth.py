from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.auth import LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

# Checked when the email is unknown so both failure paths cost one bcrypt round; otherwise response
# time would reveal which emails have accounts.
_DUMMY_HASH = hash_password("timing-equaliser")


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    user = db.scalar(select(User).where(func.lower(User.email) == body.email.lower()))
    password_ok = verify_password(body.password, user.password_hash if user else _DUMMY_HASH)
    if user is None or not password_ok or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    token, expires_in = create_access_token(user.id, user.user_role.value)
    return TokenResponse(access_token=token, expires_in=expires_in, user=UserOut.from_user(user))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> UserOut:
    return UserOut.from_user(user)
