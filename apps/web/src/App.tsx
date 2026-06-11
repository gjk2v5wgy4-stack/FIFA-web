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
  SimulatorPage,
} from "./pages/RouteCoveragePages";
import { routeFromLocation, routeToPath, type RouteId, type RouteMatch } from "./routes";
import {
  getAccountStatus,
  getAdminUsers,
  getMatchPrediction,
  getStoredAuthSession,
  getTournamentSchedule,
  getTokenSummary,
  type AuthSession,
} from "./services/apiClient";
import {
  type AccountStatusSummary,
  type AdminUserStub,
  type MatchPredictionStub,
  type TokenSummary,
} from "./services/apiStubs";
import type { TournamentMatchStub } from "./services/worldCupSchedule";

export function App() {
  const [route, setRoute] = useState<RouteMatch>(() =>
    routeFromLocation(window.location.pathname, window.location.hash),
  );
  const [authSession, setAuthSession] = useState<AuthSession | null>(() =>
    getStoredAuthSession(),
  );
  const [accountStatus, setAccountStatus] = useState<AccountStatusSummary | null>(null);
  const [tokenSummary, setTokenSummary] = useState<TokenSummary | null>(null);
  const [prediction, setPrediction] = useState<MatchPredictionStub | null>(null);
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatchStub[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserStub[]>([]);
  const [activeMatchId, setActiveMatchId] = useState(
    () => route.params.matchId ?? "match_001",
  );

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
    if (!authSession) {
      setAccountStatus(null);
      setTokenSummary(null);
      setTournamentMatches([]);
      setAdminUsers([]);
      setPrediction(null);
      return;
    }

    let isCurrent = true;

    Promise.all([
      getAccountStatus(),
      getTokenSummary(),
      getTournamentSchedule(),
      getAdminUsers(),
    ]).then(([nextStatus, nextTokens, nextMatches, nextUsers]) => {
      if (!isCurrent) {
        return;
      }

      setAccountStatus(nextStatus);
      setTokenSummary(nextTokens);
      setTournamentMatches(nextMatches);
      setAdminUsers(nextUsers);
      if (!route.params.matchId && nextMatches[0]) {
        setActiveMatchId(nextMatches[0].matchId);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [authSession, route.params.matchId]);

  useEffect(() => {
    if (route.params.matchId && route.params.matchId !== activeMatchId) {
      setActiveMatchId(route.params.matchId);
    }
  }, [activeMatchId, route.params.matchId]);

  useEffect(() => {
    if (!authSession) {
      return;
    }

    let isCurrent = true;
    const activeMatch = tournamentMatches.find((match) => match.matchId === activeMatchId);

    getMatchPrediction(activeMatchId, activeMatch).then((nextPrediction) => {
      if (isCurrent) {
        setPrediction(nextPrediction);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [activeMatchId, authSession, tournamentMatches]);

  const handleAuthenticated = () => {
    setAuthSession(getStoredAuthSession());
    const nextPath = "/";
    window.history.replaceState({}, "", nextPath);
    setRoute(routeFromLocation(nextPath, ""));
  };

  const navigate = (nextRoute: RouteId) => {
    const nextPath = routeToPath(nextRoute);
    window.history.pushState({}, "", nextPath);
    setRoute(routeFromLocation(nextPath, ""));
  };

  const openMatch = (matchId: string) => {
    const nextPath = `/matches/${matchId}`;
    window.history.pushState({}, "", nextPath);
    setActiveMatchId(matchId);
    setRoute(routeFromLocation(nextPath, ""));
  };

  if (!authSession) {
    return (
      <AuthPage
        mode={route.id === "register" ? "register" : "login"}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  return (
    <AppShell activeRoute={route.id} onNavigate={navigate}>
      {route.id === "home" && (
        <HomePage
          activeMatchId={activeMatchId}
          onSelectMatch={setActiveMatchId}
          prediction={prediction}
          tournamentMatches={tournamentMatches}
        />
      )}
      {route.id === "matches" && (
        <MatchesPage
          matches={tournamentMatches}
          onOpenMatch={openMatch}
          prediction={prediction}
        />
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
      {route.id === "access" && (
        <AccessPage accountStatus={accountStatus} tokenSummary={tokenSummary} />
      )}
      {route.id === "account" && (
        <AccountPage accountStatus={accountStatus} tokenSummary={tokenSummary} />
      )}
      {route.id === "login" && <AuthPage mode="login" onAuthenticated={handleAuthenticated} />}
      {route.id === "register" && (
        <AuthPage mode="register" onAuthenticated={handleAuthenticated} />
      )}
      {route.id === "admin" && <AdminPage users={adminUsers} />}
    </AppShell>
  );
}
