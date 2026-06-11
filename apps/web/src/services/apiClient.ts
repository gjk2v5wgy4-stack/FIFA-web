import {
  getAccountStatus as getStubAccountStatus,
  getAdminUsers as getStubAdminUsers,
  getMatchPrediction as getStubMatchPrediction,
  getTokenSummary as getStubTokenSummary,
  submitLogin as submitStubLogin,
  submitRegistration as submitStubRegistration,
  type AccountStatusSummary,
  type AdminUserStub,
  type AuthUser,
  type LoginInput,
  type MatchPredictionStub,
  type PredictionCitation,
  type RegistrationInput,
  type ScoreBucket,
  type TokenSummary,
} from "./apiStubs";
import {
  createPredictionFromSchedule,
  getTournamentSchedule as getStubTournamentSchedule,
  type TournamentMatchStub,
} from "./worldCupSchedule";

const apiBaseUrl = "";

let demoTokenPromise: Promise<string | null> | null = null;
let adminTokenPromise: Promise<string | null> | null = null;

interface ApiEnvelope<T> {
  data: T;
}

interface ApiLoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface ApiMatchSummary {
  matchId: string;
  stage: string;
  group?: string | null;
  status: string;
  kickoffAt: string;
  venue: {
    venueId?: string;
    name: string;
    city?: string;
    country?: string;
  };
  homeTeam: {
    teamId: string;
    name: string;
    code: string;
  };
  awayTeam: {
    teamId: string;
    name: string;
    code: string;
  };
}

interface ApiMatchPredictionResponse {
  predictionId: string;
  matchId: string;
  modelVersion: string;
  prediction: {
    homeWinProbability: number;
    drawProbability: number;
    awayWinProbability: number;
    expectedGoals: {
      home: number;
      away: number;
    };
    scorelineProbabilities: Array<{
      score: string;
      probability: number;
    }>;
    confidence: "low" | "medium" | "high";
    riskFactors: string[];
    keyDrivers: string[];
  };
  explanations: string[];
  metering?: {
    featureType: string;
    complexity: string;
    estimatedInternalTokens: number;
  };
  usage: {
    tokensCharged: number;
    remainingTokens: number;
    lowBalance: boolean;
    lowTokenWarning?: boolean;
  };
}

interface RagSource {
  chunkId?: string;
  documentId?: string;
  contentPreview?: string;
  metadata?: Record<string, unknown>;
  citation?: {
    title?: string;
    sourceUrl?: string;
    publishedAt?: string;
    language?: string;
  };
}

export interface RagEvidenceSummary {
  answer: string | null;
  sources: RagSource[];
  retrievalDiagnostics: {
    status?: string;
    resultCount?: number;
    filtersApplied?: Record<string, unknown>;
    fallbackFromFilters?: Record<string, unknown>;
  };
}

export interface TeamDetail {
  teamId: string;
  name: string;
  code: string;
  confederation: string;
  group?: string | null;
  modelProfile?: {
    elo?: number;
    xgFor90?: number;
    xgAgainst90?: number;
    pathDifficulty?: number;
  };
  players: Array<{
    playerId: string;
    name: string;
    position: string;
    availabilityStatus: string;
  }>;
  rag: RagEvidenceSummary;
}

export interface PlayerDetail {
  playerId: string;
  teamId: string;
  name: string;
  position: string;
  availabilityStatus: string;
  modelImpact?: {
    availabilityImpact?: number;
    attackContribution?: number;
    defenseContribution?: number;
    minutesProjection?: number;
  };
  rag: RagEvidenceSummary;
}

export interface GroupSimulationSummary {
  simulationId: string;
  group: string;
  modelVersion: string;
  iterations: number;
  table: Array<{
    teamId: string;
    projectedPoints: number;
    qualifyProbability: number;
    groupWinnerProbability: number;
  }>;
  usage?: {
    tokensCharged: number;
    remainingTokens: number;
    lowBalance: boolean;
  };
}

