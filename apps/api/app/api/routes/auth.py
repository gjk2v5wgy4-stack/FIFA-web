from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.serializers import user_contract
from app.core.errors import ApiException
from app.core.ids import new_id
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.requests import LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(payload: RegisterRequest, session: DbSession) -> dict[str, object]:
    existing = session.scalar(select(User).where(User.email == payload.email.lower()))
    if existing is not None:
        raise ApiException("VALIDATION_ERROR", "Email is already registered.", 409)
    user = User(
        id=new_id("user"),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
        role="user",
        status="pending_approval",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    data = user_contract(user)
    data.pop("role", None)
    return {"data": data}


@router.post("/login")
def login(payload: LoginRequest, session: DbSession) -> dict[str, object]:
    user = session.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise ApiException("UNAUTHORIZED", "Invalid email or password.", 401)
    return {
        "data": {
            "accessToken": create_access_token(user.id),
            "user": user_contract(user),
        }
    }


@router.get("/me")
def me(user: CurrentUser) -> dict[str, object]:
    return {"data": user_contract(user)}

