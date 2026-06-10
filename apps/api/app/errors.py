from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AppError(Exception):
    code: str
    message: str
    status_code: int = 400
    details: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        super().__init__(self.message)


def unauthorized(message: str = "Authentication is required.") -> AppError:
    return AppError(code="UNAUTHORIZED", message=message, status_code=401)


def forbidden(message: str = "Admin access is required.") -> AppError:
    return AppError(code="FORBIDDEN", message=message, status_code=403)


def not_found(message: str = "Resource not found.") -> AppError:
    return AppError(code="NOT_FOUND", message=message, status_code=404)


def validation_error(message: str, details: dict[str, Any] | None = None) -> AppError:
    return AppError(
        code="VALIDATION_ERROR",
        message=message,
        status_code=422,
        details=details or {},
    )


def insufficient_tokens(
    required_tokens: int,
    available_tokens: int,
    *,
    include_contact_admin: bool = False,
) -> AppError:
    details: dict[str, object] = {
        "requiredTokens": required_tokens,
        "availableTokens": available_tokens,
    }
    if include_contact_admin:
        details["contactAdminMessage"] = "Token balance is low. Please contact the admin."
    return AppError(
        code="INSUFFICIENT_TOKENS",
        message="Not enough tokens for this action. Please contact the admin.",
        status_code=402,
        details=details,
    )
