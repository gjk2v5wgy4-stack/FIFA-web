from __future__ import annotations

from app.models import ServiceBundle
from app.services.access_control import AccessControlService
from app.services.admin_user import AdminUserService
from app.services.token_quota import TokenQuotaService
from app.store import InMemoryStore


def create_services(store: InMemoryStore) -> ServiceBundle:
    access = AccessControlService(store)
    tokens = TokenQuotaService(store, access)
    access.bind_token_service(tokens)
    admin_users = AdminUserService(store, access, tokens)
    return ServiceBundle(access=access, tokens=tokens, admin_users=admin_users, store=store)
