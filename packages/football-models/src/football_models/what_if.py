from dataclasses import replace

from football_models.prediction import predict_match
from football_models.types import (
    MatchPredictionInput,
    ProbabilityDelta,
    ScenarioAdjustment,
    TeamRating,
    WhatIfResult,
)


def _adjust_team(
    team: TeamRating,
    *,
    attack_delta: float,
    defense_delta: float,
    elo_delta: float,
) -> TeamRating:
    return replace(
        team,
        elo=team.elo + elo_delta,
        xg_for90=max(0.0, team.xg_for90 + attack_delta),
        xg_against90=max(0.0, team.xg_against90 + defense_delta),
    )


def apply_what_if(
    baseline_input: MatchPredictionInput,
    adjustment: ScenarioAdjustment,
) -> WhatIfResult:
    """Apply scenario deltas and return baseline, scenario, and probability delta."""
    baseline = predict_match(baseline_input)
    scenario_input = replace(
        baseline_input,
        home=_adjust_team(
            baseline_input.home,
            attack_delta=adjustment.home_attack_delta,
            defense_delta=adjustment.home_defense_delta,
            elo_delta=adjustment.home_elo_delta,
        ),
        away=_adjust_team(
            baseline_input.away,
            attack_delta=adjustment.away_attack_delta,
            defense_delta=adjustment.away_defense_delta,
            elo_delta=adjustment.away_elo_delta,
        ),
    )
    scenario = predict_match(scenario_input)
    delta = ProbabilityDelta(
        home_win=scenario.probabilities.home_win - baseline.probabilities.home_win,
        draw=scenario.probabilities.draw - baseline.probabilities.draw,
        away_win=scenario.probabilities.away_win - baseline.probabilities.away_win,
    )
    return WhatIfResult(
        baseline=baseline,
        scenario=scenario,
        delta=delta,
        note=adjustment.note,
    )
