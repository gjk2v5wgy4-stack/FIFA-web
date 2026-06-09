import { describe, expect, it } from "vitest";
import { routeFromLocation, routeToPath } from "./routes";

describe("frontend route coverage", () => {
  it.each([
    ["/", "home"],
    ["/matches", "matches"],
    ["/matches/match_001", "matchDetail"],
    ["/teams/team_usa", "teamDetail"],
    ["/players/player_010", "playerDetail"],
    ["/simulator/group", "groupSimulator"],
    ["/simulator/knockout", "knockoutSimulator"],
    ["/reports", "reports"],
    ["/access", "access"],
    ["/account", "account"],
    ["/admin", "admin"],
  ] as const)("maps %s to %s", (pathname, expectedRoute) => {
    expect(routeFromLocation(pathname, "").id).toBe(expectedRoute);
  });

  it("extracts route params for required detail pages", () => {
    expect(routeFromLocation("/matches/match_001", "").params.matchId).toBe("match_001");
    expect(routeFromLocation("/teams/team_usa", "").params.teamId).toBe("team_usa");
    expect(routeFromLocation("/players/player_010", "").params.playerId).toBe("player_010");
  });

  it("keeps legacy hash navigation mapped to canonical routes", () => {
    expect(routeFromLocation("/", "#/prediction").id).toBe("matchDetail");
    expect(routeFromLocation("/", "#/register").id).toBe("register");
    expect(routeToPath("groupSimulator")).toBe("/simulator/group");
  });
});
