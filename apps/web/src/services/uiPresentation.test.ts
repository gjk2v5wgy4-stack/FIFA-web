import { describe, expect, it } from "vitest";
import {
  buildOutcomePresentation,
  buildWeatherMetricPresentation,
} from "./uiPresentation";

describe("UI presentation helpers", () => {
  it("assigns semantic football tones and progress widths to outcome probabilities", () => {
    const rows = buildOutcomePresentation({
      homeWin: 0.47,
      draw: 0.27,
      awayWin: 0.26,
    });

    expect(rows.map((row) => row.id)).toEqual(["homeWin", "draw", "awayWin"]);
    expect(rows.map((row) => row.tone)).toEqual(["home", "draw", "away"]);
    expect(rows.map((row) => row.percentLabel)).toEqual(["47%", "27%", "26%"]);
    expect(rows.map((row) => row.meterWidth)).toEqual(["47%", "27%", "26%"]);
    expect(rows.find((row) => row.isLeader)?.id).toBe("homeWin");
  });

  it("keeps weather details split into icon-ready metrics", () => {
    const metrics = buildWeatherMetricPresentation({
      condition: "cloudy",
      temperatureC: 27,
      humidityPct: 61,
      windKph: 13,
      updatedAt: "2026-06-10T00:00:00.000Z",
      nextUpdateAt: "2026-06-10T01:00:00.000Z",
    });

    expect(metrics).toEqual([
      { id: "condition", icon: "condition", label: "cloudy", value: "27°C" },
      { id: "humidity", icon: "humidity", label: "Humidity", value: "61%" },
      { id: "wind", icon: "wind", label: "Wind", value: "13km/h" },
    ]);
  });
});
