import { describe, expect, it } from "vitest";
import { createMatchWeatherForecast } from "./weatherForecast";
import { getTournamentSchedule } from "./worldCupSchedule";

describe("match weather forecast", () => {
  it("generates hourly weather forecast for a match venue", async () => {
    const [match] = await getTournamentSchedule();
    const refreshedAt = new Date("2026-06-10T02:25:00+08:00");
    const weather = createMatchWeatherForecast(match, refreshedAt);

    expect(weather.condition).toBeTruthy();
    expect(weather.temperatureC).toBeGreaterThan(0);
    expect(weather.humidityPct).toBeGreaterThan(0);
    expect(weather.windKph).toBeGreaterThan(0);
    expect(weather.updatedAt).toBe(refreshedAt.toISOString());
    expect(weather.nextUpdateAt).toBe(new Date("2026-06-10T03:00:00+08:00").toISOString());
  });
});
