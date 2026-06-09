import { Clock3, MessageSquareText, ShieldCheck, WalletCards } from "lucide-react";
import type { AccountStatusSummary, TokenSummary } from "../services/apiStubs";

interface AccountPageProps {
  accountStatus: AccountStatusSummary | null;
  tokenSummary: TokenSummary | null;
}

export function AccountPage({ accountStatus, tokenSummary }: AccountPageProps) {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>账户与 token 台账</h1>
          <p className="muted">
            账户状态、token 余额、最近扣减和低余额提醒统一归入账户栏展示。token
            余额必须由后端 ledger 记录驱动，不能在前端或管理界面直接覆盖。
          </p>
        </div>
      </section>

      <section className="metric-grid" aria-label="账户与 token 状态">
        <article className="metric-card">
          <ShieldCheck aria-hidden="true" size={22} />
          <span>账户状态</span>
          <strong>{accountStatus?.status ?? "loading"}</strong>
        </article>
        <article className="metric-card">
          <WalletCards aria-hidden="true" size={22} />
          <span>Token 余额</span>
          <strong>{tokenSummary?.balanceTokens.toLocaleString() ?? "--"}</strong>
        </article>
        <article className="metric-card">
          <Clock3 aria-hidden="true" size={22} />
          <span>最近扣减</span>
          <strong>{tokenSummary?.ledger.at(-1)?.amountTokens ?? "--"}</strong>
        </article>
        <article className="metric-card">
          <MessageSquareText aria-hidden="true" size={22} />
          <span>低余额提醒</span>
          <strong>{tokenSummary?.lowBalance ? "联系管理员" : "正常"}</strong>
        </article>
      </section>

      <section className="coverage-grid">
        <article className="info-panel">
          <h2>审批状态</h2>
          <span
            className={`status-pill status-pill--${
              accountStatus?.status ?? "pending_approval"
            }`}
          >
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
            <div>
              <dt>余额不足处理</dt>
              <dd>联系管理员授予或调整 token</dd>
            </div>
          </dl>
        </article>
      </section>
    </div>
  );
}
