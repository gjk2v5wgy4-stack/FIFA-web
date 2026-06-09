from football_models.constants import MODEL_VERSION
from football_models.elo import expected_score
from football_models.monte_carlo import monte_carlo_outcomes
from football_models.poisson import (
    outcome_probabilities_from_distribution,
    poisson_score_distribution,
)
from football_models.types import (
    ExpectedGoals,
    MatchPredictionInput,
    MatchPredictionResult,
    MonteCarloOutcome,
    OutcomeProbabilities,
)
from football_models.xg import expected_goals_from_profiles


MATCH_PREDICTION_ESTIMATE_TOKENS = 800


def _validate_prediction_input(input_data: MatchPredictionInput) -> None:
    if not input_data.match_id:
        raise ValueError("match_id is required.")
    if input_data.home.team_id == input_data.away.team_id:
        raise ValueError("home and away teams must be different.")
    if not 0 <= input_data.elo_weight <= 1:
        raise ValueError("elo_weight must be between 0 and 1.")


def _blend_elo_with_poisson(
    poisson: OutcomeProbabilities,
    *,
    elo_home_score: float,
    elo_weight: float,
) -> OutcomeProbabilities:
    poisson = poisson.normalized()
    non_draw_mass = max(0.0, 1.0 - poisson.draw)
    if non_draw_mass == 0:
        return poisson

    poisson_home_conditional = poisson.home_win / non_draw_mass
    home_conditional = (
        (1 - elo_weight) * poisson_home_conditional
    ) + (elo_weight * elo_home_score)
    home_conditional = max(0.0, min(1.0, home_conditional))
    home_win = non_draw_mass * home_conditional
    away_win = non_draw_mass - home_win
    return OutcomeProbabilities(
        home_win=home_win,
        draw=poisson.draw,
        away_win=away_win,
    ).normalized()


def _clamped(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    return max(lower, min(upper, value))


def _prediction_confidence(
    probabilities: OutcomeProbabilities,
    monte_carlo: MonteCarloOutcome,
) -> str:
    normalized = probabilities.normalized()
    ordered = sorted(
        (normalized.home_win, normalized.draw, normalized.away_win),
        reverse=True,
    )
    probability_margin = ordered[0] - ordered[1]
    monte_carlo_gap = (
        abs(normalized.home_win - monte_carlo.home_win_probability)
        + abs(normalized.draw - monte_carlo.draw_probability)
        + abs(normalized.away_win - monte_carlo.away_win_probability)
    ) / 3
    score = _clamped(
        0.48 + probability_margin * 0.65 - monte_carlo_gap * 0.8,
        0.25,
        0.90,
    )
    if score >= 0.70:
        return "high"
    if score >= 0.50:
        return "medium"
    return "low"


def _risk_factors(
    probabilities: OutcomeProbabilities,
    expected_goals: ExpectedGoals,
) -> tuple[str, ...]:
    normalized = probabilities.normalized()
    factors: list[str] = []
    ordered = sorted(
        (normalized.home_win, normalized.draw, normalized.away_win),
        reverse=True,
    )
    if ordered[0] - ordered[1] < 0.12:
        factors.append(
            "Outcome probabilities are close, so small match events may change the result."
        )
    if normalized.draw >= 0.24:
        factors.append("Draw probability is material and raises scenario uncertainty.")
    if abs(expected_goals.home - expected_goals.away) < 0.30:
        factors.append("Expected goals are tightly matched between the teams.")
    if not factors:
        factors.append("Model estimates still depend on lineup, form, and match-day context.")
    return tuple(factors)


def _key_drivers(
    input_data: MatchPredictionInput,
    probabilities: OutcomeProbabilities,
    expected_goals: ExpectedGoals,
    monte_carlo: MonteCarloOutcome,
) -> tuple[str, ...]:
    normalized = probabilities.normalized()
    return (
        (
            f"xG profile projects {input_data.home.name} at {expected_goals.home:.2f} "
            f"and {input_data.away.name} at {expected_goals.away:.2f} expected goals."
        ),
        (
            f"Elo gap is {input_data.home.elo - input_data.away.elo:.0f} points "
            f"before blending with Poisson score probabilities."
        ),
        (
            "Monte Carlo simulation estimates "
            f"{monte_carlo.home_win_probability:.1%} home win, "
            f"{monte_carlo.draw_probability:.1%} draw, "
            f"{monte_carlo.away_win_probability:.1%} away win against "
            f"the blended probability peak of {max(normalized.home_win, normalized.draw, normalized.away_win):.1%}."
        ),
    )


def predict_match(input_data: MatchPredictionInput) -> MatchPredictionResult:
    """API-callable pure prediction stub for a single match."""
    _validate_prediction_input(input_data)

    expected_goals = expected_goals_from_profiles(
        home_xg_for=input_data.home.xg_for90,
        home_xg_against=input_data.home.xg_against90,
        away_xg_for=input_data.away.xg_for90,
        away_xg_against=input_data.away.xg_against90,
        home_advantage=input_data.home_advantage,
    )
    distribution = poisson_score_distribution(
        expected_goals.home,
        expected_goals.away,
        max_goals=input_data.max_goals,
    )
    poisson_probabilities = outcome_probabilities_from_distribution(distribution)
    probabilities = _blend_elo_with_poisson(
        poisson_probabilities,
        elo_home_score=expected_score(input_data.home.elo, input_data.away.elo),
        elo_weight=input_data.elo_weight,
    )
    monte_carlo = monte_carlo_outcomes(
        expected_goals.home,
        expected_goals.away,
        iterations=input_data.monte_carlo_iterations,
        seed=input_data.random_seed,
    )

    explanations = (
        "Probabilities combine Elo strength, xG/xGA profiles, Poisson scores, "
        "and Monte Carlo uncertainty.",
        "Outputs are model estimates for data analysis and carry uncertainty.",
    )
    return MatchPredictionResult(
        match_id=input_data.match_id,
        model_version=MODEL_VERSION,
        probabilities=probabilities,
        expected_goals=expected_goals,
        score_distribution=distribution if input_data.include_score_distribution else (),
        monte_carlo=monte_carlo,
        explanations=explanations,
        confidence=_prediction_confidence(probabilities, monte_carlo),
        risk_factors=_risk_factors(probabilities, expected_goals),
        key_drivers=_key_drivers(input_data, probabilities, expected_goals, monte_carlo),
        metering_estimate_tokens=MATCH_PREDICTION_ESTIMATE_TOKENS,
        metering_feature_type="match_full_prediction",
        metering_complexity="standard",
    )
