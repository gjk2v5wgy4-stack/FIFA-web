from app.core.errors import ApiException
from app.models import User


class AccessControlService:
    def can_use_protected_apis(self, user: User) -> bool:
        return user.status == "approved"

    def account_message(self, user: User) -> str:
        messages = {
            "pending_approval": "Account is pending admin approval.",
            "approved": "Account approved.",
            "rejected": "Account access was rejected.",
            "suspended": "Account access is suspended.",
        }
        return messages.get(user.status, "Account status is unknown.")

    def ensure_metered_access(self, user: User) -> None:
        if user.status == "approved":
            return
        if user.status == "pending_approval":
            raise ApiException(
                "ACCOUNT_PENDING_APPROVAL",
                "Account is pending admin approval.",
                403,
            )
        if user.status == "rejected":
            raise ApiException("ACCOUNT_REJECTED", "Account was rejected.", 403)
        if user.status == "suspended":
            raise ApiException("ACCOUNT_SUSPENDED", "Account is suspended.", 403)
        raise ApiException("FORBIDDEN", "Account cannot use this API.", 403)


access_control_service = AccessControlService()