export interface WhatIfSummary {
  scenarioId: string;
  baseline: Record<string, number>;
  adjusted: Record<string, number>;
  delta: Record<string, number>;
  usage?: {
    tokensCharged: number;
    remainingTokens: number;
    lowBalance: boolean;
  };
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

async function publicRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return parseEnvelope<T>(response);
}

async function login(email: string, password: string): Promise<ApiLoginResponse | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      return null;
    }
    return await parseEnvelope<ApiLoginResponse>(response);
  } catch {
    return null;
  }
}

function getDemoToken(): Promise<string | null> {
  demoTokenPromise ??= login("approved@example.com", "Approved123!").then(
    (result) => result?.accessToken ?? null,
  );
  return demoTokenPromise;
}

function getAdminToken(): Promise<string | null> {
  adminTokenPromise ??= login("admin@example.com", "Admin123!").then(
    (result) => result?.accessToken ?? null,
  );
  return adminTokenPromise;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token: string | null,
): Promise<T> {
  if (!token) {
    throw new Error("API login failed");
  }
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return parseEnvelope<T>(response);
}

export async function submitRegistration(input: RegistrationInput) {
  try {
    const user = await publicRequest<AuthUser>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return {
      user,
      nextStep: "Registration submitted. Please wait for admin approval and token allocation.",
    };
  } catch {
    return submitStubRegistration(input);
  }
}

export async function submitLogin(input: LoginInput) {
  const result = await login(input.email, input.password);
  if (result) {
    return result;
  }
  return submitStubLogin(input);
}

export async function getAccountStatus(): Promise<AccountStatusSummary> {
  try {
    return await apiRequest<AccountStatusSummary>(
      "/api/account/access-status",
      {},
      await getDemoToken(),
    );
  } catch {
    return getStubAccountStatus();
  }
}

export async function getTokenSummary(): Promise<TokenSummary> {
  try {
    return await apiRequest<TokenSummary>("/api/account/tokens", {}, await getDemoToken());
  } catch {
    return getStubTokenSummary();
  }
}

export async function getAdminUsers(): Promise<AdminUserStub[]> {
  try {
    const users = await apiRequest<AdminUserStub[]>("/api/admin/users", {}, await getAdminToken());
    return users.map((user) => ({
      ...user,
      requestedAt: user.requestedAt ?? new Date().toISOString(),
      availableActions: user.availableActions ?? [],
    }));
  } catch {
    return getStubAdminUsers();
  }
}

export async function getTournamentSchedule(): Promise<TournamentMatchStub[]> {
  try {
    const matches = await publicRequest<ApiMatchSummary[]>("/api/matches");
    if (!matches.length) {
      throw new Error("No backend matches returned");
    }
    return mergeTournamentMatches(
      matches.map(toTournamentMatch),
      await getStubTournamentSchedule(),
    );
  } catch {
    return getStubTournamentSchedule();
  }
}

