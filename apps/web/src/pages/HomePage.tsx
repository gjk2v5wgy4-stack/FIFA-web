import { CalendarDays, CloudSun, Clock3, Droplets, MapPin, Wind } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ResultPreview } from "../components/ResultPreview";
import { TeamDisplayName } from "../components/TeamDisplayName";
import type { MatchPredictionStub } from "../services/apiStubs";
import { getVenueDisplay } from "../services/teamDisplay";
import {
  buildWeatherMetricPresentation,
  type WeatherMetricPresentation,
} from "../services/uiPresentation";
import { createMatchWeatherForecast } from "../services/weatherForecast";
import {
  createPredictionFromSchedule,
  type TournamentMatchStub,
} from "../services/worldCupSchedule";

interface HomePageProps {
  activeMatchId: string;
  onSelectMatch: (matchId: string) => void;
  prediction: MatchPredictionStub | null;
  tournamentMatches: TournamentMatchStub[];
}

const weatherMetricIcons: Record<WeatherMetricPresentation["icon"], typeof CloudSun> = {
  condition: CloudSun,
  humidity: Droplets,
  wind: Wind,
};

function formatMatchDate(kickoffAt: string) {
  const dateLabel = new Date(kickoffAt).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

  return `${dateLabel} 北京时间`;
}

function formatMatchTime(kickoffAt: string) {
  return new Date(kickoffAt).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HomePage({
  activeMatchId,
  onSelectMatch,
  prediction,
  tournamentMatches,
}: HomePageProps) {
  const [weatherRefreshedAt, setWeatherRefreshedAt] = useState(() => new Date());
  const selectedMatch =
    tournamentMatches.find((match) => match.matchId === activeMatchId) ??
    tournamentMatches[0] ??
    null;
  const selectedPrediction = useMemo(
    () =>
      prediction?.matchId === selectedMatch?.matchId || !selectedMatch
        ? prediction
        : createPredictionFromSchedule(selectedMatch),
    [prediction, selectedMatch],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setWeatherRefreshedAt(new Date());
    }, 60 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="page-stack">
      <section
        aria-label="近期比赛信息"
        className="tournament-schedule"
      >
        <div className="tournament-schedule__header">
          <div>
            <p className="eyebrow">世界杯赛程</p>
            <h1>近期比赛信息</h1>
          </div>
          <span>{tournamentMatches.length} 场比赛</span>
        </div>

        <div className="tournament-carousel" aria-label="左右滑动查看全部比赛">
          {tournamentMatches.map((match) => {
            const isSelected = selectedMatch?.matchId === match.matchId;
            const weather = createMatchWeatherForecast(match, weatherRefreshedAt);
            const weatherMetrics = buildWeatherMetricPresentation(weather);

            return (
              <button
                aria-pressed={isSelected}
                className={`tournament-card${isSelected ? " tournament-card--active" : ""}`}
                key={match.matchId}
                onClick={() => onSelectMatch(match.matchId)}
                type="button"
              >
                <div className="tournament-card__time">
                  <span>
                    <CalendarDays aria-hidden="true" size={16} />
                    {formatMatchDate(match.kickoffAt)}
                  </span>
                  <strong>
                    <Clock3 aria-hidden="true" size={16} />
                    {formatMatchTime(match.kickoffAt)}
                  </strong>
                </div>

                <div className="tournament-card__teams">
                  <TeamDisplayName team={match.homeTeam} />
                  <strong>对阵</strong>
                  <TeamDisplayName team={match.awayTeam} />
                </div>

                <div className="tournament-card__region">
                  <MapPin aria-hidden="true" size={16} />
                  <span>{getVenueDisplay(match.region)}</span>
                  <small>{match.stage}</small>
                </div>

                <div className="tournament-card__weather" aria-label="天气预测">
                  {weatherMetrics.map((metric) => {
                    const WeatherIcon = weatherMetricIcons[metric.icon];

                    return (
                      <span
                        aria-label={`${metric.label} ${metric.value}`}
                        className={`weather-metric weather-metric--${metric.id}`}
                        key={metric.id}
                      >
                        <WeatherIcon aria-hidden="true" size={15} />
                        <span className="weather-metric__copy">
                          <strong>{metric.value}</strong>
                          <small>{metric.label}</small>
                        </span>
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <ResultPreview prediction={selectedPrediction} />
    </div>
  );
}
