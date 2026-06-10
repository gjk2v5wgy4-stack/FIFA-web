import {
  BarChart3,
  CheckCircle2,
  Home,
  Layers,
  ListChecks,
  LogIn,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import type { RouteId } from "../routes";
import { AiPetAssistant } from "./AiPetAssistant";

interface AppShellProps {
  activeRoute: RouteId;
  children: ReactNode;
  onNavigate: (route: RouteId) => void;
}

const navItems: Array<{
  route: RouteId;
  label: string;
  icon: typeof Home;
}> = [
  { route: "home", label: "首页", icon: Home },
  { route: "matches", label: "比赛", icon: ListChecks },
  { route: "groupSimulator", label: "模拟器", icon: Layers },
  { route: "access", label: "访问", icon: ShieldCheck },
  { route: "account", label: "账户", icon: UserCircle },
  { route: "matchDetail", label: "概率预测", icon: BarChart3 },
  { route: "admin", label: "后台", icon: ShieldCheck },
];

export function AppShell({
  activeRoute,
  children,
  onNavigate,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <div className="brand-mark" aria-label="World Cup AI Prediction">
          <span className="brand-mark__icon">FIFA</span>
          <span>
            <strong>2026世界杯预测ragAI</strong>
            <small>赛前数据智能</small>
          </span>
        </div>
        <div className="nav-section-title">功能区</div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.route;

            return (
              <button
                className={`nav-item${isActive ? " nav-item--active" : ""}`}
                key={item.route}
                onClick={() => onNavigate(item.route)}
                type="button"
              >
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="access-note">
          <CheckCircle2 aria-hidden="true" size={18} />
          <span>管理员审批 + token 配额模式</span>
        </div>
      </aside>
      <main className="main-view">
        <header className="topbar" aria-label="用户操作">
          <div className="topbar__context">
            <span>前端预览</span>
            <strong>审批访问模式</strong>
          </div>
          <button
            className={`topbar-login${activeRoute === "login" ? " topbar-login--active" : ""}`}
            onClick={() => onNavigate("login")}
            type="button"
          >
            <LogIn aria-hidden="true" size={18} />
            登录
          </button>
        </header>
        {children}
      </main>
      <AiPetAssistant />
    </div>
  );
}
