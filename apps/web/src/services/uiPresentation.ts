import type { MatchPredictionStub } from "./apiStubs";
import type { MatchWeatherForecast } from "./weatherForecast";

export type OutcomePresentationId = "homeWin" | "draw" | "awayWin";
export type OutcomePresentationTone = "home" | "draw" | "away";

export interface OutcomePresentationRow {
  id: OutcomePresentationId;
  isLeader: boolean;
  meterWidth: string;
  percentLabel: string;
  tone: OutcomePresentationTone;
  value: number;
}

export interface WeatherMetricPresentation {
  id: "condition" | "humidity" | "wind";
  icon: "condition" | "humidity" | "wind";
  label: string;
  value: string;
}

const outcomeOrder: Array<{
  id: OutcomePresentationId;
  probabilityKey: keyof MatchPredictionStub["probabilities"];
  tone: OutcomePresentationTone;
}> = [
  { id: "homeWin", probabilityKey: "homeWin", tone: "home" },
  { id: "draw", probabilityKey: "draw", tone: "draw" },
  { id: "awayWin", probabilityKey: "awayWin", tone: "away" },
];

export function formatDisplayPercent(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const boundedValue = Math.max(0, Math.min(1, safeValue));

  return `${Math.round(boundedValue * 100)}%`;
}

export function buildOutcomePresentation(
  probabilities: MatchPredictionStub["probabilities"],
): OutcomePresentationRow[] {
  const leader = outcomeOrder.reduce((currentLeader, row) =>
    probabilities[row.probabilityKey] > probabilities[currentLeader.probabilityKey]
      ? row
      : currentLeader,
  );

  return outcomeOrder.map((row) => {
    const value = probabilities[row.probabilityKey];
    const percentLabel = formatDisplayPercent(value);

    return {
      id: row.id,
      isLeader: row.id === leader.id,
      meterWidth: percentLabel,
      percentLabel,
      tone: row.tone,
      value,
    };
  });
}

export function buildWeatherMetricPresentation(
  weather: MatchWeatherForecast,
): WeatherMetricPresentation[] {
  return [
    {
      id: "condition",
      icon: "condition",
      label: weather.condition,
      value: `${weather.temperatureC}°C`,
    },
    {
      id: "humidity",
      icon: "humidity",
      label: "Humidity",
      value: `${weather.humidityPct}%`,
    },
    {
      id: "wind",
      icon: "wind",
      label: "Wind",
      value: `${weather.windKph}km/h`,
    },
  ];
}
