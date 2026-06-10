from fastapi import APIRouter

from app.api.routes import account, admin, auth, football, metered, rag, weather

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(account.router)
api_router.include_router(admin.router)
api_router.include_router(football.router)
api_router.include_router(rag.router)
api_router.include_router(metered.router)
api_router.include_router(weather.router)
