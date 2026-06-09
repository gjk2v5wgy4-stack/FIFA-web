import { ArrowDownRight, CalendarDays, FileText, MapPin } from "lucide-react";
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
    return <div className="page-stack">加载预测结果 stub...</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">高阶预测</p>
          <h1>单场概率预测报告</h1>
          <p className="muted">
            面向审批用户展示比分参考、历史交锋、阵容置信度、关键对位、战术克制和模型分歧。
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
            <h2>本次计量</h2>
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
          </dl>
        </section>
      </div>

      <AdvancedPredictionInsights prediction={prediction} />

      <section className="score-panel">
        <div className="section-heading">
          <p className="eyebrow">Score Distribution</p>
          <h2>比分分布 stub</h2>
        </div>
        <div className="score-grid">
          {prediction.scoreDistribution.map((score) => (
            <article className="score-card" key={`${score.homeGoals}-${score.awayGoals}`}>
              <strong>{score.homeGoals} - {score.awayGoals}</strong>
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
            <p className="eyebrow">RAG Citations</p>
            <h2>引用来源</h2>
          </div>
          <ul className="plain-list">
            {prediction.citations.map((citation) => (
              <li key={citation.chunkId}>
                <FileText aria-hidden="true" size={18} />
                <span>
                  {citation.sourceName}
                  <small>{citation.publishedAt.slice(0, 10)}</small>
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
