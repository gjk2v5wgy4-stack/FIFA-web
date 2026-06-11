from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime


@dataclass(frozen=True)
class CatalogTeam:
    team_id: str
    name: str
    code: str
    confederation: str
    group: str
    elo: int
    xg_for90: float
    xg_against90: float
    path_difficulty: float
    form: tuple[str, ...]
    players: tuple[tuple[str, str, str], ...]


@dataclass(frozen=True)
class CatalogMatch:
    match_id: str
    stage: str
    group: str
    kickoff_at: datetime
    venue_id: str
    venue_name: str
    city: str
    country: str
    home_code: str
    away_code: str


def _team(
    team_id: str,
    name: str,
    code: str,
    confederation: str,
    group: str,
    elo: int,
    xg_for90: float,
    xg_against90: float,
    path_difficulty: float,
    form: tuple[str, ...],
    players: tuple[tuple[str, str, str], ...],
) -> CatalogTeam:
    return CatalogTeam(
        team_id=team_id,
        name=name,
        code=code,
        confederation=confederation,
        group=group,
        elo=elo,
        xg_for90=xg_for90,
        xg_against90=xg_against90,
        path_difficulty=path_difficulty,
        form=form,
        players=players,
    )


CATALOG_TEAMS_BY_CODE: dict[str, CatalogTeam] = {
    "MEX": _team(
        "team_mex",
        "Mexico",
        "MEX",
        "CONCACAF",
        "A",
        1798,
        1.46,
        1.1,
        0.58,
        ("W", "D", "W", "L", "D"),
        (
            ("player_mex_001", "Santiago Gimenez", "FW"),
            ("player_mex_002", "Edson Alvarez", "DM"),
            ("player_mex_003", "Luis Chavez", "CM"),
        ),
    ),
    "RSA": _team(
        "team_rsa",
        "South Africa",
        "RSA",
        "CAF",
        "A",
        1640,
        1.08,
        1.33,
        0.67,
        ("D", "W", "D", "W", "L"),
        (
            ("player_rsa_001", "Percy Tau", "FW"),
            ("player_rsa_002", "Teboho Mokoena", "CM"),
            ("player_rsa_003", "Ronwen Williams", "GK"),
        ),
    ),
    "KOR": _team(
        "team_kor",
        "South Korea",
        "KOR",
        "AFC",
        "A",
        1768,
        1.38,
        1.16,
        0.55,
        ("W", "W", "D", "W", "L"),
        (
            ("player_kor_001", "Son Heung-min", "FW"),
            ("player_kor_002", "Kim Min-jae", "CB"),
            ("player_kor_003", "Lee Kang-in", "AM"),
        ),
    ),
    "CZE": _team(
        "team_cze",
        "Czech Republic",
        "CZE",
        "UEFA",
        "A",
        1714,
        1.22,
        1.24,
        0.6,
        ("D", "L", "W", "D", "W"),
        (
            ("player_cze_001", "Patrik Schick", "FW"),
            ("player_cze_002", "Tomas Soucek", "CM"),
            ("player_cze_003", "Adam Hlozek", "FW"),
        ),
    ),
    "CAN": _team(
        "team_can",
        "Canada",
        "CAN",
        "CONCACAF",
        "B",
        1748,
        1.36,
        1.28,
        0.62,
        ("L", "W", "D", "W", "W"),
        (
            ("player_can_001", "Alphonso Davies", "LB"),
            ("player_can_002", "Jonathan David", "FW"),
            ("player_can_003", "Stephen Eustaquio", "CM"),
        ),
    ),
    "BIH": _team(
        "team_bih",
        "Bosnia & Herzegovina",
        "BIH",
        "UEFA",
        "B",
        1668,
        1.14,
        1.34,
        0.7,
        ("L", "D", "W", "L", "D"),
        (
            ("player_bih_001", "Edin Dzeko", "FW"),
            ("player_bih_002", "Rade Krunic", "CM"),
            ("player_bih_003", "Sead Kolasinac", "DF"),
        ),
    ),
    "USA": _team(
        "team_usa",
        "United States",
        "USA",
        "CONCACAF",
        "D",
        1824,
        1.72,
        1.08,
        0.5,
        ("W", "D", "W", "L", "W"),
        (
            ("player_001", "Example Player", "FW"),
            ("player_usa_002", "Christian Pulisic", "FW"),
            ("player_usa_003", "Weston McKennie", "CM"),
        ),
    ),
    "PAR": _team(
        "team_par",
        "Paraguay",
        "PAR",
        "CONMEBOL",
        "D",
        1692,
        1.16,
        1.18,
        0.64,
        ("D", "W", "L", "D", "W"),
        (
            ("player_par_001", "Miguel Almiron", "AM"),
            ("player_par_002", "Gustavo Gomez", "CB"),
            ("player_par_003", "Julio Enciso", "FW"),
        ),
    ),
    "WAL": _team(
        "team_wal",
        "Wales",
        "WAL",
        "UEFA",
        "A",
        1762,
        1.24,
        1.31,
        0.63,
        ("D", "W", "L", "D", "W"),
        (
            ("player_wal_001", "Brennan Johnson", "FW"),
            ("player_wal_002", "Harry Wilson", "AM"),
            ("player_wal_003", "Ben Davies", "DF"),
        ),
    ),
}

