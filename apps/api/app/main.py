from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.errors import ApiException, api_exception_handler, validation_exception_handler
from app.core.ids import new_id
from app.db.session import configure_database
from app.errors import AppError
from app.services.factory import create_services
from app.store import InMemoryStore


def create_app() -> FastAPI:
    configure_database()
    fastapi_app = FastAPI(title="worldcup-ai-prediction API", version="0.1.0")
    compat_services = create_services(InMemoryStore.seed_default())
    fastapi_app.state.compat_services = compat_services
    fastapi_app.state.services = compat_services
    fastapi_app.state.store = compat_services.store

    @fastapi_app.middleware("http")
    async def request_id_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request.state.request_id = request.headers.get("X-Request-Id", new_id("req"))
        response = await call_next(request)
        response.headers["X-Request-Id"] = request.state.request_id
        return response

    async def handle_api_exception(request: Request, exc: Exception) -> Response:
        if not isinstance(exc, ApiException):
            raise exc
        return await api_exception_handler(request, exc)

    async def handle_validation_exception(request: Request, exc: Exception) -> Response:
        if not isinstance(exc, RequestValidationError):
            raise exc
        return await validation_exception_handler(request, exc)

    async def handle_app_error(request: Request, exc: Exception) -> JSONResponse:
        if not isinstance(exc, AppError):
            raise exc
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "requestId": getattr(request.state, "request_id", "req_unknown"),
                }
            },
        )

    fastapi_app.add_exception_handler(ApiException, handle_api_exception)
    fastapi_app.add_exception_handler(AppError, handle_app_error)
    fastapi_app.add_exception_handler(RequestValidationError, handle_validation_exception)
    fastapi_app.include_router(api_router)

    @fastapi_app.get("/health")
    def health() -> dict[str, object]:
        return {"status": "ok"}

    @fastapi_app.get("/api/health")
    def api_health() -> dict[str, object]:
        return {"data": {"status": "ok"}}

    return fastapi_app


app = create_app()
