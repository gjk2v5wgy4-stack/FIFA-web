import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { AdminPage } from "./pages/AdminPage";
import { AccountPage } from "./pages/AccountPage";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { PredictionPage } from "./pages/PredictionPage";
import {
  AccessPage,
  EntityDetailPage,
  MatchesPage,
  ReportsPage,
  SimulatorPage,
} from "./pages/RouteCoveragePages";
import { routeFromLocation, routeToPath, type RouteId, type RouteMatch } from "./routes";
import {
  getAccountStatus,
  getAdminUsers,
  getMatchPrediction,
  getTodayMatches,
  getTokenSummary,
  type AccountStatusSummary,
  type AdminUserStub,
  type MatchPredictionStub,
  type TodayMatchStub,
  type TokenSummary,
} from "./services/apiStubs";

export function App() {
  const [route, setRoute] = useState<RouteMatch>(() =>
    routeFromLocation(window.location.pathname, window.location.hash),
  );
  const [accountStatus, setAccountStatus] = useState<AccountStatusSummary | null>(null);
  const [tokenSummary, setTokenSummary] = useState<TokenSummary | null>(null);
  const [prediction, setPrediction] = useState<MatchPredictionStub | null>(null);
  const [todayMatches, setTodayMatches] = useState<TodayMatchStub[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserStub[]>([]);

  useEffect(() => {
    const handleLocationChange = () =>
      setRoute(routeFromLocation(window.location.pathname, window.location.hash));

    const handleHashChange = () => {
      const nextRoute = routeFromLocation(window.location.pathname, window.location.hash);
      window.history.replaceState({}, "", routeToPath(nextRoute.id));
      setRoute(nextRoute);
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      getAccountStatus(),
      getTokenSummary(),
      getMatchPrediction("match_001"),
      getTodayMatches(),
      getAdminUsers(),
    ]).then(([nextStatus, nextTokens, nextPrediction, nextMatches, nextUsers]) => {
      if (!isCurrent) {
        return;
      }

      setAccountStatus(nextStatus);
      setTokenSummary(nextTokens);
      setPrediction(nextPrediction);
      setTodayMatches(nextMatches);
      setAdminUsers(nextUsers);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const navigate = (nextRoute: RouteId) => {
    const nextPath = routeToPath(nextRoute);
    window.history.pushState({}, "", nextPath);
    setRoute(routeFromLocation(nextPath, ""));
  };

  return (
    <AppShell activeRoute={route.id} onNavigate={navigate}>
      {route.id === "home" && (
        <HomePage
          onOpenLogin={() => navigate("login")}
          onOpenRegister={() => navigate("register")}
          prediction={prediction}
          todayMatches={todayMatches}
        />
      )}
      {route.id === "matches" && (
        <MatchesPage onOpenMatch={() => navigate("matchDetail")} prediction={prediction} />
      )}
      {route.id === "matchDetail" && <PredictionPage prediction={prediction} />}
      {route.id === "teamDetail" && (
        <EntityDetailPage
          entityId={route.params.teamId}
          prediction={prediction}
          type="team"
        />
      )}
      {route.id === "playerDetail" && (
        <EntityDetailPage
          entityId={route.params.playerId}
          prediction={prediction}
          type="player"
        />
      )}
      {route.id === "groupSimulator" && <SimulatorPage mode="group" />}
      {route.id === "knockoutSimulator" && <SimulatorPage mode="knockout" />}
      {route.id === "reports" && <ReportsPage prediction={prediction} />}
      {route.id === "access" && (
        <AccessPage accountStatus={accountStatus} tokenSummary={tokenSummary} />
      )}
      {route.id === "account" && (
        <AccountPage accountStatus={accountStatus} tokenSummary={tokenSummary} />
      )}
      {route.id === "login" && <AuthPage mode="login" />}
      {route.id === "register" && <AuthPage mode="register" />}
      {route.id === "admin" && <AdminPage users={adminUsers} />}
    </AppShell>
  );
}
