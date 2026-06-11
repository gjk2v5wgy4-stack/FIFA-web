export type UserStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "suspended";

export type AdminAction =
  | "approve_user"
  | "reject_user"
  | "suspend_user"
  | "reactivate_user"
  | "grant_tokens"
  | "adjust_tokens"
  | "revoke_tokens";

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  role: "user" | "admin" | "analyst";
  status: UserStatus;
}

export interface RegistrationInput {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenLedgerEntry {
  ledgerId: string;
  amountTokens: number;
  reason: string;
  relatedEntityType: string;
  relatedEntityId: string;
  createdAt: string;
}

export interface TokenSummary {
  userId: string;
  balanceTokens: number;
  lowBalance: boolean;
  lowBalanceThreshold: number;
  contactAdminMessage: string;
  ledger: TokenLedgerEntry[];
}

export interface AccountStatusSummary {
  userId: string;
  status: UserStatus;
  canUseProtectedApis: boolean;
  message: string;
  updatedAt: string;
}

export interface ScoreBucket {
  homeGoals: number;
  awayGoals: number;
  probability: number;
}

export interface PredictionCitation {
  documentId: string;
  chunkId: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
}

export interface MatchPredictionStub {
  predictionId: string;
  matchId: string;
  modelVersion: string;
  kickoffAt: string;
  venue: string;
  homeTeam: {
    teamId: string;
    name: string;
    code: string;
    form: string[];
  };
  awayTeam: {
    teamId: string;
    name: string;
    code: string;
    form: string[];
  };
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  expectedGoals: {
    home: number;
    away: number;
  };
  scoreDistribution: ScoreBucket[];
  explanations: string[];
  citations: PredictionCitation[];
  ragAnswer?: string | null;
  ragDiagnostics?: {
    status?: string;
    resultCount?: number;
    filtersApplied?: Record<string, unknown>;
    fallbackFromFilters?: Record<string, unknown>;
  };
  usage: {
    tokensCharged: number;
    remainingTokens: number;
    lowBalance: boolean;
  };
}

export interface AdminUserStub {
  userId: string;
  email: string;
  displayName: string;
  status: UserStatus;
  tokenBalance: number;
  requestedAt: string;
  availableActions: AdminAction[];
}

export interface TodayMatchStub {
  matchId: string;
  stage: string;
  group: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  kickoffAt: string;
  venue: string;
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

const demoUser: AuthUser = {
  userId: "user_demo",
  email: "demo@example.com",
  displayName: "赛前分析用户",
  role: "analyst",
  status: "approved",
};

const waitForStub = async () => {
  await new Promise((resolve) => setTimeout(resolve, 120));
};

export async function submitRegistration(input: RegistrationInput) {
  await waitForStub();

  return {
    user: {
      userId: "user_pending",
      email: input.email,
      displayName: input.displayName,
      role: "user" as const,
      status: "pending_approval" as const,
    },
    nextStep: "账号已提交，等待管理员审批并授予初始 token 配额。",
  };
}

export async function submitLogin(input: LoginInput) {
  await waitForStub();

  return {
    accessToken: "stub_session_token",
    user: {
      ...demoUser,
      email: input.email,
    },
  };
}

export async function getAccountStatus(
  userId = demoUser.userId,
): Promise<AccountStatusSummary> {
  await waitForStub();

  if (userId === "user_pending") {
    return {
      userId,
      status: "pending_approval",
      canUseProtectedApis: false,
      message: "账号正在等待管理员审批，审批后才可使用预测和 RAG 功能。",
      updatedAt: "2026-06-10T10:00:00Z",
    };
  }

  return {
    userId,
    status: "approved",
    canUseProtectedApis: true,
    message: "账号已通过管理员审批，可使用受保护的分析功能。",
    updatedAt: "2026-06-10T10:00:00Z",
  };
}

export async function getTokenSummary(
  userId = demoUser.userId,
): Promise<TokenSummary> {
  await waitForStub();

  return {
    userId,
    balanceTokens: 76800,
    lowBalance: false,
    lowBalanceThreshold: 10000,
    contactAdminMessage: "token 余额较低时，请联系管理员调整配额。",
    ledger: [
      {
        ledgerId: "tl_001",
        amountTokens: 100000,
        reason: "admin_initial_grant",
        relatedEntityType: "admin_action",
        relatedEntityId: "admin_action_001",
        createdAt: "2026-06-10T09:30:00Z",
      },
      {
        ledgerId: "tl_002",
        amountTokens: -800,
        reason: "match_prediction",
        relatedEntityType: "prediction",
        relatedEntityId: "pred_001",
        createdAt: "2026-06-10T10:00:00Z",
      },
    ],
  };
}

export async function getMatchPrediction(
  matchId = "match_001",
): Promise<MatchPredictionStub> {
  await waitForStub();

  return {
    predictionId: "pred_001",
    matchId,
    modelVersion: "football-models-0.1.0",
    kickoffAt: "2026-06-12T20:00:00Z",
    venue: "MetLife Stadium",
    homeTeam: {
      teamId: "team_usa",
      name: "United States",
      code: "USA",
      form: ["W", "D", "W", "L", "W"],
    },
    awayTeam: {
      teamId: "team_wal",
      name: "Wales",
      code: "WAL",
      form: ["D", "W", "L", "D", "W"],
    },
    probabilities: {
      homeWin: 0.43,
      draw: 0.28,
      awayWin: 0.29,
    },
    expectedGoals: {
      home: 1.42,
      away: 1.16,
    },
    scoreDistribution: [
      { homeGoals: 1, awayGoals: 1, probability: 0.12 },
      { homeGoals: 2, awayGoals: 1, probability: 0.1 },
      { homeGoals: 1, awayGoals: 0, probability: 0.09 },
      { homeGoals: 0, awayGoals: 1, probability: 0.08 },
    ],
    explanations: [
      "概率预测基于近期状态、Elo 特征和 xG 趋势。",
      "主要风险因素来自边路防守转换和关键前锋健康状态。",
      "模型结果存在不确定性，应结合赛前情报持续复核。",
    ],
    citations: [
      {
        documentId: "doc_001",
        chunkId: "chunk_001",
        sourceName: "Team scouting report",
        sourceUrl: "https://source.example.com/report",
        publishedAt: "2026-06-01T00:00:00Z",
      },
      {
        documentId: "doc_002",
        chunkId: "chunk_004",
        sourceName: "Injury status feed",
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
}

function kickoffOnDate(referenceDate: Date, hours: number, minutes = 0) {
  const kickoff = new Date(referenceDate);
  kickoff.setHours(hours, minutes, 0, 0);
  return kickoff.toISOString();
}

export async function getTodayMatches(
  referenceDate = new Date(),
): Promise<TodayMatchStub[]> {
  await waitForStub();

  return [
    {
      matchId: "match_today_001",
      stage: "group",
      group: "A",
      status: "scheduled",
      kickoffAt: kickoffOnDate(referenceDate, 18, 0),
      venue: "MetLife Stadium",
      homeTeam: {
        teamId: "team_usa",
        name: "United States",
        code: "USA",
      },
      awayTeam: {
        teamId: "team_wal",
        name: "Wales",
        code: "WAL",
      },
    },
    {
      matchId: "match_today_002",
      stage: "group",
      group: "B",
      status: "scheduled",
      kickoffAt: kickoffOnDate(referenceDate, 21, 0),
      venue: "SoFi Stadium",
      homeTeam: {
        teamId: "team_arg",
        name: "Argentina",
        code: "ARG",
      },
      awayTeam: {
        teamId: "team_jpn",
        name: "Japan",
        code: "JPN",
      },
    },
    {
      matchId: "match_today_003",
      stage: "group",
      group: "C",
      status: "scheduled",
      kickoffAt: kickoffOnDate(referenceDate, 23, 30),
      venue: "Lumen Field",
      homeTeam: {
        teamId: "team_bra",
        name: "Brazil",
        code: "BRA",
      },
      awayTeam: {
        teamId: "team_mar",
        name: "Morocco",
        code: "MAR",
      },
    },
  ];
}

export async function getAdminUsers(): Promise<AdminUserStub[]> {
  await waitForStub();

  return [
    {
      userId: "user_pending",
      email: "analyst.pending@example.com",
      displayName: "待审批分析员",
      status: "pending_approval",
      tokenBalance: 0,
      requestedAt: "2026-06-10T09:00:00Z",
      availableActions: ["approve_user", "reject_user"],
    },
    {
      userId: "user_demo",
      email: "demo@example.com",
      displayName: "赛前分析用户",
      status: "approved",
      tokenBalance: 76800,
      requestedAt: "2026-06-09T18:30:00Z",
      availableActions: [
        "suspend_user",
        "grant_tokens",
        "adjust_tokens",
        "revoke_tokens",
      ],
    },
    {
      userId: "user_suspended",
      email: "suspended@example.com",
      displayName: "暂停访问用户",
      status: "suspended",
      tokenBalance: 12000,
      requestedAt: "2026-06-08T08:10:00Z",
      availableActions: ["reactivate_user", "adjust_tokens"],
    },
    {
      userId: "user_rejected",
      email: "rejected@example.com",
      displayName: "已拒绝申请用户",
      status: "rejected",
      tokenBalance: 0,
      requestedAt: "2026-06-07T14:20:00Z",
      availableActions: ["reactivate_user"],
    },
  ];
}
