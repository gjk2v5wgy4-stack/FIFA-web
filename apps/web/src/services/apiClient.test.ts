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

function errorResponse(status: number, error: unknown) {
  return {
    ok: false,
    status,
    json: async () => ({ error }),
  } as Response;
}

function installMemoryLocalStorage() {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  return storage;
}

describe("apiClient backend integration mapping", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    installMemoryLocalStorage();
  });

  it("stores the logged-in admin token and uses it for protected requests", async () => {
    const calls: Array<{ url: string; authorization?: string | null }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, options?: RequestInit) => {
        const headers = new Headers(options?.headers);
        calls.push({ url, authorization: headers.get("Authorization") });

        if (url.endsWith("/api/auth/login")) {
          return response({
            accessToken: "admin-token",
            user: {
              ...user,
              userId: "user_admin123",
              email: "admin123@local.invalid",
              displayName: "admin123",
              role: "admin",
            },
          });
        }

        if (url.endsWith("/api/account/tokens")) {
          return response({
            userId: "user_admin123",
            balanceTokens: 2_000_000_000,
            lowBalance: false,
            lowBalanceThreshold: 10_000,
            contactAdminMessage: "",
            ledger: [],
          });
        }

        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    const { getStoredAuthSession, getTokenSummary, submitLogin } = await import("./apiClient");
    const login = await submitLogin({ email: "admin123", password: "admin123" });
    const tokens = await getTokenSummary();

    expect(login.user.role).toBe("admin");
    expect(getStoredAuthSession()?.accessToken).toBe("admin-token");
    expect(tokens.balanceTokens).toBe(2_000_000_000);
    expect(calls.find((call) => call.url.endsWith("/api/account/tokens"))?.authorization).toBe(
      "Bearer admin-token",
    );
  });

  it("maps backend matches into the official 104-match schedule without duplicating fixtures", async () => {
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
            {
              matchId: "match_002",
              stage: "group",
              group: "A",
              status: "scheduled",
              kickoffAt: "2026-06-12T03:00:00Z",
              venue: {
                venueId: "venue_002",
                name: "Estadio Guadalajara",
                city: "Zapopan",
                country: "Mexico",
              },
              homeTeam: { teamId: "team_kor", name: "Korea Republic", code: "KOR" },
              awayTeam: { teamId: "team_cze", name: "Czechia", code: "CZE" },
            },
          ]);
        }
        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    const { getTournamentSchedule } = await import("./apiClient");
    const matches = await getTournamentSchedule();

    expect(matches).toHaveLength(104);
    expect(matches[0]).toMatchObject({
      matchId: "match_001",
      homeTeam: "Mexico",
      awayTeam: "South Africa",
      venue: "Mexico City Stadium",
    });
    expect(
      matches.filter((match) => match.homeTeam === "Mexico" && match.awayTeam === "South Africa"),
    ).toHaveLength(1);
    expect(
      matches.filter(
        (match) => match.homeTeam === "South Korea" && match.awayTeam === "Czech Republic",
      ),
    ).toHaveLength(1);
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

        if (url.endsWith("/api/teams/team_mex")) {
          return response({
            teamId: "team_mex",
            name: "Mexico",
            code: "MEX",
            confederation: "CONCACAF",
            group: "A",
            modelProfile: {
              elo: 1798,
              xgFor90: 1.46,
              xgAgainst90: 1.1,
              pathDifficulty: 0.58,
            },
            players: [
              {
                playerId: "player_mex_001",
                name: "Santiago Gimenez",
                position: "FW",
                availabilityStatus: "available",
              },
            ],
          });
        }

        if (url.endsWith("/api/teams/team_rsa")) {
          return response({
            teamId: "team_rsa",
            name: "South Africa",
            code: "RSA",
            confederation: "CAF",
            group: "A",
            modelProfile: {
              elo: 1640,
              xgFor90: 1.08,
              xgAgainst90: 1.33,
              pathDifficulty: 0.67,
            },
            players: [
              {
                playerId: "player_rsa_001",
                name: "Percy Tau",
                position: "FW",
                availabilityStatus: "available",
              },
            ],
          });
        }

        if (url.endsWith("/api/players/player_mex_001")) {
          return response({
            playerId: "player_mex_001",
            teamId: "team_mex",
            name: "Santiago Gimenez",
            position: "FW",
            availabilityStatus: "available",
            modelImpact: {
              availabilityImpact: 0.05,
              attackContribution: 0.08,
              defenseContribution: 0.04,
              minutesProjection: 72,
            },
          });
        }

        if (url.endsWith("/api/players/player_rsa_001")) {
          return response({
            playerId: "player_rsa_001",
            teamId: "team_rsa",
            name: "Percy Tau",
            position: "FW",
            availabilityStatus: "available",
            modelImpact: {
              availabilityImpact: 0.05,
              attackContribution: 0.08,
              defenseContribution: 0.04,
              minutesProjection: 72,
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

    const { getMatchPrediction, submitLogin } = await import("./apiClient");
    await submitLogin({ email: "approved@example.com", password: "Approved123!" });
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
    expect(prediction.analysisContext?.home.players[0]).toMatchObject({
      name: "Santiago Gimenez",
      position: "FW",
      minutesProjection: 72,
    });
    expect(prediction.analysisContext?.away.players[0]).toMatchObject({
      name: "Percy Tau",
      position: "FW",
      minutesProjection: 72,
    });
    expect(prediction.analysisContext?.environment).toMatchObject({
      city: "Mexico City",
      altitudeMeters: 2240,
      turf: "天然草",
    });
    expect(prediction.explanations.join(" ")).toContain("RAG analysis summary");
    expect(
      calls.filter((call) => call.url.endsWith("/api/rag/query")).map((call) => call.body?.teamId),
    ).toEqual(["team_mex", "team_rsa"]);
  });

  it("keeps public team and environment analysis when metered prediction is blocked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/api/auth/login")) {
          return response({ accessToken: "demo-token", user });
        }

        if (url.endsWith("/api/predictions/match")) {
          return errorResponse(402, {
            code: "INSUFFICIENT_TOKENS",
            message: "Not enough tokens for this action.",
          });
        }

        if (url.endsWith("/api/teams/team_mex")) {
          return response({
            teamId: "team_mex",
            name: "Mexico",
            code: "MEX",
            confederation: "CONCACAF",
            group: "A",
            modelProfile: {
              elo: 1798,
              xgFor90: 1.46,
              xgAgainst90: 1.1,
              pathDifficulty: 0.58,
            },
            players: [
              {
                playerId: "player_mex_001",
                name: "Santiago Gimenez",
                position: "FW",
                availabilityStatus: "available",
              },
            ],
          });
        }

        if (url.endsWith("/api/teams/team_rsa")) {
          return response({
            teamId: "team_rsa",
            name: "South Africa",
            code: "RSA",
            confederation: "CAF",
            group: "A",
            modelProfile: {
              elo: 1640,
              xgFor90: 1.08,
              xgAgainst90: 1.33,
              pathDifficulty: 0.67,
            },
            players: [
              {
                playerId: "player_rsa_001",
                name: "Percy Tau",
                position: "FW",
                availabilityStatus: "available",
              },
            ],
          });
        }

        if (url.endsWith("/api/players/player_mex_001")) {
          return response({
            playerId: "player_mex_001",
            teamId: "team_mex",
            name: "Santiago Gimenez",
            position: "FW",
            availabilityStatus: "available",
            modelImpact: {
              availabilityImpact: 0.05,
              attackContribution: 0.08,
              defenseContribution: 0.04,
              minutesProjection: 72,
            },
          });
        }

        if (url.endsWith("/api/players/player_rsa_001")) {
          return response({
            playerId: "player_rsa_001",
            teamId: "team_rsa",
            name: "Percy Tau",
            position: "FW",
            availabilityStatus: "available",
            modelImpact: {
              availabilityImpact: 0.05,
              attackContribution: 0.08,
              defenseContribution: 0.04,
              minutesProjection: 72,
            },
          });
        }

        throw new Error(`Unexpected request: ${url}`);
      }),
    );

    const { getMatchPrediction, submitLogin } = await import("./apiClient");
    await submitLogin({ email: "approved@example.com", password: "Approved123!" });
    const prediction = await getMatchPrediction("match_001", {
      matchId: "match_001",
      stage: "A组",
      kickoffAt: "2026-06-12T03:00:00+08:00",
      homeTeam: "Mexico",
      awayTeam: "South Africa",
      region: "Mexico City",
      venue: "Mexico City Stadium",
    });

    expect(prediction.analysisContext?.home.players[0]?.name).toBe("Santiago Gimenez");
    expect(prediction.analysisContext?.away.players[0]?.name).toBe("Percy Tau");
    expect(prediction.analysisContext?.environment.altitudeMeters).toBe(2240);
    expect(prediction.analysisContext?.environment.teams.away.travelDistanceKm).toBe(14600);
  });
});
