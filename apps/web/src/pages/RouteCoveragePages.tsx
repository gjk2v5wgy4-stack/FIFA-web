import {
  AlertTriangle,
  BarChart3,
  FileText,
  Lock,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TeamDisplayName } from "../components/TeamDisplayName";
import {
  getGroupSimulation,
  getPlayerDetail,
  getTeamDetail,
  getWhatIfPrediction,
  type GroupSimulationSummary,
  type PlayerDetail,
  type TeamDetail,
  type WhatIfSummary,
} from "../services/apiClient";
import type {
  AccountStatusSummary,
  MatchPredictionStub,
  TokenSummary,
} from "../services/apiStubs";
import { getVenueDisplay } from "../services/teamDisplay";
import type { TournamentMatchStub } from "../services/worldCupSchedule";

interface MatchesPageProps {
  matches: TournamentMatchStub[];
  onOpenMatch: (matchId: string) => void;
  prediction: MatchPredictionStub | null;
}

interface DetailPageProps {
  entityId?: string;
  prediction: MatchPredictionStub | null;
  type: "team" | "player";
}

interface AccessPageProps {
  accountStatus: AccountStatusSummary | null;
  tokenSummary: TokenSummary | null;
}

const statusRows = [
  {
    status: "pending_approval",
    title: "等待管理员审批",
    text: "注册后默认进入待审批状态，审批前不能使用 AI/RAG/预测接口。",
  },
  {
    status: "approved",
    title: "已审批",
    text: "管理员审批并授予初始 token 后，用户可以访问受保护的数据分析功能。",
  },
  {
    status: "rejected",
    title: "已拒绝",
    text: "账号申请被拒绝后不能访问受保护接口，需要联系管理员复核。",
  },
  {
    status: "suspended",
    title: "已暂停",
    text: "账号暂停期间不能继续发起受保护请求，可由管理员重新激活。",
  },
] as const;

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatKickoff(kickoffAt: string) {
  return new Date(kickoffAt).toLocaleString("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function MatchesPage({ matches, onOpenMatch, prediction }: MatchesPageProps) {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Matches</p>
          <h1>世界杯比赛数据面板</h1>
          <p className="muted">
            比赛列表优先读取后端 /api/matches；点击比赛后调用预测、RAG 和 token 计量接口。
          </p>
        </div>
      </section>

      <section className="coverage-grid">
        {matches.map((match) => (
          <article className="info-panel" key={match.matchId}>
            <div className="section-heading">
              <p className="eyebrow">{match.stage}</p>
              <h2 className="inline-match-title">
                <TeamDisplayName team={match.homeTeam} />
                <strong>对阵</strong>
                <TeamDisplayName team={match.awayTeam} />
              </h2>
            </div>
            <dl className="definition-list">
              <div>
                <dt>开球时间</dt>
                <dd>{formatKickoff(match.kickoffAt)}</dd>
              </div>
              <div>
                <dt>比赛场地</dt>
                <dd>{getVenueDisplay(match.venue)}</dd>
              </div>
            </dl>
            <button className="primary-button" onClick={() => onOpenMatch(match.matchId)} type="button">
              <BarChart3 aria-hidden="true" size={18} />
              查看真实预测
            </button>
          </article>
        ))}

        {prediction && (
          <article className="info-panel">
            <div className="section-heading">
              <p className="eyebrow">Active Prediction</p>
              <h2>当前预测接口结果</h2>
            </div>
            <dl className="definition-list">
              <div>
                <dt>主胜</dt>
                <dd>{percent(prediction.probabilities.homeWin)}</dd>
              </div>
              <div>
                <dt>平局</dt>
                <dd>{percent(prediction.probabilities.draw)}</dd>
              </div>
              <div>
                <dt>客胜</dt>
                <dd>{percent(prediction.probabilities.awayWin)}</dd>
              </div>
              <div>
                <dt>RAG 引用</dt>
                <dd>{prediction.citations.length}</dd>
              </div>
            </dl>
          </article>
        )}
      </section>
    </div>
  );
}

