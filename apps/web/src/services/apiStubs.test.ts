import { describe, expect, it } from "vitest";
import {
  getAccountStatus,
  getAdminUsers,
  getMatchPrediction,
  getTodayMatches,
  getTokenSummary,
  submitLogin,
  submitRegistration,
} from "./apiStubs";

describe("frontend API stubs", () => {
  it("keeps registration in the pending approval flow", async () => {
    const result = await submitRegistration({
      email: "analyst@example.com",
      password: "secure-password",
      displayName: "赛前分析用户",
    });

    expect(result.user.status).toBe("pending_approval");
    expect(result.nextStep).toContain("管理员审批");
  });

  it("returns approved demo login and token summary with admin contact guidance", async () => {
    const login = await submitLogin({
      email: "demo@example.com",
      password: "secure-password",
    });
    const tokenSummary = await getTokenSummary(login.user.userId);

    expect(login.user.status).toBe("approved");
    expect(tokenSummary.contactAdminMessage).toContain("联系管理员");
    expect(tokenSummary.lowBalanceThreshold).toBeGreaterThan(0);
  });

  it("matches prediction contract fields for protected UI previews", async () => {
    const prediction = await getMatchPrediction("match_001");

    expect(prediction.matchId).toBe("match_001");
    expect(prediction.probabilities.homeWin).toBeGreaterThan(0);
    expect(prediction.usage.tokensCharged).toBeGreaterThan(0);
    expect(prediction.explanations.join(" ")).toContain("不确定性");
  });

  it("exposes admin pending approvals and token actions as placeholders", async () => {
    const status = await getAccountStatus("user_pending");
    const users = await getAdminUsers();

    expect(status.canUseProtectedApis).toBe(false);
    expect(users.some((user) => user.status === "pending_approval")).toBe(true);
    expect(users[0].availableActions).toContain("approve_user");
    expect(users[0].tokenBalance).toBe(0);
  });

  it("returns today schedule rows using the checked date", async () => {
    const matches = await getTodayMatches(new Date(2026, 5, 9, 8));

    expect(matches).toHaveLength(3);
    expect(matches[0].homeTeam.code).toBe("MEX");
    expect(matches[0].awayTeam.code).toBe("RSA");
    expect(matches[0].kickoffAt.startsWith("2026-06-09")).toBe(true);
  });
});
