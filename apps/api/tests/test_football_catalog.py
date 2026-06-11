from fastapi.testclient import TestClient


def test_match_catalog_includes_opening_group_fixtures(client: TestClient) -> None:
    response = client.get("/api/matches")

    assert response.status_code == 200, response.text
    matches = response.json()["data"]
    by_id = {match["matchId"]: match for match in matches}

    assert by_id["match_001"]["homeTeam"]["code"] == "MEX"
    assert by_id["match_001"]["awayTeam"]["code"] == "RSA"
    assert by_id["match_002"]["homeTeam"]["code"] == "KOR"
    assert by_id["match_002"]["awayTeam"]["code"] == "CZE"
    assert len(matches) >= 6


def test_team_catalog_returns_structured_korea_profile(client: TestClient) -> None:
    response = client.get("/api/teams/team_kor")

    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["teamId"] == "team_kor"
    assert data["code"] == "KOR"
    assert data["modelProfile"]["elo"] > 0
    assert data["players"]
