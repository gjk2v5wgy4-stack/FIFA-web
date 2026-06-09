import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { ResultPreview } from "../components/ResultPreview";
import type { MatchPredictionStub } from "../services/apiStubs";
import type { TournamentMatchStub } from "../services/worldCupSchedule";

interface HomePageProps {
  prediction: MatchPredictionStub | null;
  tournamentMatches: TournamentMatchStub[];
}

function formatMatchDate(kickoffAt: string) {
  return new Date(kickoffAt).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function formatMatchTime(kickoffAt: string) {
  return new Date(kickoffAt).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HomePage({ prediction, tournamentMatches }: HomePageProps) {
  return (
    <div className="page-stack">
      <section
        aria-label="6月13日至7月20日比赛信息"
        className="tournament-schedule"
      >
        <div className="tournament-schedule__header">
          <div>
            <p className="eyebrow">Full Schedule</p>
            <h1>6月13日 - 7月20日赛程</h1>
          </div>
          <span>{tournamentMatches.length} 场比赛</span>
        </div>

        <div className="tournament-carousel" aria-label="可左右滑动查看全部比赛">
          {tournamentMatches.map((match) => (
            <article className="tournament-card" key={match.matchId}>
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
                <span>{match.homeTeam}</span>
                <strong>vs</strong>
                <span>{match.awayTeam}</span>
              </div>

              <div className="tournament-card__region">
                <MapPin aria-hidden="true" size={16} />
                <span>{match.region}</span>
                <small>{match.stage}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ResultPreview prediction={prediction} />
    </div>
  );
}
