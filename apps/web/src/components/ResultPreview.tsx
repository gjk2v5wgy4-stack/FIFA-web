import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CloudSun,
  FileText,
  Gauge,
  LayoutPanelTop,
  LineChart,
  RadioTower,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { MatchPredictionStub } from "../services/apiStubs";
import { formatTeamDisplay } from "../services/teamDisplay";

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

  const homeTeam = formatTeamDisplay(prediction.homeTeam);
  const awayTeam = formatTeamDisplay(prediction.awayTeam);
  const outcomeCards = [
    {
      label: "主队胜率",
      title: homeTeam,
      value: prediction.probabilities.homeWin,
      tone: "green",
    },
    {
      label: "平局概率",
      title: "平局",
      value: prediction.probabilities.draw,
      tone: "blue",
    },
    {
      label: "客队胜率",
      title: awayTeam,
      value: prediction.probabilities.awayWin,
      tone: "amber",
    },
  ];
  const leader = outcomeCards.reduce((currentLeader, row) =>
    row.value > currentLeader.value ? row : currentLeader,
  );
  const analysisModules = [
    {
      icon: ShieldCheck,
      title: "球队历史表现数据",
      points: [
        "世界杯和洲际赛事成绩、关键阶段稳定性",
        "小组赛与淘汰赛的胜率、进球数、失球数",
        "中立场适应、教练战术风格和轮换策略",
      ],
      reason: "帮助模型理解球队整体实力和稳定性，而不只看单场表现。",
    },
    {
      icon: UsersRound,
      title: "球员多维数据",
      points: [
        "近期进球、助攻、出场时间和关键传球",
        "跑动距离、冲刺次数、疲劳指数与伤病恢复",
        "关键比赛状态波动和球员间配合成功率",
      ],
      reason: "球员表现需要同时考虑状态、健康和协作质量。",
    },
    {
      icon: CloudSun,
      title: "比赛环境和外部因素",
      points: [
        "比赛地点的气候、海拔、湿度和草皮条件",
        "两队休息天数、旅途距离和赛程密度",
        "裁判判罚倾向对身体对抗和节奏的影响",
      ],
      reason: "环境会影响体能分配和战术执行质量。",
    },
    {
      icon: LayoutPanelTop,
      title: "球队战术和阵型数据",
      points: [
        "4-3-3、3-5-2等阵型使用频率",
        "进攻压迫、防守回收和边路推进偏好",
        "关键位置适应性与替补使用规律",
      ],
      reason: "模型需要识别战术匹配，而不是只比较个人能力。",
    },
    {
      icon: BrainCircuit,
      title: "对手信息",
      points: [
        "对手历史表现、核心球员特点和强弱区域",
        "双方历史交锋和不同阵型下的对位关系",
        "对手战术节奏对本队防守转换的影响",
      ],
      reason: "世界杯预测高度依赖对阵关系和战术克制。",
    },
    {
      icon: RadioTower,
      title: "实时动态数据",
      points: [
        "最近热身赛、友谊赛和公开训练表现",
        "临时伤停、停赛、首发调整和天气更新",
        "赛前新闻源与RAG资料的交叉复核",
      ],
      reason: "最新动态会改变模型对状态和风险的判断。",
    },
    {
      icon: LineChart,
      title: "统计和高级指标",
      points: [
        "xG、xA、射正、控球率和传球成功率",
        "机会转化率、防守拦截成功率和压迫效率",
        "高质量机会数量与防线失位频率",
      ],
      reason: "高级指标比传统进球助攻更能反映真实潜力。",
    },
  ];

  return (
    <section className="result-preview" aria-label="预测结果预览">
      <div className="section-heading">
        <p className="eyebrow">概率预测</p>
        <h2>预测结果展示</h2>
      </div>
      <div className="match-title match-title--large">
        <span>{homeTeam}</span>
        <strong>对阵</strong>
        <span>{awayTeam}</span>
      </div>

      <div className="outcome-summary">
        <div className="outcome-summary__lead">
          <Activity aria-hidden="true" size={20} />
          <span>当前倾向</span>
          <strong>{leader.title}</strong>
        </div>
        <div className="outcome-grid">
          {outcomeCards.map((row) => (
            <article
              className={`outcome-card outcome-card--${row.tone}${
                row.title === leader.title ? " outcome-card--leader" : ""
              }`}
              key={row.label}
            >
              <span>{row.label}</span>
              <strong>{formatPercent(row.value)}</strong>
              <small>{row.title}</small>
              <div className="mini-meter">
                <span style={{ width: formatPercent(row.value) }} />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="result-meta-grid">
        <div>
          <Gauge aria-hidden="true" size={18} />
          <span>
            xG {prediction.expectedGoals.home.toFixed(2)} /{" "}
            {prediction.expectedGoals.away.toFixed(2)}
          </span>
        </div>
        <div>
          <FileText aria-hidden="true" size={18} />
          <span>{prediction.citations.length} 条模型依据</span>
        </div>
        <div>
          <AlertTriangle aria-hidden="true" size={18} />
          <span>保留不确定性</span>
        </div>
      </div>

      <section className="result-analysis" aria-label="胜负分析">
        <div className="section-heading">
          <p className="eyebrow">胜负分析</p>
          <h2>模型关注的关键子模块</h2>
        </div>
        <div className="result-analysis-grid">
          {analysisModules.map((module) => {
            const Icon = module.icon;

            return (
              <article className="analysis-card" key={module.title}>
                <Icon aria-hidden="true" size={22} />
                <h3>{module.title}</h3>
                <ul>
                  {module.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <p>{module.reason}</p>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
