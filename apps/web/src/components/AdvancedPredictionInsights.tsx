import {
  AlertTriangle,
  Clock3,
  Crosshair,
  Dumbbell,
  History,
  LineChart,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  Swords,
  UsersRound,
} from "lucide-react";
import type { MatchPredictionStub } from "../services/apiStubs";
import { createAdvancedPredictionInsights } from "../services/advancedPredictionInsights";
import { TeamDisplayName } from "./TeamDisplayName";

interface AdvancedPredictionInsightsProps {
  prediction: MatchPredictionStub;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function AdvancedPredictionInsights({
  prediction,
}: AdvancedPredictionInsightsProps) {
  const insights = createAdvancedPredictionInsights(prediction);
  const averageLineupConfidence = Math.round(
    insights.lineupInsights.reduce((sum, item) => sum + item.confidencePct, 0) /
      insights.lineupInsights.length,
  );

  return (
    <section className="advanced-insights" aria-label="高阶单场情报">
      <div className="advanced-insights__header">
        <div>
          <p className="eyebrow">高级情报</p>
          <h2>单场深度预测数据源</h2>
        </div>
        <span>审批用户高阶信息</span>
      </div>

      <div className="advanced-summary-grid">
        <article className="advanced-summary-item">
          <UsersRound aria-hidden="true" size={20} />
          <span>阵容置信度</span>
          <strong>{averageLineupConfidence}%</strong>
        </article>
        <article className="advanced-summary-item">
          <LineChart aria-hidden="true" size={20} />
          <span>模型分歧度</span>
          <strong>{insights.modelDisagreement.level}</strong>
        </article>
        <article className="advanced-summary-item">
          <History aria-hidden="true" size={20} />
          <span>历史交锋样本</span>
          <strong>{insights.headToHead.totalMatches} 场</strong>
        </article>
        <article className="advanced-summary-item">
          <RefreshCw aria-hidden="true" size={20} />
          <span>赛前监控点</span>
          <strong>{insights.preMatchUpdates.length} 项</strong>
        </article>
      </div>

      <div className="advanced-grid">
        <article className="advanced-card advanced-card--wide">
          <div className="advanced-card__heading">
            <ShieldCheck aria-hidden="true" size={22} />
            <div>
              <p className="eyebrow">比分参考</p>
              <h3>高概率比分区间</h3>
            </div>
          </div>
          <div className="score-reference-list">
            {insights.scoreReferences.map((item) => (
              <div className="score-reference-row" key={item.score}>
                <strong>{item.score}</strong>
                <span>{formatPercent(item.probability)}</span>
                <div>
                  <b>{item.label}</b>
                  <p>{item.scenario}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="advanced-card">
          <div className="advanced-card__heading">
            <History aria-hidden="true" size={22} />
            <div>
              <p className="eyebrow">历史交锋</p>
              <h3>再次交战心理压力</h3>
            </div>
          </div>
          <dl className="compact-definition-list">
            <div>
              <dt>样本窗口</dt>
              <dd>{insights.headToHead.sampleWindow}</dd>
            </div>
            <div>
              <dt>主队记录</dt>
              <dd>
                {insights.headToHead.homeWins} 胜 {insights.headToHead.draws} 平{" "}
                {insights.headToHead.awayWins} 负
              </dd>
            </div>
          </dl>
          <p className="advanced-card__note">{insights.headToHead.pressureNote}</p>
        </article>

        <article className="advanced-card">
          <div className="advanced-card__heading">
            <ListChecks aria-hidden="true" size={22} />
            <div>
              <p className="eyebrow">预计首发</p>
              <h3>阵容置信度</h3>
            </div>
          </div>
          <div className="lineup-list">
            {insights.lineupInsights.map((item) => (
              <div className="lineup-row" key={item.sideLabel}>
                <div>
                  <span>{item.sideLabel}</span>
                  <strong>
                    <TeamDisplayName team={item.team} />
                  </strong>
                </div>
                <small>{item.formation}</small>
                <b>{item.confidencePct}%</b>
                <ul>
                  {item.watchItems.map((watchItem) => (
                    <li key={watchItem}>{watchItem}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>

        <article className="advanced-card">
          <div className="advanced-card__heading">
            <Dumbbell aria-hidden="true" size={22} />
            <div>
              <p className="eyebrow">伤停恢复</p>
              <h3>体能与负荷风险</h3>
            </div>
          </div>
          <div className="risk-list">
            {insights.fatigueRecovery.map((item) => (
              <div className="risk-row" key={item.label}>
                <span className="risk-pill">{item.risk}</span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="advanced-card">
          <div className="advanced-card__heading">
            <Crosshair aria-hidden="true" size={22} />
            <div>
              <p className="eyebrow">关键对位</p>
              <h3>局部优势观察</h3>
            </div>
          </div>
          <div className="matchup-list">
            {insights.keyMatchups.map((item) => (
              <div className="matchup-row" key={item.zone}>
                <span>{item.zone}</span>
                <strong>{item.focus}</strong>
                <small>倾向：{item.edge}</small>
                <p>{item.signal}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="advanced-card">
          <div className="advanced-card__heading">
            <Swords aria-hidden="true" size={22} />
            <div>
              <p className="eyebrow">战术克制</p>
              <h3>影响概率的战术杠杆</h3>
            </div>
          </div>
          <div className="tactical-list">
            {insights.tacticalLevers.map((item) => (
              <div className="tactical-row" key={item.label}>
                <span>{item.impact}</span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.reading}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="advanced-card">
          <div className="advanced-card__heading">
            <AlertTriangle aria-hidden="true" size={22} />
            <div>
              <p className="eyebrow">模型分歧</p>
              <h3>多模型信号一致性</h3>
            </div>
          </div>
          <p className="advanced-card__note">{insights.modelDisagreement.summary}</p>
          <div className="model-view-list">
            {insights.modelDisagreement.views.map((item) => (
              <div className="model-view-row" key={item.model}>
                <span>{item.model}</span>
                <strong>{item.lean}</strong>
                <small>{item.confidence}</small>
                <p>{item.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="advanced-card">
          <div className="advanced-card__heading">
            <Clock3 aria-hidden="true" size={22} />
            <div>
              <p className="eyebrow">赛前 24 小时</p>
              <h3>临场更新队列</h3>
            </div>
          </div>
          <div className="update-list">
            {insights.preMatchUpdates.map((item) => (
              <div className="update-row" key={item.checkpoint}>
                <span>{item.checkpoint}</span>
                <div>
                  <strong>{item.status}</strong>
                  <p>{item.focus}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
