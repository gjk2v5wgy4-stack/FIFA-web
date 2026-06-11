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
import { useState } from "react";
import { TeamDisplayName } from "./TeamDisplayName";
import type {
  MatchPredictionStub,
  PredictionAnalysisSection,
  PredictionPlayerInsight,
  PredictionTeamAnalysisContext,
} from "../services/apiStubs";
import { getTeamDisplay } from "../services/teamDisplay";
import {
  buildOutcomePresentation,
  formatDisplayPercent,
  type OutcomePresentationId,
} from "../services/uiPresentation";

interface ResultPreviewProps {
  prediction: MatchPredictionStub | null;
}

type AnalysisSide = "home" | "away";
type AnalysisIcon = typeof ShieldCheck;

interface AnalysisModule {
  icon: AnalysisIcon;
  title: string;
  points: string[];
  reason: string;
}

const analysisIconById: Record<PredictionAnalysisSection["id"], typeof ShieldCheck> = {
  team_history: ShieldCheck,
  player_profile: UsersRound,
  match_environment: CloudSun,
  tactical_context: LayoutPanelTop,
  opponent_context: BrainCircuit,
  live_updates: RadioTower,
  advanced_metrics: LineChart,
  external_factors: FileText,
};

const positionLabels: Record<string, string> = {
  GK: "门将",
  DF: "后卫",
  CB: "中卫",
  LB: "左后卫",
  RB: "右后卫",
  DM: "防守型中场",
  CM: "中场",
  AM: "前腰",
  FW: "前锋",
};

function formatAvailability(status: string) {
  const statusMap: Record<string, string> = {
    available: "可出场",
    doubtful: "待观察",
    injured: "伤停",
    suspended: "停赛",
  };

  return statusMap[status] ?? status;
}

function formatSignedPercent(value?: number) {
  if (typeof value !== "number") {
    return "暂无量化";
  }

  return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
}

function formatPlayerInsight(player: PredictionPlayerInsight) {
  const position = positionLabels[player.position] ?? player.position;
  const minutes =
    typeof player.minutesProjection === "number"
      ? `预计${player.minutesProjection}分钟`
      : "预计时间待确认";
  const attack = formatSignedPercent(player.attackContribution);
  const defense = formatSignedPercent(player.defenseContribution);

  return `${player.name} · ${position} · ${formatAvailability(
    player.availabilityStatus,
  )} · ${minutes} · 进攻影响${attack} / 防守影响${defense}`;
}

function formatForm(form: string[]) {
  return form.length ? form.join("-") : "待更新";
}

function buildStructuredAnalysisModules({
  selectedContext,
  selectedSide,
  prediction,
}: {
  selectedContext?: PredictionTeamAnalysisContext;
  selectedSide: AnalysisSide;
  prediction: MatchPredictionStub;
}): AnalysisModule[] {
  const environment = prediction.analysisContext?.environment;
  const teamEnvironment = environment?.teams[selectedSide];
  const modules: AnalysisModule[] = [];

  if (selectedContext) {
    modules.push({
      icon: ShieldCheck,
      title: "球队历史表现数据",
      points: [
        `球队档案：${selectedContext.name}（${selectedContext.code}），${selectedContext.confederation ?? "赛区待更新"}，2026 小组：${selectedContext.group ?? "待更新"}`,
        `近期战绩：${formatForm(selectedContext.form)}；Elo ${selectedContext.modelProfile?.elo ?? "待更新"}；晋级路径难度 ${selectedContext.modelProfile?.pathDifficulty?.toFixed(2) ?? "待更新"}`,
        `攻防基线：进攻 xG/90 ${selectedContext.modelProfile?.xgFor90?.toFixed(2) ?? "待更新"}，防守 xGA/90 ${selectedContext.modelProfile?.xgAgainst90?.toFixed(2) ?? "待更新"}`,
      ],
      reason: "展示当前已入库的球队档案、近期状态和模型基线；更长周期历史成绩可随数据源扩展继续补充。",
    });
  }

  if (selectedContext?.players.length) {
    modules.push({
      icon: UsersRound,
      title: "球员多维数据",
      points: [
        ...selectedContext.players.slice(0, 6).map(formatPlayerInsight),
        `球队近期状态：${formatForm(selectedContext.form)}；Elo ${
          selectedContext.modelProfile?.elo ?? "待更新"
        }；xG/90 ${selectedContext.modelProfile?.xgFor90?.toFixed(2) ?? "待更新"}`,
      ],
      reason: "结合具体球员、位置、可用性、预计出场时间和攻防影响，用于判断当前阵容对胜负概率的影响。",
    });
  }

  if (environment && teamEnvironment) {
    modules.push({
      icon: CloudSun,
      title: "比赛环境和外部因素",
      points: [
        `天气：${environment.weather.condition}，${environment.weather.temperatureC}°C，湿度${environment.weather.humidityPct}%，风速${environment.weather.windKph}km/h`,
        `场地：${environment.venue}（${environment.city}），海拔${environment.altitudeMeters}米，草皮：${environment.turf}`,
        `训练场地：${teamEnvironment.trainingBase}；旅途约${teamEnvironment.travelDistanceKm}km；休息${teamEnvironment.restDays}天；时差适应：${teamEnvironment.timezoneAdjustment}`,
        `场地状态：${environment.pitchCondition}`,
      ],
      reason: "把天气、海拔、草皮、旅途、休息和训练场地作为环境变量展示，用于解释体能分配和战术执行的不确定性。",
    });
  }

  return modules;
}

