from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.core.errors import ApiException
from app.core.security import parse_access_token
from app.db.session import get_db
from app.models import User

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    session: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    if authorization is None or not authorization.startswith("Bearer "):
        raise ApiException("UNAUTHORIZED", "Authentication required.", 401)
    user_id = parse_access_token(authorization.removeprefix("Bearer ").strip())
    if user_id is None:
        raise ApiException("UNAUTHORIZED", "Invalid access token.", 401)
    user = session.get(User, user_id)
    if user is None:
        raise ApiException("UNAUTHORIZED", "Invalid access token.", 401)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    if user.role != "admin":
        raise ApiException("FORBIDDEN", "Admin role required.", 403)
    return user


AdminUser = Annotated[User, Depends(require_admin)]

