import math
import sys
import unittest
from pathlib import Path


PACKAGE_SRC = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(PACKAGE_SRC))


from football_models import (  # noqa: E402
    MatchPredictionInput,
    ScenarioAdjustment,
    TeamRating,
    apply_what_if,
    expected_score,
    expected_goals_from_profiles,
    monte_carlo_outcomes,
    poisson_score_distribution,
    predict_match,
    update_elo,
)


class EloModelTest(unittest.TestCase):
    def test_expected_score_is_symmetric_for_equal_ratings(self) -> None:
        self.assertAlmostEqual(expected_score(1800, 1800), 0.5)
        self.assertAlmostEqual(expected_score(1825, 1775) + expected_score(1775, 1825), 1.0)

    def test_update_elo_moves_winner_up_and_loser_down(self) -> None:
        new_home, new_away = update_elo(1800, 1800, actual_home_score=1.0, k_factor=20)

        self.assertEqual(new_home, 1810.0)
        self.assertEqual(new_away, 1790.0)


class ExpectedGoalsTest(unittest.TestCase):
    def test_expected_goals_blend_attack_and_opponent_defense(self) -> None:
        home, away = expected_goals_from_profiles(
            home_xg_for=1.8,
            home_xg_against=0.9,
            away_xg_for=1.2,
            away_xg_against=1.5,
            home_advantage=0.1,
        )

        self.assertAlmostEqual(home, 1.75)
        self.assertAlmostEqual(away, 1.05)


class PoissonModelTest(unittest.TestCase):
    def test_score_distribution_probabilities_sum_to_one_after_tail_normalization(self) -> None:
        distribution = poisson_score_distribution(1.4, 1.1, max_goals=8)

        self.assertAlmostEqual(sum(row.probability for row in distribution), 1.0)
        self.assertGreater(
            next(
                row.probability
                for row in distribution
                if row.home_goals == 1 and row.away_goals == 1
            ),
            0.10,
        )


class MonteCarloModelTest(unittest.TestCase):
    def test_monte_carlo_is_deterministic_with_seed(self) -> None:
        first = monte_carlo_outcomes(1.4, 1.1, iterations=5000, seed=42)
        second = monte_carlo_outcomes(1.4, 1.1, iterations=5000, seed=42)

        self.assertEqual(first, second)
        self.assertAlmostEqual(
            first.home_win_probability + first.draw_probability + first.away_win_probability,
            1.0,
        )


class PredictionInterfaceTest(unittest.TestCase):
    def test_predict_match_returns_api_ready_payload_without_usage_or_persistence(self) -> None:
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
                monte_carlo_iterations=2500,
                random_seed=7,
            )
        )

        payload = result.to_api_dict()

        self.assertEqual(payload["matchId"], "match_001")
        self.assertEqual(payload["modelVersion"], "football-models-0.1.0")
        self.assertIn("probabilities", payload)
        self.assertIn("expectedGoals", payload)
        self.assertIn("scoreDistribution", payload)
        self.assertNotIn("usage", payload)
        self.assertAlmostEqual(sum(payload["probabilities"].values()), 1.0)

    def test_what_if_reduces_home_attack_when_key_home_player_is_out(self) -> None:
        baseline = MatchPredictionInput(
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
            monte_carlo_iterations=2500,
            random_seed=7,
        )

        scenario = apply_what_if(
            baseline,
            ScenarioAdjustment(
                home_attack_delta=-0.18,
                home_defense_delta=0.04,
                note="Key forward unavailable",
            ),
        )

        self.assertLess(
            scenario.scenario.expected_goals.home,
            scenario.baseline.expected_goals.home,
        )
        self.assertLess(
            scenario.scenario.probabilities.home_win,
            scenario.baseline.probabilities.home_win,
        )
        self.assertAlmostEqual(
            scenario.delta.home_win,
            scenario.scenario.probabilities.home_win - scenario.baseline.probabilities.home_win,
        )


if __name__ == "__main__":
    unittest.main()