export function ResultPreview({ prediction }: ResultPreviewProps) {
  const [analysisSelection, setAnalysisSelection] = useState<{
    matchId: string;
    side: AnalysisSide;
  } | null>(null);

  if (!prediction) {
    return <section className="result-preview result-preview--loading">加载中...</section>;
  }

  const homeTeam = getTeamDisplay(prediction.homeTeam);
  const awayTeam = getTeamDisplay(prediction.awayTeam);
  const outcomeDisplayById: Record<
    OutcomePresentationId,
    {
      label: string;
      title: string;
      team?: MatchPredictionStub["homeTeam"];
    }
  > = {
    homeWin: {
      label: "主队胜率",
      title: homeTeam.name,
      team: prediction.homeTeam,
    },
    draw: {
      label: "平局概率",
      title: "平局",
    },
    awayWin: {
      label: "客队胜率",
      title: awayTeam.name,
      team: prediction.awayTeam,
    },
  };
  const outcomeCards = buildOutcomePresentation(prediction.probabilities).map((row) => ({
    ...row,
    ...outcomeDisplayById[row.id],
  }));
  const leader = outcomeCards.find((row) => row.isLeader) ?? outcomeCards[0];
  const defaultAnalysisSide: AnalysisSide =
    prediction.probabilities.homeWin >= prediction.probabilities.awayWin ? "home" : "away";
  const selectedAnalysisSide =
    analysisSelection?.matchId === prediction.matchId
      ? analysisSelection.side
      : defaultAnalysisSide;
  const homeAnalysisOption = {
    side: "home" as const,
    sideLabel: "主队",
    team: prediction.homeTeam,
    title: homeTeam.name,
    probability: prediction.probabilities.homeWin,
  };
  const awayAnalysisOption = {
    side: "away" as const,
    sideLabel: "客队",
    team: prediction.awayTeam,
    title: awayTeam.name,
    probability: prediction.probabilities.awayWin,
  };
  const analysisOptions = [homeAnalysisOption, awayAnalysisOption];
  const analysisTarget =
    selectedAnalysisSide === "home" ? homeAnalysisOption : awayAnalysisOption;
  const selectedAnalysisContext = prediction.analysisContext?.[selectedAnalysisSide];
  const fallbackAnalysisModules = [
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
        "赛前新闻与RAG资料的交叉复核",
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
  const structuredAnalysisModules = buildStructuredAnalysisModules({
    selectedContext: selectedAnalysisContext,
    selectedSide: selectedAnalysisSide,
    prediction,
  });
  const ragAnalysisModules =
    prediction.analysisSections
      ?.filter(
        (section) =>
          !["player_profile", "match_environment", "external_factors"].includes(section.id),
      )
      .map((section) => ({
        icon: analysisIconById[section.id] ?? FileText,
        title: section.title,
        points: section.points,
        reason: section.reason,
      })) ?? [];
  const analysisModules = structuredAnalysisModules.length
    ? [...structuredAnalysisModules, ...ragAnalysisModules].slice(0, 6)
    : ragAnalysisModules.length
      ? ragAnalysisModules
      : fallbackAnalysisModules;

  return (
    <section className="result-preview" aria-label="预测结果预览">
      <div className="section-heading">
        <p className="eyebrow">概率预测</p>
      </div>
      <div className="match-title match-title--large">
        <TeamDisplayName team={prediction.homeTeam} />
        <strong>对阵</strong>
        <TeamDisplayName team={prediction.awayTeam} />
      </div>

      <div className="outcome-summary">
        <div className="outcome-summary__lead">
          <Activity aria-hidden="true" size={20} />
          <span>当前倾向</span>
          <strong>
            {leader.team ? <TeamDisplayName team={leader.team} /> : leader.title}
          </strong>
        </div>
        <div className="outcome-grid">
          {outcomeCards.map((row) => (
            <article
              className={`outcome-card outcome-card--${row.tone}${
                row.isLeader ? " outcome-card--leader" : ""
              }`}
              key={row.label}
            >
              <span>{row.label}</span>
              <strong>{row.percentLabel}</strong>
              <small>{row.team ? <TeamDisplayName team={row.team} /> : row.title}</small>
              <div className="mini-meter">
                <span style={{ width: row.meterWidth }} />
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
          <span>多维数据已整合</span>
        </div>
        <div>
          <AlertTriangle aria-hidden="true" size={18} />
          <span>保留不确定性</span>
        </div>
      </div>

      <section className="result-analysis" aria-label={`${analysisTarget.title}胜负分析`}>
        <div className="section-heading">
          <p className="eyebrow">胜负分析 · {analysisTarget.sideLabel}</p>
          <h2 className="result-analysis-title">
            <TeamDisplayName team={analysisTarget.team} />
            <span>胜负分析</span>
          </h2>
        </div>
        <div className="analysis-selector" role="group" aria-label="选择胜负分析对象">
          {analysisOptions.map((option) => (
            <button
              aria-pressed={option.side === selectedAnalysisSide}
              className={`analysis-selector__button${
                option.side === selectedAnalysisSide
                  ? " analysis-selector__button--active"
                  : ""
              }`}
              key={option.side}
              onClick={() =>
                setAnalysisSelection({ matchId: prediction.matchId, side: option.side })
              }
              type="button"
            >
              <span>{option.sideLabel}</span>
              <strong>
                <TeamDisplayName team={option.team} />
              </strong>
              <small>{formatDisplayPercent(option.probability)}</small>
            </button>
          ))}
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
