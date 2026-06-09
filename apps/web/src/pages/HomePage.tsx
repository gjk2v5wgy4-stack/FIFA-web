import { CalendarDays, Clock3, LogIn, MapPin, UserPlus } from "lucide-react";
import { ResultPreview } from "../components/ResultPreview";
import type { MatchPredictionStub, TodayMatchStub } from "../services/apiStubs";

interface HomePageProps {
  prediction: MatchPredictionStub | null;
  todayMatches: TodayMatchStub[];
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function HomePage({
  prediction,
  todayMatches,
  onOpenLogin,
  onOpenRegister,
}: HomePageProps) {
  const checkedAt = new Date();
  const checkedDate = checkedAt.toLocaleDateString("zh-CN", {
    dateStyle: "full",
  });
  const checkedTime = checkedAt.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const statusLabels: Record<TodayMatchStub["status"], string> = {
    scheduled: "待开赛",
    live: "进行中",
    finished: "已结束",
    postponed: "延期",
    cancelled: "取消",
  };

  return (
    <div className="page-stack">
      <div className="page-top-actions" aria-label="账号操作">
        <button className="secondary-button" onClick={onOpenLogin} type="button">
          <LogIn aria-hidden="true" size={16} />
          登录
        </button>
        <button className="primary-button" onClick={onOpenRegister} type="button">
          <UserPlus aria-hidden="true" size={16} />
          注册
        </button>
      </div>

      <section className="today-schedule" aria-label="今日赛程">
        <div className="today-schedule__header">
          <div>
            <p className="eyebrow">Today Schedule</p>
            <h1>今日赛程</h1>
          </div>
          <div className="schedule-check">
            <span>
              <CalendarDays aria-hidden="true" size={18} />
              {checkedDate}
            </span>
            <span>
              <Clock3 aria-hidden="true" size={18} />
              校对时间 {checkedTime}
            </span>
          </div>
        </div>
        <div className="schedule-summary">今日共 {todayMatches.length} 场比赛</div>
        <div className="schedule-list">
          {todayMatches.map((match, index) => (
            <article className="schedule-card" key={match.matchId}>
              <span className="schedule-card__index">第 {index + 1} 场</span>
              <div>
                <strong>
                  {match.homeTeam.name} <span>vs</span> {match.awayTeam.name}
                </strong>
                <small>
                  {match.homeTeam.code} - {match.awayTeam.code}
                </small>
              </div>
              <div className="schedule-card__meta">
                <span>
                  <Clock3 aria-hidden="true" size={16} />
                  {new Date(match.kickoffAt).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>
                  <MapPin aria-hidden="true" size={16} />
                  {match.venue}
                </span>
                <span>
                  {match.group} 组 · {statusLabels[match.status]}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ResultPreview prediction={prediction} />
    </div>
  );
}
