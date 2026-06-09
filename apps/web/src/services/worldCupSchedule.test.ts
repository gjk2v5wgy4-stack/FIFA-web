import { describe, expect, it } from "vitest";
import { getTournamentSchedule } from "./worldCupSchedule";

describe("world cup schedule stub", () => {
  it("covers every match module from June 13 to July 20", async () => {
    const schedule = await getTournamentSchedule();

    expect(schedule).toHaveLength(100);
    expect(schedule[0]?.kickoffAt).toContain("2026-06-13");
    expect(schedule.at(-1)?.kickoffAt).toContain("2026-07-20");
    expect(schedule.every((match) => match.homeTeam && match.awayTeam)).toBe(true);
    expect(schedule.every((match) => match.region && match.venue)).toBe(true);
  });
});
