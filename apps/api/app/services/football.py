from sqlalchemy.orm import Session

from app.core.errors import ApiException
from app.models import Match, Player, Team, Venue


class FootballDataService:
    def list_matches(self, session: Session) -> list[dict[str, object]]:
        matches = session.query(Match).all()
        return [self.match_summary(session, match) for match in matches]

    def match_summary(self, session: Session, match: Match) -> dict[str, object]:
        home = session.get(Team, match.home_team_id)
        away = session.get(Team, match.away_team_id)
        venue = session.get(Venue, match.venue_id)
        if home is None or away is None or venue is None:
            raise ApiException("INTERNAL_ERROR", "Seed match data is incomplete.", 500)
        return {
            "matchId": match.id,
            "stage": match.stage,
            "group": match.group_code,
            "status": match.status,
            "kickoffAt": match.kickoff_at.isoformat().replace("+00:00", "Z"),
            "venue": {
                "venueId": venue.id,
                "name": venue.name,
                "city": venue.city,
                "country": venue.country,
            },
            "homeTeam": {"teamId": home.id, "name": home.name, "code": home.code},
            "awayTeam": {"teamId": away.id, "name": away.name, "code": away.code},
            "latestPrediction": {
                "predictionId": "pred_seed_001",
                "homeWinProbability": 0.43,
                "drawProbability": 0.28,
                "awayWinProbability": 0.29,
            },
        }

    def get_match(self, session: Session, match_id: str) -> dict[str, object]:
        match = session.get(Match, match_id)
        if match is None:
            raise ApiException("NOT_FOUND", "Match not found.", 404)
        home = session.get(Team, match.home_team_id)
        away = session.get(Team, match.away_team_id)
        if home is None or away is None:
            raise ApiException("INTERNAL_ERROR", "Seed team data is incomplete.", 500)
        return {
            "matchId": match.id,
            "stage": match.stage,
            "group": match.group_code,
            "status": match.status,
            "kickoffAt": match.kickoff_at.isoformat().replace("+00:00", "Z"),
            "homeTeam": {
                "teamId": home.id,
                "name": home.name,
                "elo": 1824,
                "recentForm": ["W", "D", "W", "L", "W"],
            },
            "awayTeam": {
                "teamId": away.id,
                "name": away.name,
                "elo": 1762,
                "recentForm": ["D", "W", "L", "D", "W"],
            },
            "availability": {"injuries": [], "suspensions": []},
            "marketContext": {
                "enabled": True,
                "note": "Market data is context only, not a recommendation.",
            },
        }

    def get_team(self, session: Session, team_id: str) -> dict[str, object]:
        team = session.get(Team, team_id)
        if team is None:
            raise ApiException("NOT_FOUND", "Team not found.", 404)
        players = session.query(Player).filter(Player.team_id == team.id).all()
        return {
            "teamId": team.id,
            "name": team.name,
            "code": team.code,
            "confederation": team.confederation,
            "group": team.group_code,
            "modelProfile": {
                "elo": 1824,
                "xgFor90": 1.72,
                "xgAgainst90": 1.08,
                "pathDifficulty": 0.61,
            },
            "players": [
                {
                    "playerId": player.id,
                    "name": player.name,
                    "position": player.position,
                    "availabilityStatus": player.availability_status,
                }
                for player in players
            ],
        }

    def get_player(self, session: Session, player_id: str) -> dict[str, object]:
        player = session.get(Player, player_id)
        if player is None:
            raise ApiException("NOT_FOUND", "Player not found.", 404)
        return {
            "playerId": player.id,
            "teamId": player.team_id,
            "name": player.name,
            "position": player.position,
            "availabilityStatus": player.availability_status,
            "modelImpact": {
                "availabilityImpact": 0.08,
                "attackContribution": 0.12,
                "defenseContribution": 0.02,
                "minutesProjection": 74,
            },
        }


football_data_service = FootballDataService()