CATALOG_TEAMS_BY_ID = {team.team_id: team for team in CATALOG_TEAMS_BY_CODE.values()}

CATALOG_MATCHES: tuple[CatalogMatch, ...] = (
    CatalogMatch(
        "match_001",
        "group",
        "A",
        datetime(2026, 6, 12, 3, 0, tzinfo=UTC),
        "venue_mexico_city",
        "Mexico City Stadium",
        "Mexico City",
        "Mexico",
        "MEX",
        "RSA",
    ),
    CatalogMatch(
        "match_002",
        "group",
        "A",
        datetime(2026, 6, 12, 10, 0, tzinfo=UTC),
        "venue_zapopan",
        "Estadio Guadalajara",
        "Zapopan",
        "Mexico",
        "KOR",
        "CZE",
    ),
    CatalogMatch(
        "match_003",
        "group",
        "B",
        datetime(2026, 6, 13, 3, 0, tzinfo=UTC),
        "venue_toronto",
        "Toronto Stadium",
        "Toronto",
        "Canada",
        "CAN",
        "BIH",
    ),
    CatalogMatch(
        "match_004",
        "group",
        "D",
        datetime(2026, 6, 13, 9, 0, tzinfo=UTC),
        "venue_los_angeles",
        "Los Angeles Stadium",
        "Los Angeles",
        "USA",
        "USA",
        "PAR",
    ),
    CatalogMatch(
        "match_005",
        "group",
        "A",
        datetime(2026, 6, 19, 2, 0, tzinfo=UTC),
        "venue_zapopan",
        "Estadio Guadalajara",
        "Zapopan",
        "Mexico",
        "MEX",
        "KOR",
    ),
    CatalogMatch(
        "match_006",
        "group",
        "A",
        datetime(2026, 6, 18, 17, 0, tzinfo=UTC),
        "venue_atlanta",
        "Atlanta Stadium",
        "Atlanta",
        "USA",
        "CZE",
        "RSA",
    ),
)

CATALOG_MATCHES_BY_ID = {match.match_id: match for match in CATALOG_MATCHES}


def get_catalog_team(team_id_or_code: str | None) -> CatalogTeam | None:
    if team_id_or_code is None:
        return None
    normalized = team_id_or_code.upper()
    return CATALOG_TEAMS_BY_CODE.get(normalized) or CATALOG_TEAMS_BY_ID.get(team_id_or_code)


def get_catalog_match(match_id: str) -> CatalogMatch | None:
    return CATALOG_MATCHES_BY_ID.get(match_id)
