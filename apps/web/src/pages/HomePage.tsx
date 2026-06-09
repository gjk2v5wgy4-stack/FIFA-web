import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { ResultPreview } from "../components/ResultPreview";
import { TeamDisplayName } from "../components/TeamDisplayName";
import type { MatchPredictionStub } from "../services/apiStubs";
import { getVenueDisplay } from "../services/teamDisplay";
import {
  createPredictionFromSchedule,
  type TournamentMatchStub,
} from "../services/worldCupSchedule";

interface HomePageProps {
  prediction: MatchPredictionStub | null;
  tournamentMatches: TournamentMatchStub[];
}

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

export function HomePage({ prediction, tournamentMatches }: HomePageProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const selectedMatch =
    tournamentMatches.find((match) => match.matchId === selectedMatchId) ??
    tournamentMatches[0] ??
    null;
  const selectedPrediction = useMemo(
    () => (selectedMatch ? createPredictionFromSchedule(selectedMatch) : prediction),
    [prediction, selectedMatch],
  );

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

            return (
              <button
                aria-pressed={isSelected}
                className={`tournament-card${isSelected ? " tournament-card--active" : ""}`}
                key={match.matchId}
                onClick={() => setSelectedMatchId(match.matchId)}
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
              </button>
            );
          })}
        </div>
      </section>

      <ResultPreview prediction={selectedPrediction} />
    </div>
  );
}