export function EntityDetailPage({ entityId, prediction, type }: DetailPageProps) {
  const isTeam = type === "team";
  const resolvedId = useMemo(() => {
    if (entityId) {
      return entityId;
    }
    return isTeam ? prediction?.homeTeam.teamId ?? "team_usa" : "player_001";
  }, [entityId, isTeam, prediction?.homeTeam.teamId]);
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [playerDetail, setPlayerDetail] = useState<PlayerDetail | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setTeamDetail(null);
    setPlayerDetail(null);

    if (isTeam) {
      getTeamDetail(resolvedId).then((detail) => {
        if (isCurrent) {
          setTeamDetail(detail);
        }
      });
    } else {
      getPlayerDetail(resolvedId).then((detail) => {
        if (isCurrent) {
          setPlayerDetail(detail);
        }
      });
    }

    return () => {
      isCurrent = false;
    };
  }, [isTeam, resolvedId]);

  const rag = isTeam ? teamDetail?.rag : playerDetail?.rag;

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">{isTeam ? "Team Detail" : "Player Detail"}</p>
          <h1>{isTeam ? "球队数据画像" : "球员赛前画像"}</h1>
          <p className="muted">
            当前对象：{resolvedId}。结构化数据来自后端接口，历史表现、情报摘要和来源引用来自 RAG 数据库。
          </p>
        </div>
      </section>

      {isTeam ? (
        <TeamDetailPanels detail={teamDetail} fallbackTeamId={resolvedId} />
      ) : (
        <PlayerDetailPanels detail={playerDetail} fallbackPlayerId={resolvedId} />
      )}

      <section className="coverage-grid">
        <article className="info-panel">
          <FileText aria-hidden="true" size={24} />
          <h2>RAG 情报摘要</h2>
          <p className="muted">
            {rag?.answer ?? "正在从 Qdrant RAG 数据库读取历史表现、战术风险和公开来源依据。"}
          </p>
          <small>
            状态：{rag?.retrievalDiagnostics.status ?? "loading"}；来源：
            {rag?.sources.length ?? 0}
          </small>
        </article>
        {(rag?.sources ?? []).slice(0, 4).map((source) => (
          <article className="info-panel" key={source.chunkId ?? source.documentId}>
            <FileText aria-hidden="true" size={24} />
            <h2>{source.citation?.title ?? String(source.metadata?.title ?? "RAG source")}</h2>
            <p className="muted">{source.contentPreview ?? "该来源提供球队或比赛上下文。"} </p>
            <small>{source.citation?.sourceUrl ?? String(source.metadata?.source_url ?? "")}</small>
          </article>
        ))}
      </section>
    </div>
  );
}

function TeamDetailPanels({
  detail,
  fallbackTeamId,
}: {
  detail: TeamDetail | null;
  fallbackTeamId: string;
}) {
  return (
    <section className="coverage-grid">
      <article className="info-panel">
        <Users aria-hidden="true" size={24} />
        <h2>{detail?.name ?? fallbackTeamId}</h2>
        <dl className="definition-list">
          <div>
            <dt>代码</dt>
            <dd>{detail?.code ?? "--"}</dd>
          </div>
          <div>
            <dt>大洲</dt>
            <dd>{detail?.confederation ?? "--"}</dd>
          </div>
          <div>
            <dt>小组</dt>
            <dd>{detail?.group ?? "--"}</dd>
          </div>
        </dl>
      </article>
      <article className="info-panel">
        <ShieldCheck aria-hidden="true" size={24} />
        <h2>模型画像</h2>
        <dl className="definition-list">
          <div>
            <dt>Elo</dt>
            <dd>{detail?.modelProfile?.elo ?? "--"}</dd>
          </div>
          <div>
            <dt>xG/90</dt>
            <dd>{detail?.modelProfile?.xgFor90 ?? "--"}</dd>
          </div>
          <div>
            <dt>xGA/90</dt>
            <dd>{detail?.modelProfile?.xgAgainst90 ?? "--"}</dd>
          </div>
        </dl>
      </article>
      <article className="info-panel">
        <Users aria-hidden="true" size={24} />
        <h2>球员列表</h2>
        <ul className="plain-list">
          {(detail?.players ?? []).map((player) => (
            <li key={player.playerId}>
              <span>
                {player.name} · {player.position}
              </span>
              <small>{player.availabilityStatus}</small>
            </li>
          ))}
          {!detail?.players.length && <li>正在读取后端球员数据。</li>}
        </ul>
      </article>
    </section>
  );
}

