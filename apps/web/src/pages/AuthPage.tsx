import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { type FormEvent, useState } from "react";
import { submitLogin, submitRegistration } from "../services/apiClient";

interface AuthPageProps {
  mode: "login" | "register";
  onAuthenticated?: () => void;
}

export function AuthPage({ mode, onAuthenticated }: AuthPageProps) {
  const isRegister = mode === "register";
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(isRegister ? "" : "admin123");
  const [password, setPassword] = useState(isRegister ? "" : "admin123");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    try {
      if (isRegister) {
        const result = await submitRegistration({
          email,
          password,
          displayName: displayName || email,
        });
        setMessage(`${result.user.status}: ${result.nextStep}`);
      } else {
        const result = await submitLogin({ email, password });
        setMessage(`${result.user.displayName} 已登录，账号状态：${result.user.status}`);
        onAuthenticated?.();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "请求失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="auth-panel">
        <p className="eyebrow">{isRegister ? "Create Account" : "Sign In"}</p>
        <h1>{isRegister ? "申请访问分析平台" : "登录赛前分析工作台"}</h1>
        <p className="muted">
          {isRegister
            ? "注册会真实提交到后端，账号默认为 pending_approval，需管理员审批并授予 token 后才能使用受保护功能。"
            : "登录表单连接真实认证接口。管理员账号可使用 admin123 / admin123。"}
        </p>

        <form className="form-stack" onSubmit={handleSubmit}>
          {isRegister && (
            <label className="field-label">
              <span>显示名称</span>
              <div className="input-shell">
                <UserRound aria-hidden="true" size={18} />
                <input
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="赛前分析用户"
                  type="text"
                  value={displayName}
                />
              </div>
            </label>
          )}

          <label className="field-label">
            <span>{isRegister ? "邮箱" : "账号"}</span>
            <div className="input-shell">
              <Mail aria-hidden="true" size={18} />
              <input
                onChange={(event) => setEmail(event.target.value)}
                placeholder={isRegister ? "analyst@example.com" : "admin123"}
                required
                type={isRegister ? "email" : "text"}
                value={email}
              />
            </div>
          </label>

          <label className="field-label">
            <span>密码</span>
            <div className="input-shell">
              <LockKeyhole aria-hidden="true" size={18} />
              <input
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="输入密码"
                required
                type="password"
                value={password}
              />
            </div>
          </label>

          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "提交中..." : isRegister ? "提交审批申请" : "进入工作台"}
            <ArrowRight aria-hidden="true" size={18} />
          </button>
          {message && <p className="muted">{message}</p>}
        </form>
      </section>

    </div>
  );
}
