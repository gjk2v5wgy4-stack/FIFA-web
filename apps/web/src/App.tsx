import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { AdminPage } from "./pages/AdminPage";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { PredictionPage } from "./pages/PredictionPage";
import { routeFromHash, routeToHash, type RouteId } from "./routes";
import {
  getAccountStatus,
  getAdminUsers,
  getMatchPrediction,
  getTokenSummary,
  type AccountStatusSummary,
  type AdminUserStub,
  type MatchPredictionStub,
  type TokenSummary,
} from "./services/apiStubs";

export function App() {
  const [route, setRoute] = useState<RouteId>(() => routeFromHash(window.location.hash));
  const [accountStatus, setAccountStatus] = useState<AccountStatusSummary | null>(null);
  const [tokenSummary, setTokenSummary] = useState<TokenSummary | null>(null);
  const [prediction, setPrediction] = useState<MatchPredictionStub | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUserStub[]>([]);

  useEffect(() => {
    const handleHashChange = () => setRoute(routeFromHash(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      getAccountStatus(),
      getTokenSummary(),
      getMatchPrediction("match_001"),
      getAdminUsers(),
    ]).then(([nextStatus, nextTokens, nextPrediction, nextUsers]) => {
      if (!isCurrent) {
        return;
      }

      setAccountStatus(nextStatus);
      setTokenSummary(nextTokens);
      setPrediction(nextPrediction);
      setAdminUsers(nextUsers);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const navigate = (nextRoute: RouteId) => {
    window.location.hash = routeToHash(nextRoute);
    setRoute(nextRoute);
  };

  return (
    <AppShell activeRoute={route} onNavigate={navigate}>
      {route === "home" && (
        <HomePage
          accountStatus={accountStatus}
          onOpenPrediction={() => navigate("prediction")}
          prediction={prediction}
          tokenSummary={tokenSummary}
        />
      )}
      {route === "login" && <AuthPage mode="login" />}
      {route === "register" && <AuthPage mode="register" />}
      {route === "prediction" && <PredictionPage prediction={prediction} />}
      {route === "admin" && <AdminPage users={adminUsers} />}
    </AppShell>
  );
}
