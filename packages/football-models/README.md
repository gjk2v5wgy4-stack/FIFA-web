# football-models

Pure Python football prediction functions for the World Cup AI prediction MVP.

The package is designed for `apps/api` to call directly from FastAPI service code.
It does not read from databases, call HTTP services, persist predictions, meter
tokens, or touch admin approval logic.

## Public Functions

- `expected_score`: Elo expected score for one team against another.
- `update_elo`: paired Elo update for a completed match result.
- `expected_goals_from_profiles`: xG/xGA feature blend for expected goals.
- `poisson_score_distribution`: normalized scoreline distribution.
- `monte_carlo_outcomes`: deterministic seeded outcome simulation.
- `predict_match`: API-ready single-match prediction stub.
- `apply_what_if`: scenario adjustment for lineup or model-input changes.

## Integration Shape

`predict_match` accepts a `MatchPredictionInput` dataclass and returns a
`MatchPredictionResult`. The result exposes `to_api_dict()` with keys aligned to
`docs/api/api-contract.md`:

- `matchId`
- `modelVersion`
- `prediction.homeWinProbability`
- `prediction.drawProbability`
- `prediction.awayWinProbability`
- `prediction.expectedGoals`
- `prediction.scorelineProbabilities`
- `prediction.confidence`
- `prediction.riskFactors`
- `prediction.keyDrivers`
- `explanations`
- `metering.featureType`
- `metering.complexity`
- `metering.estimatedInternalTokens`

`metering` is advisory metadata for the API layer. Usage fields, token charging,
balance updates, and ledger writes belong to `apps/api`.

## Example

```python
from football_models import MatchPredictionInput, TeamRating, predict_match

result = predict_match(
    MatchPredictionInput(
        match_id="match_001",
        home=TeamRating(
            team_id="team_usa",
            name="United States",
            elo=1824,
            xg_for90=1.72,
            xg_against90=1.08,
        ),
        away=TeamRating(
            team_id="team_wal",
            name="Wales",
            elo=1762,
            xg_for90=1.24,
            xg_against90=1.31,
        ),
        include_score_distribution=True,
        random_seed=7,
    )
)

payload = result.to_api_dict()
```

## Safety

Outputs are probability estimates for data analysis. The package does not
provide betting advice, odds recommendations, or guaranteed outcomes.
