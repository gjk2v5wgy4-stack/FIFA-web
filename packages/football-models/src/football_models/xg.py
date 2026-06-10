from football_models.constants import MAX_EXPECTED_GOALS, MIN_EXPECTED_GOALS
from football_models.types import ExpectedGoals


def _clamp_expected_goals(value: float) -> float:
    return max(MIN_EXPECTED_GOALS, min(MAX_EXPECTED_GOALS, value))


def expected_goals_from_profiles(
    *,
    home_xg_for: float,
    home_xg_against: float,
    away_xg_for: float,
    away_xg_against: float,
    home_advantage: float = 0.10,
) -> ExpectedGoals:
    """Blend team attack strength and opponent defensive allowance."""
    for metric in (home_xg_for, home_xg_against, away_xg_for, away_xg_against):
        if metric < 0:
            raise ValueError("xG inputs must be non-negative.")

    home = ((home_xg_for + away_xg_against) / 2) + home_advantage
    away = (away_xg_for + home_xg_against) / 2
    return ExpectedGoals(
        home=_clamp_expected_goals(home),
        away=_clamp_expected_goals(away),
    )
