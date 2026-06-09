import {
  BarChart3,
  CheckCircle2,
  Home,
  LogIn,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { ReactNode } from "react";
import type { RouteId } from "../routes";

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
  { route: "login", label: "登录", icon: LogIn },
  { route: "register", label: "注册", icon: UserPlus },
  { route: "prediction", label: "预测结果", icon: BarChart3 },
  { route: "admin", label: "审批后台", icon: ShieldCheck },
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
          <span className="brand-mark__icon">AI</span>
          <span>
            <strong>WorldCup AI</strong>
            <small>Football intelligence</small>
          </span>
        </div>
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
      <main className="main-view">{children}</main>
    </div>
  );
}
