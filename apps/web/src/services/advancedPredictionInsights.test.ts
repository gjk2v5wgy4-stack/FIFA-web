import { describe, expect, it } from "vitest";
import type { MatchPredictionStub } from "./apiStubs";
import { createAdvancedPredictionInsights } from "./advancedPredictionInsights";

const prediction: MatchPredictionStub = {
  predictionId: "pred_test",
  matchId: "match_test_001",
  modelVersion: "football-models-0.1.0",
  kickoffAt: "2026-06-12T20:00:00Z",
  venue: "Test Stadium",
  homeTeam: {
    teamId: "team_home",
    name: "Home Team",
    code: "HOM",
    form: ["W", "D", "W", "L", "W"],
  },
  awayTeam: {
    teamId: "team_away",
    name: "Away Team",
    code: "AWY",
    form: ["D", "W", "L", "D", "W"],
  },
  probabilities: {
    homeWin: 0.44,
    draw: 0.29,
    awayWin: 0.27,
  },
  expectedGoals: {
    home: 1.38,
    away: 1.12,
  },
  scoreDistribution: [
    { homeGoals: 0, awayGoals: 0, probability: 0.08 },
    { homeGoals: 1, awayGoals: 1, probability: 0.12 },
    { homeGoals: 2, awayGoals: 1, probability: 0.11 },
    { homeGoals: 1, awayGoals: 0, probability: 0.1 },
  ],
  explanations: ["probability explanation"],
  citations: [
    {
      documentId: "doc_001",
      chunkId: "chunk_001",
      sourceName: "Team report",
      sourceUrl: "https://source.example.com/team",
      publishedAt: "2026-06-01T00:00:00Z",
    },
    {
      documentId: "doc_002",
      chunkId: "chunk_002",
      sourceName: "Injury report",
      sourceUrl: "https://source.example.com/injury",
      publishedAt: "2026-06-02T00:00:00Z",
    },
  ],
  usage: {
    tokensCharged: 800,
    remainingTokens: 76000,
    lowBalance: false,
  },
};

describe("advanced prediction insights", () => {
  it("creates paid-depth insight groups for the match detail page", () => {
    const insights = createAdvancedPredictionInsights(prediction);

    expect(insights.scoreReferences).toHaveLength(3);
    expect(insights.scoreReferences[0].score).toBe("1 - 1");
    expect(insights.lineupInsights).toHaveLength(2);
    expect(insights.lineupInsights[0].sideLabel).toBe("主队");
    expect(insights.headToHead.totalMatches).toBe(5);
    expect(insights.keyMatchups).toHaveLength(3);
    expect(insights.tacticalLevers).toHaveLength(3);
    expect(insights.fatigueRecovery).toHaveLength(3);
    expect(insights.modelDisagreement.views).toHaveLength(4);
    expect(insights.preMatchUpdates).toHaveLength(4);
  });
});
