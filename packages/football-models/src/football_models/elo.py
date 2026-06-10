def expected_score(rating_a: float, rating_b: float) -> float:
    """Return Elo expected score for team A against team B."""
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))


def update_elo(
    home_rating: float,
    away_rating: float,
    *,
    actual_home_score: float,
    k_factor: float = 20,
) -> tuple[float, float]:
    """Update paired Elo ratings from a home-team result.

    `actual_home_score` is 1.0 for home win, 0.5 for draw, and 0.0 for away win.
    """
    if actual_home_score not in {0.0, 0.5, 1.0}:
        raise ValueError("actual_home_score must be 0.0, 0.5, or 1.0.")
    if k_factor <= 0:
        raise ValueError("k_factor must be positive.")

    expected_home = expected_score(home_rating, away_rating)
    home_delta = k_factor * (actual_home_score - expected_home)
    return home_rating + home_delta, away_rating - home_delta
