import { BadgePlus, Ban, Check, RotateCcw, ShieldAlert, X } from "lucide-react";
import type { AdminAction, AdminUserStub } from "../services/apiStubs";

interface AdminPageProps {
  users: AdminUserStub[];
}

const actionMeta: Record<AdminAction, { label: string; icon: typeof Check }> = {
  approve_user: { label: "批准", icon: Check },
  reject_user: { label: "拒绝", icon: X },
  suspend_user: { label: "暂停", icon: Ban },
  reactivate_user: { label: "恢复", icon: RotateCcw },
  grant_tokens: { label: "授予 token", icon: BadgePlus },
  adjust_tokens: { label: "调整 token", icon: ShieldAlert },
  revoke_tokens: { label: "撤回 token", icon: Ban },
};

export function AdminPage({ users }: AdminPageProps) {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin Stub</p>
          <h1>管理员审批与 token 配额</h1>
          <p className="muted">
            当前只展示 T5 管理端接口占位，不修改 token 余额；真实逻辑必须由后端 ledger 记录驱动。
          </p>
        </div>
      </section>

      <section className="admin-table-shell">
        <div className="admin-table" role="table" aria-label="用户审批列表">
          <div className="admin-row admin-row--head" role="row">
            <span role="columnheader">用户</span>
            <span role="columnheader">状态</span>
            <span role="columnheader">token 余额</span>
            <span role="columnheader">可用操作</span>
          </div>
          {users.map((user) => (
            <div className="admin-row" key={user.userId} role="row">
              <span className="user-cell" role="cell">
                <strong>{user.displayName}</strong>
                <small>{user.email}</small>
              </span>
              <span role="cell">
                <span className={`status-pill status-pill--${user.status}`}>
                  {user.status}
                </span>
              </span>
              <span role="cell">{user.tokenBalance.toLocaleString()}</span>
              <span className="action-cluster" role="cell">
                {user.availableActions.map((action) => {
                  const meta = actionMeta[action];
                  const Icon = meta.icon;

                  return (
                    <button className="secondary-button" key={action} type="button">
                      <Icon aria-hidden="true" size={16} />
                      {meta.label}
                    </button>
                  );
                })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
