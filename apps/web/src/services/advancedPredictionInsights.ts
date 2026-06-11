import type { MatchPredictionStub, ScoreBucket } from "./apiStubs";
import { getTeamDisplay } from "./teamDisplay";

export interface ScoreReferenceInsight {
  label: string;
  probability: number;
  scenario: string;
  score: string;
}

export interface LineupInsight {
  confidencePct: number;
  formation: string;
  sideLabel: "主队" | "客队";
  team: MatchPredictionStub["homeTeam"];
  watchItems: string[];
}

export interface HeadToHeadInsight {
  awayWins: number;
  draws: number;
  homeWins: number;
  pressureNote: string;
  sampleWindow: string;
  totalMatches: number;
}

export interface MatchupInsight {
  edge: string;
  focus: string;
  signal: string;
  zone: string;
}

export interface TacticalLeverInsight {
  impact: "高" | "中" | "低";
  label: string;
  reading: string;
}

export interface FatigueRecoveryInsight {
  label: string;
  risk: "高" | "中" | "低";
  value: string;
}

export interface ModelViewInsight {
  confidence: "高" | "中高" | "中" | "低";
  lean: string;
  model: string;
  note: string;
}

type ModelDisagreementLevel = "高" | "中" | "低";

export interface PreMatchUpdateInsight {
  checkpoint: string;
  focus: string;
  status: "待更新" | "观察中" | "已校准";
}

export interface AdvancedPredictionInsights {
  fatigueRecovery: FatigueRecoveryInsight[];
  headToHead: HeadToHeadInsight;
  keyMatchups: MatchupInsight[];
  lineupInsights: LineupInsight[];
  modelDisagreement: {
    level: ModelDisagreementLevel;
    summary: string;
    views: ModelViewInsight[];
  };
  preMatchUpdates: PreMatchUpdateInsight[];
  scoreReferences: ScoreReferenceInsight[];
  tacticalLevers: TacticalLeverInsight[];
}

