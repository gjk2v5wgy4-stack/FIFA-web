import { beforeEach, describe, expect, it, vi } from "vitest";

const user = {
  userId: "user_approved",
  email: "approved@example.com",
  displayName: "Approved User",
  role: "user",
  status: "approved",
};

function response(data: unknown) {
  return {
    ok: true,
    json: async () => ({ data }),
  } as Response;
}

describe("apiClient backend integration mapping", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("maps backend matches into tournament schedule cards", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/api/matches")) {
          return response([
            {
              matchId: "match_001",
              stage: "group",
              group: "A",
              status: "scheduled",
              kickoffAt: "2026-06-12T20:00:00Z",
              venue: {
                venueId: "venue_001",
                name: "Mexico City Stadium",
                city: "Mexico City",
                country: "Mexico",
              },
              homeTeam: { teamId: "team_mex", name: "Mexico", code: "MEX" },
              awayTeam: { teamId: "team_rsa", name: "South Africa", code: "RSA" },
            },
          ]);
        }
        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    const { getTournamentSchedule } = await import("./apiClient");
    const matches = await getTournamentSchedule();

    expect(matches.length).toBeGreaterThan(1);
    expect(matches[0]).toMatchObject({
      matchId: "match_001",
      homeTeam: "Mexico",
      awayTeam: "South Africa",
      venue: "Mexico City Stadium",
    });
  });

  it("maps prediction and RAG sources into UI prediction fields", async () => {
    const calls: Array<{ url: string; body?: Record<string, unknown> }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options?: RequestInit) => {
        const body = options?.body ? JSON.parse(String(options.body)) : undefined;
        calls.push({ url, body });

        if (url.endsWith("/api/auth/login")) {
          return response({ accessToken: "demo-token", user });
        }

        if (url.endsWith("/api/predictions/match")) {
          return response({
            predictionId: "pred_001",
            matchId: "match_001",
            modelVersion: "football-models-0.1.0",
            prediction: {
              homeWinProbability: 0.47,
              drawProbability: 0.25,
              awayWinProbability: 0.28,
              expectedGoals: { home: 1.42, away: 1.08 },
              scorelineProbabilities: [{ score: "1-0", probability: 0.14 }],
              confidence: "medium",
              riskFactors: ["lineup uncertainty"],
              keyDrivers: ["home xG edge"],
            },
            explanations: ["model explanation"],
            metering: {
              featureType: "match_full_prediction",
              complexity: "standard",
              estimatedInternalTokens: 800,
            },
            usage: {
              tokensCharged: 800,
              remainingTokens: 99200,
              lowBalance: false,
            },
          });
        }

        if (url.endsWith("/api/rag/query")) {
          const teamId = String(body?.teamId);
          return response({
            answer: `RAG answer for ${teamId}`,
            sources: [
              {
                chunkId: `history_${teamId}`,
                documentId: `doc_${teamId}`,
                contentPreview: "Historical performance evidence with World Cup knockout record.",
                citation: {
                  title: "Team history report",
                  sourceUrl: "docs/rag/teams/sample.md",
                  publishedAt: "2026-06-10T00:00:00Z",
                },
                metadata: { teamId, tags: ["team_history"] },
              },
              {
                chunkId: `environment_${teamId}`,
                documentId: `environment_${teamId}`,
                contentPreview: "Match environment evidence covering venue, travel, weather, and rest days.",
                citation: {
                  title: "Match environment report",
                  sourceUrl: "docs/rag/teams/environment.md",
                  publishedAt: "2026-06-10T00:00:00Z",
                },
                metadata: { teamId, tags: ["match_environment"] },
              },
            ],
            retrievalDiagnostics: {
              status: "ok",
              resultCount: 2,
              filtersApplied: { teamId },
            },
          });
        }

        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    const { getMatchPrediction } = await import("./apiClient");
    const prediction = await getMatchPrediction("match_001");

    expect(prediction.probabilities.homeWin).toBe(0.47);
    expect(prediction.scoreDistribution[0]).toEqual({
      homeGoals: 1,
      awayGoals: 0,
      probability: 0.14,
    });
    expect(prediction.citations).toHaveLength(4);
    expect(prediction.analysisSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "team_history",
          sourceCount: 2,
        }),
        expect.objectContaining({
          id: "match_environment",
          sourceCount: 2,
        }),
      ]),
    );
    expect(prediction.explanations.join(" ")).toContain("RAG analysis summary");
    expect(
      calls.filter((call) => call.url.endsWith("/api/rag/query")).map((call) => call.body?.teamId),
    ).toEqual(["team_mex", "team_rsa"]);
  });
});
