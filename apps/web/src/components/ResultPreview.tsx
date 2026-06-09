import { AlertTriangle, FileText, Gauge } from "lucide-react";
import type { MatchPredictionStub } from "../services/apiStubs";

interface ResultPreviewProps {
  prediction: MatchPredictionStub | null;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function ResultPreview({ prediction }: ResultPreviewProps) {
  if (!prediction) {
    return <section className="result-preview result-preview--loading">加载中...</section>;
  }

  const rows = [
    {
      label: `${prediction.homeTeam.code} 胜`,
      value: prediction.probabilities.homeWin,
      tone: "green",
    },
    {
      label: "平局",
      value: prediction.probabilities.draw,
      tone: "blue",
    },
    {
      label: `${prediction.awayTeam.code} 胜`,
      value: prediction.probabilities.awayWin,
      tone: "amber",
    },
  ];

  return (
    <section className="result-preview" aria-label="预测结果预览">
      <div className="section-heading">
        <p className="eyebrow">Result Preview</p>
        <h2>预测结果展示</h2>
      </div>
      <div className="match-title">
        <span>{prediction.homeTeam.name}</span>
        <strong>vs</strong>
        <span>{prediction.awayTeam.name}</span>
      </div>
      <div className="probability-list">
        {rows.map((row) => (
          <div className="probability-row" key={row.label}>
            <span>{row.label}</span>
            <div className="probability-track">
              <span
                className={`probability-fill probability-fill--${row.tone}`}
                style={{ width: formatPercent(row.value) }}
              />
            </div>
            <strong>{formatPercent(row.value)}</strong>
          </div>
        ))}
      </div>
      <div className="result-meta-grid">
        <div>
          <Gauge aria-hidden="true" size={18} />
          <span>xG {prediction.expectedGoals.home.toFixed(2)} / {prediction.expectedGoals.away.toFixed(2)}</span>
        </div>
        <div>
          <FileText aria-hidden="true" size={18} />
          <span>{prediction.citations.length} 条模型依据</span>
        </div>
        <div>
          <AlertTriangle aria-hidden="true" size={18} />
          <span>展示不确定性</span>
        </div>
      </div>
    </section>
  );
}
