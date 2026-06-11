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
  type PredictionAnalysisContext,
  type PredictionAnalysisSection,
  type PredictionTeamAnalysisContext,
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
import { getTeamDisplay } from "./teamDisplay";
import { createMatchWeatherForecast } from "./weatherForecast";

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
    const [rag, analysisContext] = await Promise.all([
      Promise.all([
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
      ]).then(mergeRagResponses),
      buildPredictionAnalysisContext(fallback, match),
    ]);

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
      analysisSections: buildAnalysisSections(rag),
      analysisContext,
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
  const rows = [...fallbackMatches];
  const fallbackIndexByFixture = new Map<string, number>();

  rows.forEach((match, index) => {
    fallbackIndexByFixture.set(createFixtureKey(match), index);
  });

  for (const backendMatch of backendMatches) {
    const fallbackIndex = fallbackIndexByFixture.get(createFixtureKey(backendMatch));
    if (fallbackIndex === undefined) {
      continue;
    }

    const fallbackMatch = rows[fallbackIndex];
    if (!fallbackMatch) {
      continue;
    }

    rows[fallbackIndex] = {
      ...fallbackMatch,
      matchId: backendMatch.matchId,
      venue: backendMatch.venue || fallbackMatch.venue,
      region: backendMatch.region || fallbackMatch.region,
    };
  }

  return rows;
}

function createFixtureKey(match: TournamentMatchStub) {
  return `${createTeamKey(match.homeTeam)}|${createTeamKey(match.awayTeam)}`;
}