export async function getMatchPrediction(
  matchId = "match_001",
  match?: TournamentMatchStub,
): Promise<MatchPredictionStub> {
  const fallback = match ? createPredictionFromSchedule(match) : await getStubMatchPrediction(matchId);
  try {
    const token = await getDemoToken();
    const data = await apiRequest<ApiMatchPredictionResponse>(
      "/api/predictions/match",
      {
        method: "POST",
        body: JSON.stringify({
          matchId,
          options: {
            includeScoreDistribution: true,
            homeTeamCode: fallback.homeTeam.code,
            homeTeamName: fallback.homeTeam.name,
            awayTeamCode: fallback.awayTeam.code,
            awayTeamName: fallback.awayTeam.name,
          },
        }),
      },
      token,
    );
    const rag = mergeRagResponses(
      await Promise.all([
        fetchRagEvidence({
          token,
          matchId,
          teamId: fallback.homeTeam.teamId,
          question: "Summarize historical performance, form, tactical risks, and model evidence for the home team.",
          topK: 4,
        }),
        fetchRagEvidence({
          token,
          matchId,
          teamId: fallback.awayTeam.teamId,
          question: "Summarize historical performance, form, tactical risks, and model evidence for the away team.",
          topK: 4,
        }),
      ]),
    );

    return {
      ...fallback,
      predictionId: data.predictionId,
      matchId: data.matchId,
      modelVersion: data.modelVersion,
      probabilities: {
        homeWin: data.prediction.homeWinProbability,
        draw: data.prediction.drawProbability,
        awayWin: data.prediction.awayWinProbability,
      },
      expectedGoals: data.prediction.expectedGoals,
      scoreDistribution: toScoreBuckets(data.prediction.scorelineProbabilities),
      explanations: buildExplanations(data, rag),
      citations: toCitations(rag.sources),
      ragAnswer: rag.answer,
      ragDiagnostics: rag.retrievalDiagnostics,
      usage: {
        tokensCharged: data.usage.tokensCharged,
        remainingTokens: data.usage.remainingTokens,
        lowBalance: data.usage.lowBalance || Boolean(data.usage.lowTokenWarning),
      },
    };
  } catch {
    return fallback;
  }
}

export async function getTeamDetail(teamId: string): Promise<TeamDetail | null> {
  try {
    const token = await getDemoToken();
    const team = await publicRequest<Omit<TeamDetail, "rag">>(`/api/teams/${teamId}`);
    const rag = await fetchRagEvidence({
      token,
      teamId,
      question: "Summarize this national team's World Cup history, recent form, tactical profile, risk factors, and reliable data sources.",
      topK: 6,
    });
    return { ...team, rag };
  } catch {
    return null;
  }
}

export async function getPlayerDetail(playerId: string): Promise<PlayerDetail | null> {
  try {
    const token = await getDemoToken();
    const player = await publicRequest<Omit<PlayerDetail, "rag">>(`/api/players/${playerId}`);
    const rag = await fetchRagEvidence({
      token,
      playerId,
      teamId: player.teamId,
      question: "Summarize this player's availability, match impact, recent form, and risk factors.",
      topK: 4,
    });
    return { ...player, rag };
  } catch {
    return null;
  }
}

export async function getGroupSimulation(group = "A"): Promise<GroupSimulationSummary | null> {
  try {
    return await apiRequest<GroupSimulationSummary>(
      "/api/simulations/group",
      {
        method: "POST",
        body: JSON.stringify({ group, options: { iterations: 1000 } }),
      },
      await getDemoToken(),
    );
  } catch {
    return null;
  }
}

export async function getWhatIfPrediction(matchId = "match_001"): Promise<WhatIfSummary | null> {
  try {
    return await apiRequest<WhatIfSummary>(
      "/api/predictions/what-if",
      {
        method: "POST",
        body: JSON.stringify({
          matchId,
          scenario: {
            homeLineupChanges: [],
            awayLineupChanges: [],
            weatherAdjustment: "neutral",
          },
        }),
      },
      await getDemoToken(),
    );
  } catch {
    return null;
  }
}

export async function fetchRagEvidence({
  token,
  question,
  matchId,
  teamId,
  playerId,
  topK = 4,
  filters = {},
}: {
  token?: string | null;
  question: string;
  matchId?: string;
  teamId?: string;
  playerId?: string;
  topK?: number;
  filters?: Record<string, unknown>;
}): Promise<RagEvidenceSummary> {
  try {
    return await apiRequest<RagEvidenceSummary>(
      "/api/rag/query",
      {
        method: "POST",
        body: JSON.stringify({
          question,
          matchId,
          teamId,
          playerId,
          topK,
          filters,
          model: "worldcup-rag-qdrant",
        }),
      },
      token ?? (await getDemoToken()),
    );
  } catch {
    return {
      answer: null,
      sources: [],
      retrievalDiagnostics: { status: "unavailable", resultCount: 0 },
    };
  }
}

