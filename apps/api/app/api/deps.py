from typing import Annotated

from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from app.core.errors import ApiException
from app.core.security import parse_access_token
from app.db.session import get_db
from app.models import User
from app.models.access_contracts import UserRecord

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    request: Request,
    session: DbSession,
    authorization: Annotated[str | None, Header()] = None,
    x_user_id: Annotated[str | None, Header(alias="x-user-id")] = None,
) -> User | UserRecord:
    if x_user_id is not None:
        return request.app.state.compat_services.store.get_user(x_user_id)
    if authorization is None or not authorization.startswith("Bearer "):
        raise ApiException("UNAUTHORIZED", "Authentication required.", 401)
    user_id = parse_access_token(authorization.removeprefix("Bearer ").strip())
    if user_id is None:
        raise ApiException("UNAUTHORIZED", "Invalid access token.", 401)
    user = session.get(User, user_id)
    if user is None:
        raise ApiException("UNAUTHORIZED", "Invalid access token.", 401)
    return user


CurrentUser = Annotated[User | UserRecord, Depends(get_current_user)]


def require_admin(request: Request, user: CurrentUser) -> User | UserRecord:
    if isinstance(user, UserRecord):
        return request.app.state.compat_services.access.requireAdmin(user)
    if user.role != "admin":
        raise ApiException("FORBIDDEN", "Admin role required.", 403)
    return user


AdminUser = Annotated[User | UserRecord, Depends(require_admin)]

