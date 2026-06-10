import base64
import hashlib
import hmac
import json
import secrets
from typing import Any

from app.core.config import get_settings


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"pbkdf2_sha256${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, salt, expected = password_hash.split("$", 2)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return hmac.compare_digest(digest.hex(), expected)


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(raw + padding)


def create_access_token(user_id: str) -> str:
    payload = {"sub": user_id}
    payload_raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    payload_part = _b64encode(payload_raw)
    signature = hmac.new(
        get_settings().secret_key.encode(),
        payload_part.encode(),
        hashlib.sha256,
    ).digest()
    return f"{payload_part}.{_b64encode(signature)}"


def parse_access_token(token: str) -> str | None:
    try:
        payload_part, signature_part = token.split(".", 1)
    except ValueError:
        return None
    expected = hmac.new(
        get_settings().secret_key.encode(),
        payload_part.encode(),
        hashlib.sha256,
    ).digest()
    try:
        supplied = _b64decode(signature_part)
        payload: dict[str, Any] = json.loads(_b64decode(payload_part))
    except (ValueError, json.JSONDecodeError):
        return None
    if not hmac.compare_digest(expected, supplied):
        return None
    subject = payload.get("sub")
    return subject if isinstance(subject, str) else None

