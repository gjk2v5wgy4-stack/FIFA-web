import math

from football_models.types import OutcomeProbabilities, ScoreProbability


def _poisson_probability(expected_goals: float, goals: int) -> float:
    if expected_goals <= 0:
        raise ValueError("expected_goals must be positive.")
    if goals < 0:
        raise ValueError("goals must be non-negative.")
    return (math.exp(-expected_goals) * expected_goals**goals) / math.factorial(goals)


def poisson_score_distribution(
    home_expected_goals: float,
    away_expected_goals: float,
    *,
    max_goals: int = 8,
) -> tuple[ScoreProbability, ...]:
    """Return normalized independent-Poisson score probabilities."""
    if max_goals < 1:
        raise ValueError("max_goals must be at least 1.")

    rows = [
        ScoreProbability(
            home_goals=home_goals,
            away_goals=away_goals,
            probability=_poisson_probability(home_expected_goals, home_goals)
            * _poisson_probability(away_expected_goals, away_goals),
        )
        for home_goals in range(max_goals + 1)
        for away_goals in range(max_goals + 1)
    ]
    total = sum(row.probability for row in rows)
    if total <= 0:
        raise ValueError("score distribution has no probability mass.")
    return tuple(
        ScoreProbability(
            home_goals=row.home_goals,
            away_goals=row.away_goals,
            probability=row.probability / total,
        )
        for row in rows
    )


def outcome_probabilities_from_distribution(
    distribution: tuple[ScoreProbability, ...],
) -> OutcomeProbabilities:
    home_win = sum(row.probability for row in distribution if row.home_goals > row.away_goals)
    draw = sum(row.probability for row in distribution if row.home_goals == row.away_goals)
    away_win = sum(row.probability for row in distribution if row.home_goals < row.away_goals)
    return OutcomeProbabilities(home_win=home_win, draw=draw, away_win=away_win).normalized()
