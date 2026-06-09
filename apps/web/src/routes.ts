export type RouteId = "home" | "login" | "register" | "prediction" | "admin";

const routeIds: RouteId[] = ["home", "login", "register", "prediction", "admin"];

export function routeFromHash(hash: string): RouteId {
  const normalized = hash.replace(/^#\/?/, "");

  if (routeIds.includes(normalized as RouteId)) {
    return normalized as RouteId;
  }

  return "home";
}

export function routeToHash(route: RouteId) {
  return route === "home" ? "#/" : `#/${route}`;
}
