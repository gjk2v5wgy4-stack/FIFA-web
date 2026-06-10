import type { TournamentMatchStub } from "./worldCupSchedule";

export interface MatchWeatherForecast {
  condition: string;
  temperatureC: number;
  humidityPct: number;
  windKph: number;
  updatedAt: string;
  nextUpdateAt: string;
}

const venueClimate: Record<
  string,
  {
    baseTemperatureC: number;
    humidityPct: number;
    windKph: number;
    conditions: string[];
  }
> = {
  Atlanta: {
    baseTemperatureC: 29,
    humidityPct: 68,
    windKph: 11,
    conditions: ["多云", "短时阵雨", "闷热"],
  },
  Arlington: {
    baseTemperatureC: 32,
    humidityPct: 54,
    windKph: 14,
    conditions: ["晴", "少云", "炎热"],
  },
  Foxborough: {
    baseTemperatureC: 24,
    humidityPct: 58,
    windKph: 13,
    conditions: ["多云", "晴间多云", "微风"],
  },
  Guadalupe: {
    baseTemperatureC: 31,
    humidityPct: 48,
    windKph: 12,
    conditions: ["晴", "干热", "少云"],
  },
  Houston: {
    baseTemperatureC: 31,
    humidityPct: 72,
    windKph: 13,
    conditions: ["闷热", "多云", "短时阵雨"],
  },
  "Kansas City": {
    baseTemperatureC: 28,
    humidityPct: 61,
    windKph: 16,
    conditions: ["晴间多云", "多云", "阵风"],
  },
  "Los Angeles": {
    baseTemperatureC: 24,
    humidityPct: 53,
    windKph: 10,
    conditions: ["晴", "少云", "海风"],
  },
  "Mexico City": {
    baseTemperatureC: 22,
    humidityPct: 46,
    windKph: 9,
    conditions: ["晴间多云", "多云", "高原微风"],
  },
  Miami: {
    baseTemperatureC: 30,
    humidityPct: 76,
    windKph: 15,
    conditions: ["湿热", "短时阵雨", "多云"],
  },
  "New Jersey": {
    baseTemperatureC: 26,
    humidityPct: 59,
    windKph: 12,
    conditions: ["晴间多云", "多云", "微风"],
  },
  Philadelphia: {
    baseTemperatureC: 27,
    humidityPct: 60,
    windKph: 11,
    conditions: ["多云", "晴间多云", "微风"],
  },
  "Santa Clara": {
    baseTemperatureC: 23,
    humidityPct: 52,
    windKph: 12,
    conditions: ["晴", "少云", "海风"],
  },
  Seattle: {
    baseTemperatureC: 20,
    humidityPct: 63,
    windKph: 10,
    conditions: ["阴", "多云", "小雨"],
  },
  Toronto: {
    baseTemperatureC: 23,
    humidityPct: 56,
    windKph: 14,
    conditions: ["晴间多云", "多云", "微风"],
  },
  Vancouver: {
    baseTemperatureC: 19,
    humidityPct: 66,
    windKph: 10,
    conditions: ["多云", "阴", "小雨"],
  },
  Zapopan: {
    baseTemperatureC: 27,
    humidityPct: 50,
    windKph: 11,
    conditions: ["晴", "少云", "干热"],
  },
};

function startOfHour(date: Date) {
  const nextDate = new Date(date);
  nextDate.setMinutes(0, 0, 0);
  return nextDate;
}

function nextHour(date: Date) {
  const nextDate = startOfHour(date);
  nextDate.setHours(nextDate.getHours() + 1);
  return nextDate;
}

function createSeed(input: string) {
  return [...input].reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

export function createMatchWeatherForecast(
  match: TournamentMatchStub,
  refreshedAt = new Date(),
): MatchWeatherForecast {
  const climate = venueClimate[match.region] ?? {
    baseTemperatureC: 25,
    humidityPct: 58,
    windKph: 12,
    conditions: ["多云", "晴间多云", "微风"],
  };
  const hourlySeed = createSeed(`${match.matchId}-${match.region}-${startOfHour(refreshedAt).toISOString()}`);
  const condition = climate.conditions[hourlySeed % climate.conditions.length];
  const temperatureC = climate.baseTemperatureC + (hourlySeed % 5) - 2;
  const humidityPct = Math.min(90, Math.max(30, climate.humidityPct + (hourlySeed % 9) - 4));
  const windKph = Math.max(4, climate.windKph + (hourlySeed % 7) - 3);

  return {
    condition,
    temperatureC,
    humidityPct,
    windKph,
    updatedAt: refreshedAt.toISOString(),
    nextUpdateAt: nextHour(refreshedAt).toISOString(),
  };
}
