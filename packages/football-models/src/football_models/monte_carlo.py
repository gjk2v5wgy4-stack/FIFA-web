import math
import random

from football_models.types import MonteCarloOutcome


def _sample_poisson(expected_goals: float, rng: random.Random) -> int:
    if expected_goals <= 0:
        raise ValueError("expected_goals must be positive.")

    threshold = math.exp(-expected_goals)
    goals = 0
    product = 1.0
    while product > threshold:
        goals += 1
        product *= rng.random()
    return goals - 1


def monte_carlo_outcomes(
    home_expected_goals: float,
    away_expected_goals: float,
    *,
    iterations: int = 10_000,
    seed: int = 0,
) -> MonteCarloOutcome:
    """Simulate match outcomes from Poisson goal rates using local RNG state."""
    if iterations <= 0:
        raise ValueError("iterations must be positive.")

    rng = random.Random(seed)
    home_wins = 0
    draws = 0
    away_wins = 0
    total_home_goals = 0
    total_away_goals = 0

    for _ in range(iterations):
        home_goals = _sample_poisson(home_expected_goals, rng)
        away_goals = _sample_poisson(away_expected_goals, rng)
        total_home_goals += home_goals
        total_away_goals += away_goals

        if home_goals > away_goals:
            home_wins += 1
        elif home_goals == away_goals:
            draws += 1
        else:
            away_wins += 1

    return MonteCarloOutcome(
        home_win_probability=home_wins / iterations,
        draw_probability=draws / iterations,
        away_win_probability=away_wins / iterations,
        average_home_goals=total_home_goals / iterations,
        average_away_goals=total_away_goals / iterations,
    )