function createSeed(input: string) {
  return [...input].reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function scoreLabel(score: ScoreBucket, homeName: string, awayName: string) {
  if (score.homeGoals > score.awayGoals) {
    return `${homeName}小比分优势`;
  }

  if (score.awayGoals > score.homeGoals) {
    return `${awayName}反击窗口`;
  }

  return "平局拉锯区间";
}

function scoreScenario(score: ScoreBucket) {
  if (score.homeGoals === score.awayGoals) {
    return "双方节奏接近时，需要重点观察中场控制和定位球质量。";
  }

  if (Math.abs(score.homeGoals - score.awayGoals) === 1) {
    return "一球差概率较高，临场首发、体能和关键对位会明显影响结果。";
  }

  return "比分拉开依赖早段进球和转换进攻效率，模型保留不确定性。";
}

function createScoreReferences(
  prediction: MatchPredictionStub,
  homeName: string,
  awayName: string,
): ScoreReferenceInsight[] {
  return [...prediction.scoreDistribution]
    .sort((left, right) => right.probability - left.probability)
    .slice(0, 3)
    .map((score) => ({
      label: scoreLabel(score, homeName, awayName),
      probability: score.probability,
      scenario: scoreScenario(score),
      score: `${score.homeGoals} - ${score.awayGoals}`,
    }));
}

function createLineupInsights(prediction: MatchPredictionStub): LineupInsight[] {
  const seed = createSeed(`${prediction.matchId}-lineup`);
  const homeConfidence = 68 + (seed % 12);
  const awayConfidence = 64 + ((seed >> 2) % 13);

  return [
    {
      confidencePct: homeConfidence,
      formation: prediction.probabilities.homeWin >= 0.42 ? "4-3-3" : "4-2-3-1",
      sideLabel: "主队",
      team: prediction.homeTeam,
      watchItems: [
        "首发中前场压迫强度",
        "边路推进与回防速度",
        "门将与中卫出球稳定性",
      ],
    },
    {
      confidencePct: awayConfidence,
      formation: prediction.probabilities.awayWin >= 0.36 ? "3-4-2-1" : "4-4-2",
      sideLabel: "客队",
      team: prediction.awayTeam,
      watchItems: [
        "反击第一传质量",
        "替补席体能储备",
        "定位球防守站位",
      ],
    },
  ];
}

function createHeadToHeadInsight(
  prediction: MatchPredictionStub,
  homeName: string,
  awayName: string,
): HeadToHeadInsight {
  const seed = createSeed(`${prediction.homeTeam.code}-${prediction.awayTeam.code}-h2h`);
  const totalMatches = 5;
  const homeWins = 1 + (seed % 3);
  const draws = 1 + ((seed >> 2) % 2);
  const awayWins = totalMatches - homeWins - draws;
  const pressureTeam =
    homeWins > awayWins ? awayName : awayWins > homeWins ? homeName : "双方";

  return {
    awayWins,
    draws,
    homeWins,
    pressureNote:
      pressureTeam === "双方"
        ? "历史交锋接近，再次交战更容易进入谨慎试探阶段。"
        : `${pressureTeam}需要处理再次交战带来的心理压力和战术调整。`,
    sampleWindow: "近 5 场交锋样本",
    totalMatches,
  };
}

function createKeyMatchups(homeName: string, awayName: string): MatchupInsight[] {
  return [
    {
      edge: homeName,
      focus: `${homeName}边路推进 vs ${awayName}边后卫回追`,
      signal: "观察传中质量、二点球保护和回防速度。",
      zone: "边路对位",
    },
    {
      edge: "均衡",
      focus: "中场拦截点 vs 后场出球线路",
      signal: "如果高压成功率下降，比赛会转向低节奏拉锯。",
      zone: "中场控制",
    },
    {
      edge: awayName,
      focus: `${awayName}反击第一点 vs ${homeName}中卫身后空间`,
      signal: "快速转换和首脚传球质量会改变客队胜率区间。",
      zone: "转换进攻",
    },
  ];
}

function createTacticalLevers(
  prediction: MatchPredictionStub,
): TacticalLeverInsight[] {
  return [
    {
      impact: "高",
      label: "高位压迫质量",
      reading:
        prediction.probabilities.homeWin >= prediction.probabilities.awayWin
          ? "主队需要把压迫转化为禁区前沿机会。"
          : "客队若能绕开第一道压迫，反击空间会扩大。",
    },
    {
      impact: "中",
      label: "定位球攻防",
      reading: "一球差场景占比高，定位球会成为比分参考的关键变量。",
    },
    {
      impact: "中",
      label: "阵型切换速度",
      reading: "从控球阵型切到防守阵型的速度，会影响后 30 分钟风险。",
    },
  ];
}

function createFatigueRecovery(prediction: MatchPredictionStub): FatigueRecoveryInsight[] {
  const seed = createSeed(`${prediction.matchId}-fatigue`);

  return [
    {
      label: "核心球员近 14 天负荷",
      risk: seed % 3 === 0 ? "中" : "低",
      value: `${920 + (seed % 180)} 分钟样本`,
    },
    {
      label: "伤停恢复质量",
      risk: (seed >> 2) % 3 === 0 ? "中" : "低",
      value: "训练参与度与对抗强度待赛前复核",
    },
    {
      label: "跨区旅途与休息",
      risk: (seed >> 3) % 2 === 0 ? "中" : "低",
      value: "休息窗口影响高强度跑动储备",
    },
  ];
}

function createModelDisagreement(
  prediction: MatchPredictionStub,
  homeName: string,
  awayName: string,
  lineupInsights: LineupInsight[],
) {
  const probabilityLeader =
    prediction.probabilities.homeWin >= prediction.probabilities.awayWin
      ? homeName
      : awayName;
  const xgLeader =
    prediction.expectedGoals.home >= prediction.expectedGoals.away ? homeName : awayName;
  const lineupLeader =
    lineupInsights[0].confidencePct >= lineupInsights[1].confidencePct ? homeName : awayName;
  const margin = Math.abs(
    prediction.probabilities.homeWin - prediction.probabilities.awayWin,
  );
  const level: ModelDisagreementLevel =
    margin < 0.08 ? "高" : margin < 0.16 ? "中" : "低";

  return {
    level,
    summary:
      level === "高"
        ? "多模型信号接近，需要等待首发和临场情报再收敛。"
        : "核心模型方向较一致，但仍需保留赛前变量的不确定性。",
    views: [
      {
        confidence: "中高",
        lean: probabilityLeader,
        model: "Elo 强度模型",
        note: "整体实力、近期状态和比赛阶段稳定性。",
      },
      {
        confidence: "中",
        lean: xgLeader,
        model: "xG 机会质量模型",
        note: `xG ${prediction.expectedGoals.home.toFixed(2)} / ${prediction.expectedGoals.away.toFixed(2)}`,
      },
      {
        confidence: "中",
        lean: lineupLeader,
        model: "阵容可用性模型",
        note: "预计首发置信度、体能和关键位置可用性。",
      },
      {
        confidence: "中",
        lean: probabilityLeader,
        model: "RAG 情报模型",
        note: "赛前情报摘要已纳入分析，仍需结合临场变量复核。",
      },
    ] satisfies ModelViewInsight[],
  };
}

function createPreMatchUpdates(): PreMatchUpdateInsight[] {
  return [
    {
      checkpoint: "T-24h",
      focus: "预计首发、训练参与度、核心球员恢复质量",
      status: "观察中",
    },
    {
      checkpoint: "T-12h",
      focus: "伤停新闻、旅途恢复、天气和场地条件",
      status: "待更新",
    },
    {
      checkpoint: "T-3h",
      focus: "首发确认前的概率重算和模型分歧复核",
      status: "待更新",
    },
    {
      checkpoint: "T-1h",
      focus: "官方首发确认后更新比分参考和关键对位",
      status: "待更新",
    },
  ];
}

export function createAdvancedPredictionInsights(
  prediction: MatchPredictionStub,
): AdvancedPredictionInsights {
  const homeTeam = getTeamDisplay(prediction.homeTeam);
  const awayTeam = getTeamDisplay(prediction.awayTeam);
  const lineupInsights = createLineupInsights(prediction);

  return {
    fatigueRecovery: createFatigueRecovery(prediction),
    headToHead: createHeadToHeadInsight(prediction, homeTeam.name, awayTeam.name),
    keyMatchups: createKeyMatchups(homeTeam.name, awayTeam.name),
    lineupInsights,
    modelDisagreement: createModelDisagreement(
      prediction,
      homeTeam.name,
      awayTeam.name,
      lineupInsights,
    ),
    preMatchUpdates: createPreMatchUpdates(),
    scoreReferences: createScoreReferences(prediction, homeTeam.name, awayTeam.name),
    tacticalLevers: createTacticalLevers(prediction),
  };
}