function PlayerDetailPanels({
  detail,
  fallbackPlayerId,
}: {
  detail: PlayerDetail | null;
  fallbackPlayerId: string;
}) {
  return (
    <section className="coverage-grid">
      <article className="info-panel">
        <Users aria-hidden="true" size={24} />
        <h2>{detail?.name ?? fallbackPlayerId}</h2>
        <dl className="definition-list">
          <div>
            <dt>位置</dt>
            <dd>{detail?.position ?? "--"}</dd>
          </div>
          <div>
            <dt>可用状态</dt>
            <dd>{detail?.availabilityStatus ?? "--"}</dd>
          </div>
          <div>
            <dt>所属球队</dt>
            <dd>{detail?.teamId ?? "--"}</dd>
          </div>
        </dl>
      </article>
      <article className="info-panel">
        <AlertTriangle aria-hidden="true" size={24} />
        <h2>模型影响</h2>
        <dl className="definition-list">
          <div>
            <dt>可用性影响</dt>
            <dd>{detail?.modelImpact?.availabilityImpact ?? "--"}</dd>
          </div>
          <div>
            <dt>进攻贡献</dt>
            <dd>{detail?.modelImpact?.attackContribution ?? "--"}</dd>
          </div>
          <div>
            <dt>预计分钟</dt>
            <dd>{detail?.modelImpact?.minutesProjection ?? "--"}</dd>
          </div>
        </dl>
      </article>
    </section>
  );
}

export function SimulatorPage({ mode }: { mode: "group" | "knockout" }) {
  const isGroup = mode === "group";
  const [groupSimulation, setGroupSimulation] = useState<GroupSimulationSummary | null>(null);
  const [whatIf, setWhatIf] = useState<WhatIfSummary | null>(null);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([getGroupSimulation("A"), getWhatIfPrediction("match_001")]).then(
      ([nextGroup, nextWhatIf]) => {
        if (!isCurrent) {
          return;
        }
        setGroupSimulation(nextGroup);
        setWhatIf(nextWhatIf);
      },
    );

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">{isGroup ? "Group Simulator" : "Scenario Simulator"}</p>
          <h1>{isGroup ? "小组赛情景模拟" : "淘汰赛/赛事情景模拟"}</h1>
          <p className="muted">
            模拟器调用后端计量接口，所有结果保留不确定性说明，不提供保证性结论。
          </p>
        </div>
      </section>

      <section className="coverage-grid">
        <article className="info-panel">
          <ShieldCheck aria-hidden="true" size={24} />
          <h2>小组模拟结果</h2>
          <p className="muted">
            simulationId：{groupSimulation?.simulationId ?? "loading"}；迭代：
            {groupSimulation?.iterations ?? "--"}
          </p>
          <div className="score-grid">
            {(groupSimulation?.table ?? []).map((row) => (
              <div className="score-card" key={row.teamId}>
                <strong>{row.teamId}</strong>
                <span>{row.projectedPoints.toFixed(1)} pts</span>
                <small>
                  出线 {percent(row.qualifyProbability)} / 头名{" "}
                  {percent(row.groupWinnerProbability)}
                </small>
              </div>
            ))}
          </div>
        </article>

        <article className="info-panel">
          <AlertTriangle aria-hidden="true" size={24} />
          <h2>What-if 情景</h2>
          <p className="muted">scenarioId：{whatIf?.scenarioId ?? "loading"}</p>
          <dl className="definition-list">
            {Object.entries(whatIf?.delta ?? {}).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value > 0 ? "+" : ""}{percent(value)}</dd>
              </div>
            ))}
          </dl>
        </article>
      </section>
    </div>
  );
}

export function AccessPage({ accountStatus, tokenSummary }: AccessPageProps) {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Access Control</p>
          <h1>MVP 访问状态总览</h1>
          <p className="muted">
            注册后等待审批，管理员人工审批并授予 token；余额不足时联系管理员调整配额。
          </p>
        </div>
      </section>

      <section className="status-grid">
        {statusRows.map((row) => (
          <article className="status-card" key={row.status}>
            <span className={`status-pill status-pill--${row.status}`}>{row.status}</span>
            <h2>{row.title}</h2>
            <p>{row.text}</p>
          </article>
        ))}
      </section>

      <section className="coverage-grid">
        <article className="info-panel">
          <Lock aria-hidden="true" size={24} />
          <h2>当前账号</h2>
          <p className="muted">
            {accountStatus?.message ?? "正在读取账号审批状态..."}
          </p>
        </article>
        <article className="info-panel">
          <WalletCards aria-hidden="true" size={24} />
          <h2>token 状态</h2>
          <p className="muted">
            当前余额 {tokenSummary?.balanceTokens.toLocaleString() ?? "--"}。低余额提醒：
            {tokenSummary?.contactAdminMessage ?? "联系管理员调整 token 配额。"}
          </p>
          <p className="muted">
            额度不足：本次请求不会执行，请联系管理员授予或调整 token。
          </p>
        </article>
      </section>
    </div>
  );
}