function createTeamKey(team: string) {
  const display = getTeamDisplay(team);
  return (display.code || team).trim().toLowerCase();
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

type PredictionTeam = MatchPredictionStub["homeTeam"];

interface VenueEnvironmentFacts {
  city: string;
  altitudeMeters: number;
  turf: string;
  pitchCondition: string;
  defaultTrainingBase: string;
  preparationByCode?: Record<
    string,
    {
      trainingBase: string;
      travelDistanceKm: number;
      restDays: number;
      timezoneAdjustment: string;
    }
  >;
}

const venueEnvironmentFacts: Record<string, VenueEnvironmentFacts> = {
  "Mexico City": {
    city: "Mexico City",
    altitudeMeters: 2240,
    turf: "天然草",
    pitchCondition: "高海拔天然草场，控球节奏和体能分配需要重点监控",
    defaultTrainingBase: "墨西哥城赛前适应训练场",
    preparationByCode: {
      MEX: {
        trainingBase: "墨西哥城国家队赛前训练基地",
        travelDistanceKm: 0,
        restDays: 6,
        timezoneAdjustment: "本土时区",
      },
      RSA: {
        trainingBase: "墨西哥城高原适应训练场",
        travelDistanceKm: 14600,
        restDays: 6,
        timezoneAdjustment: "约8小时",
      },
      CZE: {
        trainingBase: "墨西哥城赛前适应训练场",
        travelDistanceKm: 10100,
        restDays: 5,
        timezoneAdjustment: "约8小时",
      },
      UZB: {
        trainingBase: "墨西哥城赛前适应训练场",
        travelDistanceKm: 13600,
        restDays: 5,
        timezoneAdjustment: "约11小时",
      },
    },
  },
  Zapopan: {
    city: "Zapopan",
    altitudeMeters: 1566,
    turf: "天然草",
    pitchCondition: "中高海拔天然草场，午后热感和补水窗口需要纳入赛前计划",
    defaultTrainingBase: "Zapopan 官方赛前训练场",
    preparationByCode: {
      KOR: {
        trainingBase: "Zapopan 赛前训练基地",
        travelDistanceKm: 12000,
        restDays: 6,
        timezoneAdjustment: "约15小时",
      },
      CZE: {
        trainingBase: "Zapopan 赛前训练基地",
        travelDistanceKm: 10300,
        restDays: 6,
        timezoneAdjustment: "约8小时",
      },
      MEX: {
        trainingBase: "Guadalajara/Zapopan 本土适应训练场",
        travelDistanceKm: 540,
        restDays: 6,
        timezoneAdjustment: "本土时区",
      },
    },
  },
  Toronto: {
    city: "Toronto",
    altitudeMeters: 76,
    turf: "天然草",
    pitchCondition: "低海拔城市球场，温度和风速对长传落点影响更明显",
    defaultTrainingBase: "Toronto 赛前训练基地",
  },
  "Los Angeles": {
    city: "Los Angeles",
    altitudeMeters: 30,
    turf: "天然草",
    pitchCondition: "低海拔暖热环境，边路冲刺和补水节奏需要持续跟踪",
    defaultTrainingBase: "Los Angeles 赛前训练基地",
  },
  Atlanta: {
    city: "Atlanta",
    altitudeMeters: 320,
    turf: "天然草",
    pitchCondition: "温热湿度环境，换人窗口和高强度压迫持续性需要评估",
    defaultTrainingBase: "Atlanta 赛前训练基地",
  },
  Guadalupe: {
    city: "Guadalupe",
    altitudeMeters: 540,
    turf: "天然草",
    pitchCondition: "干热环境，体能恢复和比赛后段节奏变化需要重点观察",
    defaultTrainingBase: "Guadalupe 赛前训练基地",
  },
};

venueEnvironmentFacts["Mexico City Stadium"] = venueEnvironmentFacts["Mexico City"];
venueEnvironmentFacts["Estadio Guadalajara"] = venueEnvironmentFacts.Zapopan;

async function buildPredictionAnalysisContext(
  prediction: MatchPredictionStub,
  match?: TournamentMatchStub,
): Promise<PredictionAnalysisContext> {
  const [home, away] = await Promise.all([
    fetchTeamAnalysisContext(prediction.homeTeam),
    fetchTeamAnalysisContext(prediction.awayTeam),
  ]);

  return {
    home,
    away,
    environment: buildEnvironmentContext(prediction, match),
  };
}

async function fetchTeamAnalysisContext(
  team: PredictionTeam,
): Promise<PredictionTeamAnalysisContext> {
  const detail = await fetchTeamDetailOnly(team.teamId);
  const basePlayers = detail?.players ?? [];
  const playerDetails = await Promise.all(
    basePlayers.map((player) => fetchPlayerDetailOnly(player.playerId)),
  );

  return {
    teamId: team.teamId,
    name: detail?.name ?? team.name,
    code: detail?.code ?? team.code,
    form: team.form,
    modelProfile: detail?.modelProfile,
    players: basePlayers.map((player, index) => {
      const playerDetail = playerDetails[index];
      return {
        playerId: player.playerId,
        name: playerDetail?.name ?? player.name,
        position: playerDetail?.position ?? player.position,
        availabilityStatus: playerDetail?.availabilityStatus ?? player.availabilityStatus,
        minutesProjection: playerDetail?.modelImpact?.minutesProjection,
        attackContribution: playerDetail?.modelImpact?.attackContribution,
        defenseContribution: playerDetail?.modelImpact?.defenseContribution,
        availabilityImpact: playerDetail?.modelImpact?.availabilityImpact,
      };
    }),
  };
}

async function fetchTeamDetailOnly(teamId: string): Promise<Omit<TeamDetail, "rag"> | null> {
  try {
    return await publicRequest<Omit<TeamDetail, "rag">>(`/api/teams/${teamId}`);
  } catch {
    return null;
  }
}

async function fetchPlayerDetailOnly(playerId: string): Promise<Omit<PlayerDetail, "rag"> | null> {
  try {
    return await publicRequest<Omit<PlayerDetail, "rag">>(`/api/players/${playerId}`);
  } catch {
    return null;
  }
}

function buildEnvironmentContext(
  prediction: MatchPredictionStub,
  match?: TournamentMatchStub,
): PredictionAnalysisContext["environment"] {
  const fallbackMatch: TournamentMatchStub = {
    matchId: prediction.matchId,
    stage: "",
    kickoffAt: prediction.kickoffAt,
    homeTeam: prediction.homeTeam.name,
    awayTeam: prediction.awayTeam.name,
    region: prediction.venue,
    venue: prediction.venue,
  };
  const matchForEnvironment = match ?? fallbackMatch;
  const weather = createMatchWeatherForecast(matchForEnvironment);
  const facts = venueEnvironmentFacts[matchForEnvironment.region] ?? {
    city: matchForEnvironment.region,
    altitudeMeters: 120,
    turf: "天然草",
    pitchCondition: "赛前场地状态待官方最终确认",
    defaultTrainingBase: `${matchForEnvironment.region} 赛前训练基地`,
  };

  return {
    venue: matchForEnvironment.venue,
    city: facts.city,
    altitudeMeters: facts.altitudeMeters,
    turf: facts.turf,
    pitchCondition: facts.pitchCondition,
    weather: {
      condition: weather.condition,
      temperatureC: weather.temperatureC,
      humidityPct: weather.humidityPct,
      windKph: weather.windKph,
    },
    teams: {
      home: buildTeamEnvironment(facts, prediction.homeTeam, "home"),
      away: buildTeamEnvironment(facts, prediction.awayTeam, "away"),
    },
  };
}

function buildTeamEnvironment(
  facts: VenueEnvironmentFacts,
  team: PredictionTeam,
  side: "home" | "away",
): PredictionAnalysisContext["environment"]["teams"]["home"] {
  const code = team.code.toUpperCase();
  const configured = facts.preparationByCode?.[code];
  if (configured) {
    return configured;
  }

  return {
    trainingBase: `${facts.defaultTrainingBase}${side === "home" ? "（主队）" : "（客队）"}`,
    travelDistanceKm: side === "home" ? 800 : 7800,
    restDays: side === "home" ? 5 : 4,
    timezoneAdjustment: side === "home" ? "较低" : "跨时区适应",
  };
}

const analysisSectionDefinitions: Record<
  PredictionAnalysisSection["id"],
  Pick<PredictionAnalysisSection, "title" | "reason">
> = {
  team_history: {
    title: "球队历史表现数据",
    reason: "整合历史战绩、世界杯经历和近期状态，用于判断球队稳定性。",
  },
  player_profile: {
    title: "球员多维数据",
    reason: "整合核心球员、可用性和近期贡献，用于判断阵容影响。",
  },
  match_environment: {
    title: "比赛环境和外部因素",
    reason: "整合场地、天气、旅途、休息天数和赛程密度，用于评估环境变量。",
  },
  tactical_context: {
    title: "球队战术和阵型数据",
    reason: "整合阵型、压迫、转换和攻防结构，用于评估战术匹配度。",
  },
  opponent_context: {
    title: "对手信息",
    reason: "整合对手强弱点、交锋关系和对位风险，用于评估比赛压力。",
  },
  live_updates: {
    title: "实时动态数据",
    reason: "整合赛前新闻、训练、伤停和临场动态，用于修正赛前判断。",
  },
  advanced_metrics: {
    title: "统计和高级指标",
    reason: "整合 xG、射门质量、控球和防守指标，用于补充概率模型。",
  },
  external_factors: {
    title: "外部因素与数据完整性",
    reason: "整合数据完整性、可用范围和授权限制，用于提示模型边界。",
  },
};

function buildAnalysisSections(rag: RagEvidenceSummary): PredictionAnalysisSection[] {
  const sectionMap = new Map<
    PredictionAnalysisSection["id"],
    { points: string[]; sourceCount: number }
  >();

  for (const source of dedupeSources(rag.sources)) {
    const id = classifyRagSource(source);
    const current = sectionMap.get(id) ?? { points: [], sourceCount: 0 };
    const point = sourceToAnalysisPoint(source);
    current.sourceCount += 1;
    if (point && !current.points.includes(point) && current.points.length < 4) {
      current.points.push(point);
    }
    sectionMap.set(id, current);
  }

  return Object.entries(analysisSectionDefinitions)
    .map(([id, definition]) => {
      const row = sectionMap.get(id as PredictionAnalysisSection["id"]);
      if (!row) {
        return null;
      }
      return {
        id: id as PredictionAnalysisSection["id"],
        title: definition.title,
        points: row.points.length ? row.points : ["已获取该维度数据，但摘要暂不可展示。"],
        reason: definition.reason,
        sourceCount: row.sourceCount,
      };
    })
    .filter((section): section is PredictionAnalysisSection => section !== null);
}

function classifyRagSource(source: RagSource): PredictionAnalysisSection["id"] {
  const metadata = source.metadata ?? {};
  const haystack = [
    source.contentPreview,
    source.citation?.title,
    metadata.title,
    metadata.sourceType,
    metadata.source_type,
    metadata.tags,
  ]
    .flat()
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(weather|venue|travel|rest|altitude|environment|场地|天气|旅途|休息|海拔)/.test(haystack)) {
    return "match_environment";
  }
  if (/(player|lineup|injury|availability|球员|阵容|伤停|可用性)/.test(haystack)) {
    return "player_profile";
  }
  if (/(tactical|formation|press|transition|战术|阵型|压迫|转换)/.test(haystack)) {
    return "tactical_context";
  }
  if (/(opponent|head-to-head|h2h|对手|交锋|对位)/.test(haystack)) {
    return "opponent_context";
  }
  if (/(news|training|live|update|新闻|训练|动态|临场)/.test(haystack)) {
    return "live_updates";
  }
  if (/(xg|xga|shot|possession|metric|advanced|指标|射门|控球)/.test(haystack)) {
    return "advanced_metrics";
  }
  if (/(source|coverage|provider|reliability|market|来源|覆盖|授权|可靠性|市场)/.test(haystack)) {
    return "external_factors";
  }
  return "team_history";
}

function sourceToAnalysisPoint(source: RagSource): string {
  const raw = String(
    source.contentPreview ??
      source.citation?.title ??
      source.metadata?.title ??
      "RAG 已返回该维度的分析摘要。",
  );
  if (
    /rag metadata|metadata json|documentId|sourceType|publishedAt|sourceUrl|source_name|source_url/i.test(
      raw,
    )
  ) {
    return "";
  }

  return raw
    .replace(/[`*_#|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
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
      ? `RAG analysis summary: ${rag.answer}`
      : "RAG 暂未返回该查询的分析摘要。",
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
