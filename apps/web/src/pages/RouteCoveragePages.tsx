import {
  AlertTriangle,
  BarChart3,
  FileText,
  Lock,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import type {
  AccountStatusSummary,
  MatchPredictionStub,
  TokenSummary,
} from "../services/apiStubs";

interface MatchesPageProps {
  onOpenMatch: () => void;
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

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

const statusRows = [
  {
    status: "pending_approval",
    title: "等待管理员审批",
    text: "注册后默认进入待审批状态，审批前不能使用 AI/RAG/预测/报告接口。",
  },
  {
    status: "approved",
    title: "已审批",
    text: "管理员审批并授予初始 token 后，用户才能访问受保护的数据分析功能。",
  },
  {
    status: "rejected",
    title: "已拒绝",
    text: "账户申请被拒绝后不能访问受保护接口，需要联系管理员复核。",
  },
  {
    status: "suspended",
    title: "已暂停",
    text: "账户暂停期间不能继续发起受保护请求，可由管理员重新激活。",
  },
] as const;

export function MatchesPage({ onOpenMatch, prediction }: MatchesPageProps) {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Matches</p>
          <h1>世界杯比赛数据面板</h1>
          <p className="muted">
            覆盖 /matches 路由，展示赛前情报、概率预测入口和 token 计量提醒。
          </p>
        </div>
      </section>

      <section className="coverage-grid">
        <article className="info-panel">
          <div className="section-heading">
            <p className="eyebrow">Featured Match</p>
            <h2>
              {prediction
                ? `${prediction.homeTeam.name} vs ${prediction.awayTeam.name}`
                : "加载比赛 stub..."}
            </h2>
          </div>
          <p className="muted">
            使用 Elo、xG、近期状态和 RAG 引用构建概率预测，不承诺确定赛果。
          </p>
          <button className="primary-button" onClick={onOpenMatch} type="button">
            <BarChart3 aria-hidden="true" size={18} />
            查看比赛详情
          </button>
        </article>
        <article className="info-panel">
          <div className="section-heading">
            <p className="eyebrow">Coverage</p>
            <h2>路由覆盖</h2>
          </div>
          <ul className="plain-list">
            <li>/matches/[matchId] 比赛详情</li>
            <li>/teams/[teamId] 球队画像</li>
            <li>/players/[playerId] 球员画像</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

export function EntityDetailPage({ entityId, prediction, type }: DetailPageProps) {
  const isTeam = type === "team";
  const title = isTeam ? "球队数据画像" : "球员赛前画像";
  const fallbackId = isTeam ? prediction?.homeTeam.teamId : "player_010";

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">{isTeam ? "Team Detail" : "Player Detail"}</p>
          <h1>{title}</h1>
          <p className="muted">
            当前对象：{entityId ?? fallbackId ?? "loading"}。页面用于承载赛前情报、风险因素、
            RAG 引用和模型依据。
          </p>
        </div>
      </section>

      <section className="coverage-grid">
        <article className="info-panel">
          <Users aria-hidden="true" size={24} />
          <h2>情报摘要</h2>
          <p className="muted">
            近况、阵容可用性、战术匹配和伤停信息会影响概率预测结果。
          </p>
        </article>
        <article className="info-panel">
          <AlertTriangle aria-hidden="true" size={24} />
          <h2>不确定性</h2>
          <p className="muted">
            模型输出需要结合赛前最新情报复核，展示为数据分析结论而非确定承诺。
          </p>
        </article>
      </section>
    </div>
  );
}

export function SimulatorPage({ mode }: { mode: "group" | "knockout" }) {
  const isGroup = mode === "group";

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">{isGroup ? "Group Simulator" : "Knockout Simulator"}</p>
          <h1>{isGroup ? "小组赛情景模拟" : "淘汰赛晋级模拟"}</h1>
          <p className="muted">
            用概率预测和风险因素做赛前情景推演，所有结果都保留不确定性说明。
          </p>
        </div>
      </section>

      <section className="coverage-grid">
        {["赛前情报", "模型依据", "风险因素"].map((label) => (
          <article className="info-panel" key={label}>
            <ShieldCheck aria-hidden="true" size={24} />
            <h2>{label}</h2>
            <p className="muted">等待后端模拟接口接入，当前为 QA 路由覆盖 stub。</p>
          </article>
        ))}
      </section>
    </div>
  );
}

export function ReportsPage({ prediction }: { prediction: MatchPredictionStub | null }) {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>分析报告中心</h1>
          <p className="muted">
            报告聚合概率预测、RAG 引用、模型依据和风险因素，访问前需要账户通过审批。
          </p>
        </div>
      </section>

      <section className="info-panel">
        <FileText aria-hidden="true" size={24} />
        <h2>赛前报告预览</h2>
        <p className="muted">
          {prediction
            ? `${prediction.homeTeam.name} vs ${prediction.awayTeam.name}，主胜 ${formatPercent(
                prediction.probabilities.homeWin,
              )}，平局 ${formatPercent(prediction.probabilities.draw)}，客胜 ${formatPercent(
                prediction.probabilities.awayWin,
              )}。`
            : "加载报告 stub..."}
        </p>
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
          <h1>MVP 访问状态覆盖</h1>
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
          <h2>当前账户</h2>
          <p className="muted">
            {accountStatus?.message ?? "正在读取账户审批状态..."}
          </p>
        </article>
        <article className="info-panel">
          <WalletCards aria-hidden="true" size={24} />
          <h2>token 状态</h2>
          <p className="muted">
            当前余额 {tokenSummary?.balanceTokens.toLocaleString() ?? "--"}。低余额提醒：
            {tokenSummary?.contactAdminMessage ?? "联系管理员调整 token 配额。"}
          </p>
          <p className="muted">额度不足：本次请求不会执行，请联系管理员授予或调整 token。</p>
        </article>
      </section>
    </div>
  );
}

export function AccountPage({ accountStatus, tokenSummary }: AccessPageProps) {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>账户与 token 台账</h1>
          <p className="muted">
            token 余额必须由后台 ledger 记录驱动，不能在前端或管理界面直接覆盖。
          </p>
        </div>
      </section>

      <section className="coverage-grid">
        <article className="info-panel">
          <h2>审批状态</h2>
          <span className={`status-pill status-pill--${accountStatus?.status ?? "pending_approval"}`}>
            {accountStatus?.status ?? "loading"}
          </span>
          <p className="muted">{accountStatus?.message ?? "正在读取账户状态..."}</p>
        </article>
        <article className="info-panel">
          <h2>token 台账</h2>
          <dl className="definition-list">
            <div>
              <dt>余额</dt>
              <dd>{tokenSummary?.balanceTokens.toLocaleString() ?? "--"}</dd>
            </div>
            <div>
              <dt>低余额阈值</dt>
              <dd>{tokenSummary?.lowBalanceThreshold.toLocaleString() ?? "--"}</dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}
