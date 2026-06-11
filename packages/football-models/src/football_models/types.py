from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterator

from football_models.constants import MODEL_VERSION


def _rounded(value: float, digits: int = 4) -> float:
    return round(value, digits)


@dataclass(frozen=True)
class TeamRating:
    team_id: str
    name: str
    elo: float
    xg_for90: float
    xg_against90: float


@dataclass(frozen=True)
class ExpectedGoals:
    home: float
    away: float

    def __iter__(self) -> Iterator[float]:
        yield self.home
        yield self.away

    def to_api_dict(self) -> dict[str, float]:
        return {"home": _rounded(self.home), "away": _rounded(self.away)}


@dataclass(frozen=True)
class OutcomeProbabilities:
    home_win: float
    draw: float
    away_win: float

    def normalized(self) -> OutcomeProbabilities:
        total = self.home_win + self.draw + self.away_win
        if total <= 0:
            raise ValueError("Outcome probabilities must have positive mass.")
        return OutcomeProbabilities(
            home_win=self.home_win / total,
            draw=self.draw / total,
            away_win=self.away_win / total,
        )

    def to_api_dict(self) -> dict[str, float]:
        normalized = self.normalized()
        home = _rounded(normalized.home_win)
        draw = _rounded(normalized.draw)
        away = _rounded(1.0 - home - draw)
        return {
            "homeWin": home,
            "draw": draw,
            "awayWin": away,
        }


@dataclass(frozen=True)
class ScoreProbability:
    home_goals: int
    away_goals: int
    probability: float

    def to_api_dict(self) -> dict[str, float | int]:
        return {
            "homeGoals": self.home_goals,
            "awayGoals": self.away_goals,
            "probability": _rounded(self.probability),
        }

    def to_scoreline_api_dict(self) -> dict[str, float | str]:
        return {
            "score": f"{self.home_goals}-{self.away_goals}",
            "probability": _rounded(self.probability),
        }


@dataclass(frozen=True)
class MonteCarloOutcome:
    home_win_probability: float
    draw_probability: float
    away_win_probability: float
    average_home_goals: float
    average_away_goals: float


@dataclass(frozen=True)
class MatchPredictionInput:
    match_id: str
    home: TeamRating
    away: TeamRating
    include_score_distribution: bool = False
    home_advantage: float = 0.10
    max_goals: int = 8
    monte_carlo_iterations: int = 10_000
    random_seed: int = 0
    elo_weight: float = 0.20


@dataclass(frozen=True)
class MatchPredictionResult:
    match_id: str
    model_version: str
    probabilities: OutcomeProbabilities
    expected_goals: ExpectedGoals
    score_distribution: tuple[ScoreProbability, ...]
    monte_carlo: MonteCarloOutcome
    explanations: tuple[str, ...]
    confidence: str
    risk_factors: tuple[str, ...]
    key_drivers: tuple[str, ...]
    metering_estimate_tokens: int
    metering_feature_type: str
    metering_complexity: str

    def to_api_dict(self) -> dict[str, Any]:
        probabilities = self.probabilities.to_api_dict()
        payload: dict[str, Any] = {
            "matchId": self.match_id,
            "modelVersion": self.model_version or MODEL_VERSION,
            "explanations": list(self.explanations),
            "prediction": {
                "homeWinProbability": probabilities["homeWin"],
                "drawProbability": probabilities["draw"],
                "awayWinProbability": probabilities["awayWin"],
                "expectedGoals": self.expected_goals.to_api_dict(),
                "scorelineProbabilities": [
                    score.to_scoreline_api_dict() for score in self.score_distribution
                ],
                "confidence": self.confidence,
                "riskFactors": list(self.risk_factors),
                "keyDrivers": list(self.key_drivers),
            },
            "metering": {
                "featureType": self.metering_feature_type,
                "complexity": self.metering_complexity,
                "estimatedInternalTokens": self.metering_estimate_tokens,
            },
        }
        return payload


@dataclass(frozen=True)
class ScenarioAdjustment:
    home_attack_delta: float = 0.0
    home_defense_delta: float = 0.0
    away_attack_delta: float = 0.0
    away_defense_delta: float = 0.0
    home_elo_delta: float = 0.0
    away_elo_delta: float = 0.0
    note: str | None = None


@dataclass(frozen=True)
class ProbabilityDelta:
    home_win: float
    draw: float
    away_win: float

    def to_api_dict(self) -> dict[str, float]:
        return {
            "homeWin": _rounded(self.home_win),
            "draw": _rounded(self.draw),
            "awayWin": _rounded(self.away_win),
        }


@dataclass(frozen=True)
class WhatIfResult:
    baseline: MatchPredictionResult
    scenario: MatchPredictionResult
    delta: ProbabilityDelta
    note: str | None = None

    def to_api_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "modelVersion": self.scenario.model_version,
            "matchId": self.scenario.match_id,
            "baseline": self.baseline.probabilities.to_api_dict(),
            "adjusted": self.scenario.probabilities.to_api_dict(),
            "delta": self.delta.to_api_dict(),
            "metering": {
                "featureType": "what_if_simulation",
                "complexity": "standard",
                "estimatedInternalTokens": 1000,
            },
        }
        if self.note:
            payload["note"] = self.note
        return payload
