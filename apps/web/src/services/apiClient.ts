import {
  getAccountStatus as getStubAccountStatus,
  getAdminUsers as getStubAdminUsers,
  getMatchPrediction as getStubMatchPrediction,
  getTokenSummary as getStubTokenSummary,
  type AccountStatusSummary,
  type AdminUserStub,
  type MatchPredictionStub,
  type PredictionCitation,
  type ScoreBucket,
  type TokenSummary,
} from "./apiStubs";

const apiBaseUrl = "";

let demoTokenPromise: Promise<string | null> | null = null;
let adminTokenPromise: Promise<string | null> | null = null;

interface ApiEnvelope<T> {
  data: T;
}

interface ApiLoginResponse {
  accessToken: string;
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
  usage: {
    tokensCharged: number;
    remainingTokens: number;
    lowBalance: boolean;
  };
}

interface RagSource {
  chunkId?: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
  citation?: {
    title?: string;
    sourceUrl?: string;
    publishedAt?: string;
  };
}

interface RagResponse {
  answer: string | null;
  sources: RagSource[];
  retrievalDiagnostics: {
    status?: string;
    resultCount?: number;
  };
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

async function login(email: string, password: string): Promise<string | null> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    return null;
  }
  const data = await parseEnvelope<ApiLoginResponse>(response);
  return data.accessToken;
}

function getDemoToken(): Promise<string | null> {
  demoTokenPromise ??= login("approved@example.com", "Approved123!");
  return demoTokenPromise;
}

function getAdminToken(): Promise<string | null> {
  adminTokenPromise ??= login("admin@example.com", "Admin123!");
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

export async function getMatchPrediction(matchId = "match_001"): Promise<MatchPredictionStub> {
  const fallback = await getStubMatchPrediction(matchId);
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
    const rag = await fetchRagContext(matchId, fallback.homeTeam.teamId, token);
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
      usage: {
        tokensCharged: data.usage.tokensCharged,
        remainingTokens: data.usage.remainingTokens,
        lowBalance: data.usage.lowBalance,
      },
    };
  } catch {
    return fallback;
  }
}

async function fetchRagContext(
  matchId: string,
  teamId: string,
  token: string | null,
): Promise<RagResponse> {
  try {
    return await apiRequest<RagResponse>(
      "/api/rag/query",
      {
        method: "POST",
        body: JSON.stringify({
          question: "What are the main data-driven risk factors and model evidence for this match?",
          matchId,
          teamId,
          topK: 4,
          filters: {},
          model: "worldcup-rag-qdrant",
        }),
      },
      token,
    );
  } catch {
    return {
      answer: null,
      sources: [],
      retrievalDiagnostics: { status: "unavailable", resultCount: 0 },
    };
  }
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

function buildExplanations(data: ApiMatchPredictionResponse, rag: RagResponse): string[] {
  return [
    ...data.explanations,
    `Prediction confidence: ${data.prediction.confidence}.`,
    ...data.prediction.riskFactors.map((item) => `Risk factor: ${item}`),
    ...data.prediction.keyDrivers.map((item) => `Key driver: ${item}`),
    rag.answer
      ? `RAG evidence summary: ${rag.answer}`
      : "RAG retrieval did not return cited evidence for this query yet.",
  ];
}

function toCitations(sources: RagSource[]): PredictionCitation[] {
  return sources.map((source, index) => {
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