function toTournamentMatch(match: ApiMatchSummary): TournamentMatchStub {
  return {
    matchId: match.matchId,
    stage: match.group ? `${match.group} group` : match.stage,
    kickoffAt: match.kickoffAt,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    region: match.venue.city || match.venue.name,
    venue: match.venue.name,
  };
}

function mergeTournamentMatches(
  backendMatches: TournamentMatchStub[],
  fallbackMatches: TournamentMatchStub[],
): TournamentMatchStub[] {
  const rows: TournamentMatchStub[] = [];
  const seen = new Set<string>();
  for (const match of [...backendMatches, ...fallbackMatches]) {
    if (seen.has(match.matchId)) {
      continue;
    }
    seen.add(match.matchId);
    rows.push(match);
  }
  return rows;
}

function toScoreBuckets(
  rows: ApiMatchPredictionResponse["prediction"]["scorelineProbabilities"],
): ScoreBucket[] {
  return rows.map((row) => {
    const [homeGoals = "0", awayGoals = "0"] = row.score.split("-");
    return {
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      probability: row.probability,
    };
  });
}

function buildExplanations(data: ApiMatchPredictionResponse, rag: RagEvidenceSummary): string[] {
  const meteringNote = data.metering
    ? `Metering estimate: ${data.metering.estimatedInternalTokens} internal tokens for ${data.metering.featureType}.`
    : null;

  return [
    ...data.explanations,
    `Prediction confidence: ${data.prediction.confidence}.`,
    ...data.prediction.riskFactors.map((item) => `Risk factor: ${item}`),
    ...data.prediction.keyDrivers.map((item) => `Key driver: ${item}`),
    ...(meteringNote ? [meteringNote] : []),
    rag.answer
      ? `RAG evidence summary: ${rag.answer}`
      : "RAG retrieval did not return cited evidence for this query yet.",
  ];
}

function toCitations(sources: RagSource[]): PredictionCitation[] {
  return dedupeSources(sources).map((source, index) => {
    const metadata = source.metadata ?? {};
    const citation = source.citation ?? {};
    return {
      documentId: String(source.documentId ?? metadata.documentId ?? `rag_doc_${index + 1}`),
      chunkId: String(source.chunkId ?? metadata.chunkId ?? `rag_chunk_${index + 1}`),
      sourceName: String(
        citation.title ?? metadata.title ?? metadata.sourceName ?? metadata.source_name ?? "RAG source",
      ),
      sourceUrl: String(citation.sourceUrl ?? metadata.sourceUrl ?? metadata.source_url ?? "#"),
      publishedAt: String(citation.publishedAt ?? metadata.publishedAt ?? metadata.published_at ?? ""),
    };
  });
}

function mergeRagResponses(responses: RagEvidenceSummary[]): RagEvidenceSummary {
  const sources = dedupeSources(responses.flatMap((response) => response.sources));
  const answer = responses
    .map((response) => response.answer)
    .filter((value): value is string => Boolean(value))
    .join("\n\n");

  return {
    answer: answer || null,
    sources,
    retrievalDiagnostics: {
      status: sources.length ? "ok" : responses[0]?.retrievalDiagnostics.status,
      resultCount: sources.length,
      filtersApplied: responses.find((response) => response.retrievalDiagnostics.filtersApplied)
        ?.retrievalDiagnostics.filtersApplied,
      fallbackFromFilters: responses.find(
        (response) => response.retrievalDiagnostics.fallbackFromFilters,
      )?.retrievalDiagnostics.fallbackFromFilters,
    },
  };
}

function dedupeSources(sources: RagSource[]): RagSource[] {
  const seen = new Set<string>();
  const rows: RagSource[] = [];
  for (const source of sources) {
    const key = String(source.chunkId ?? source.documentId ?? JSON.stringify(source.metadata ?? {}));
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push(source);
  }
  return rows;
}
