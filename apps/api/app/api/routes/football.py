from fastapi import APIRouter

from app.api.deps import DbSession
from app.services.football import football_data_service

router = APIRouter(tags=["football"])


@router.get("/matches")
def list_matches(session: DbSession) -> dict[str, object]:
    return {
        "data": football_data_service.list_matches(session),
        "pagination": {"nextCursor": None, "hasMore": False},
    }


@router.get("/matches/{match_id}")
def get_match(match_id: str, session: DbSession) -> dict[str, object]:
    return {"data": football_data_service.get_match(session, match_id)}


@router.get("/teams/{team_id}")
def get_team(team_id: str, session: DbSession) -> dict[str, object]:
    return {"data": football_data_service.get_team(session, team_id)}


@router.get("/players/{player_id}")
def get_player(player_id: str, session: DbSession) -> dict[str, object]:
    return {"data": football_data_service.get_player(session, player_id)}

