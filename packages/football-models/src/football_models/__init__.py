"""Pure football prediction functions for FastAPI integration."""

from football_models.elo import expected_score, update_elo
from football_models.monte_carlo import monte_carlo_outcomes
from football_models.poisson import poisson_score_distribution
from football_models.prediction import predict_match
from football_models.types import (
    ExpectedGoals,
    MatchPredictionInput,
    MatchPredictionResult,
    MonteCarloOutcome,
    OutcomeProbabilities,
    ScenarioAdjustment,
    ScoreProbability,
    TeamRating,
    WhatIfResult,
)
from football_models.what_if import apply_what_if
from football_models.xg import expected_goals_from_profiles

__all__ = [
    "ExpectedGoals",
    "MatchPredictionInput",
    "MatchPredictionResult",
    "MonteCarloOutcome",
    "OutcomeProbabilities",
    "ScenarioAdjustment",
    "ScoreProbability",
    "TeamRating",
    "WhatIfResult",
    "apply_what_if",
    "expected_goals_from_profiles",
    "expected_score",
    "monte_carlo_outcomes",
    "poisson_score_distribution",
    "predict_match",
    "update_elo",
]
