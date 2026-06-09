from football_models.constants import MODEL_VERSION
from football_models.elo import expected_score
from football_models.monte_carlo import monte_carlo_outcomes
from football_models.poisson import (
    outcome_probabilities_from_distribution,
    poisson_score_distribution,
)
from football_models.types import (
    MatchPredictionInput,
    MatchPredictionResult,
    OutcomeProbabilities,
)
from football_models.xg import expected_goals_from_profiles


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
    )
