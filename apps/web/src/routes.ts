export type RouteId =
  | "home"
  | "matches"
  | "matchDetail"
  | "teamDetail"
  | "playerDetail"
  | "groupSimulator"
  | "knockoutSimulator"
  | "access"
  | "account"
  | "admin"
  | "login"
  | "register";

export interface RouteMatch {
  id: RouteId;
  params: {
    matchId?: string;
    playerId?: string;
    teamId?: string;
  };
}

const staticPathRoutes: Record<string, RouteId> = {
  "/": "home",
  "/matches": "matches",
  "/simulator/group": "groupSimulator",
  "/simulator/knockout": "knockoutSimulator",
  "/reports": "matchDetail",
  "/access": "access",
  "/account": "account",
  "/admin": "admin",
  "/login": "login",
  "/register": "register",
};

const canonicalPaths: Record<RouteId, string> = {
  home: "/",
  matches: "/matches",
  matchDetail: "/matches/match_001",
  teamDetail: "/teams/team_usa",
  playerDetail: "/players/player_010",
  groupSimulator: "/simulator/group",
  knockoutSimulator: "/simulator/knockout",
  access: "/access",
  account: "/account",
  admin: "/admin",
  login: "/login",
  register: "/register",
};

const legacyHashRoutes: Record<string, string> = {
  prediction: "/matches/match_001",
};

function normalizePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

function routeFromPath(pathname: string): RouteMatch {
  const normalized = normalizePath(pathname);
  const staticRoute = staticPathRoutes[normalized];

  if (staticRoute) {
    return { id: staticRoute, params: {} };
  }

  const [, section, entityId] = normalized.split("/");

  if (section === "matches" && entityId) {
    return { id: "matchDetail", params: { matchId: entityId } };
  }

  if (section === "teams" && entityId) {
    return { id: "teamDetail", params: { teamId: entityId } };
  }

  if (section === "players" && entityId) {
    return { id: "playerDetail", params: { playerId: entityId } };
  }

  return { id: "home", params: {} };
}

export function routeFromLocation(pathname: string, hash: string): RouteMatch {
  const normalizedHash = hash.replace(/^#\/?/, "");

  if (normalizedHash) {
    const hashPath = legacyHashRoutes[normalizedHash] ?? `/${normalizedHash}`;
    return routeFromPath(hashPath);
  }

  return routeFromPath(pathname);
}

export function routeFromHash(hash: string): RouteId {
  return routeFromLocation("/", hash).id;
}

export function routeToPath(route: RouteId) {
  return canonicalPaths[route];
}

export function routeToHash(route: RouteId) {
  return `#${routeToPath(route)}`;
}
