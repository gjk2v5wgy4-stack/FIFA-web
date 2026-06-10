from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.schemas.rag import RagQueryRequest
from app.services.access_control import access_control_service
from app.services.rag_service import rag_query_service

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/query")
def query_rag(payload: RagQueryRequest, user: CurrentUser) -> dict[str, object]:
    access_control_service.ensure_metered_access(user)
    return {"data": rag_query_service.query(payload)}


@router.post("/ask")
def ask_rag(payload: RagQueryRequest, user: CurrentUser) -> dict[str, object]:
    access_control_service.ensure_metered_access(user)
    return {"data": rag_query_service.query(payload)}

