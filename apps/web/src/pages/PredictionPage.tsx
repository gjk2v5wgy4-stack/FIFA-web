import { ArrowDownRight, CalendarDays, MapPin } from "lucide-react";
import { AdvancedPredictionInsights } from "../components/AdvancedPredictionInsights";
import { ResultPreview } from "../components/ResultPreview";
import type { MatchPredictionStub } from "../services/apiStubs";

interface PredictionPageProps {
  prediction: MatchPredictionStub | null;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function PredictionPage({ prediction }: PredictionPageProps) {
  if (!prediction) {
    return <div className="page-stack">正在读取后端预测与 RAG 数据...</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Prediction API</p>
          <h1>单场概率预测详情</h1>
          <p className="muted">
            本页整合后端预测接口、token 计量、Qdrant RAG 分析和模型解释，不展示保证性结论。
          </p>
        </div>
        <div className="header-facts">
          <span>
            <CalendarDays aria-hidden="true" size={18} />
            {new Date(prediction.kickoffAt).toLocaleString("zh-CN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <span>
            <MapPin aria-hidden="true" size={18} />
            {prediction.venue}
          </span>
        </div>
      </section>

      <div className="two-column two-column--wide-left">
        <ResultPreview prediction={prediction} />
        <section className="usage-panel">
          <div className="section-heading">
            <p className="eyebrow">Metering</p>
            <h2>本次接口计量</h2>
          </div>
          <dl className="definition-list">
            <div>
              <dt>扣减 token</dt>
              <dd>{prediction.usage.tokensCharged.toLocaleString()}</dd>
            </div>
            <div>
              <dt>剩余额度</dt>
              <dd>{prediction.usage.remainingTokens.toLocaleString()}</dd>
            </div>
            <div>
              <dt>低余额</dt>
              <dd>{prediction.usage.lowBalance ? "联系管理员" : "否"}</dd>
            </div>
            <div>
              <dt>RAG 状态</dt>
              <dd>{prediction.ragDiagnostics?.status ?? "unknown"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <AdvancedPredictionInsights prediction={prediction} />

      <section className="score-panel">
        <div className="section-heading">
          <p className="eyebrow">Score Distribution</p>
          <h2>比分概率分布</h2>
        </div>
        <div className="score-grid">
          {prediction.scoreDistribution.map((score) => (
            <article className="score-card" key={`${score.homeGoals}-${score.awayGoals}`}>
              <strong>
                {score.homeGoals} - {score.awayGoals}
              </strong>
              <span>{percent(score.probability)}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="insight-grid">
        <article className="insight-panel">
          <div className="section-heading">
            <p className="eyebrow">Explanation</p>
            <h2>模型依据与风险因素</h2>
          </div>
          <ul className="plain-list">
            {prediction.explanations.map((item) => (
              <li key={item}>
                <ArrowDownRight aria-hidden="true" size={18} />
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="insight-panel">
          <div className="section-heading">
            <p className="eyebrow">RAG Summary</p>
            <h2>数据分析摘要</h2>
          </div>
          <p className="muted">
            {prediction.ragAnswer ?? "暂无额外摘要，当前展示模型概率、风险因素和关键驱动。"}
          </p>
        </article>
      </section>
    </div>
  );
}
