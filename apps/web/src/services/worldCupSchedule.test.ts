import { describe, expect, it } from "vitest";
import { createPredictionFromSchedule, getTournamentSchedule } from "./worldCupSchedule";

describe("world cup schedule stub", () => {
  it("covers every match module from June 13 to July 20", async () => {
    const schedule = await getTournamentSchedule();

    expect(schedule).toHaveLength(104);
    expect(schedule[0]?.kickoffAt).toContain("2026-06-12");
    expect(schedule.at(-1)?.kickoffAt).toContain("2026-07-20");
    expect(schedule.every((match) => match.homeTeam && match.awayTeam)).toBe(true);
    expect(schedule.every((match) => match.region && match.venue)).toBe(true);
  });

  it("generates a prediction preview for a selected match", async () => {
    const [firstMatch] = await getTournamentSchedule();
    const prediction = createPredictionFromSchedule(firstMatch);

    expect(prediction.matchId).toBe(firstMatch.matchId);
    expect(prediction.homeTeam.name).toBe(firstMatch.homeTeam);
    expect(prediction.awayTeam.name).toBe(firstMatch.awayTeam);
    expect(prediction.probabilities.homeWin).toBeGreaterThan(0);
    expect(prediction.explanations.join(" ")).toContain("不确定性");
  });
});
