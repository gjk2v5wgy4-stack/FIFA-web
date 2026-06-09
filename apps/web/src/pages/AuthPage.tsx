import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";

interface AuthPageProps {
  mode: "login" | "register";
}

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";

  return (
    <div className="auth-layout">
      <section className="auth-panel">
        <p className="eyebrow">{isRegister ? "Create Account" : "Sign In"}</p>
        <h1>{isRegister ? "申请访问分析平台" : "登录赛前分析工作台"}</h1>
        <p className="muted">
          {isRegister
            ? "注册后账号将等待管理员审批，审批通过并授予 token 后可使用受保护功能。"
            : "当前为前端布局 stub，不连接真实认证接口。"}
        </p>

        <form className="form-stack">
          {isRegister && (
            <label className="field-label">
              <span>显示名称</span>
              <div className="input-shell">
                <UserRound aria-hidden="true" size={18} />
                <input placeholder="赛前分析用户" type="text" />
              </div>
            </label>
          )}

          <label className="field-label">
            <span>邮箱</span>
            <div className="input-shell">
              <Mail aria-hidden="true" size={18} />
              <input placeholder="analyst@example.com" type="email" />
            </div>
          </label>

          <label className="field-label">
            <span>密码</span>
            <div className="input-shell">
              <LockKeyhole aria-hidden="true" size={18} />
              <input placeholder="输入密码" type="password" />
            </div>
          </label>

          <button className="primary-button" type="button">
            {isRegister ? "提交审批申请" : "进入工作台"}
            <ArrowRight aria-hidden="true" size={18} />
          </button>
        </form>
      </section>

      <aside className="auth-side">
        <h2>访问规则</h2>
        <ul className="check-list">
          <li>新用户默认 pending_approval</li>
          <li>管理员审批后授予 token 配额</li>
          <li>预测、RAG、报告接口按次计量</li>
          <li>余额提醒只引导联系管理员</li>
        </ul>
      </aside>
    </div>
  );
}
