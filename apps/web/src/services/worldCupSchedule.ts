import type { MatchPredictionStub } from "./apiStubs";
import { getTeamDisplay, getVenueDisplay } from "./teamDisplay";

export interface TournamentMatchStub {
  matchId: string;
  stage: string;
  kickoffAt: string;
  homeTeam: string;
  awayTeam: string;
  region: string;
  venue: string;
}

interface FixtureInput {
  ukDate: string;
  ukTime: string;
  stage: string;
  homeTeam: string;
  awayTeam: string;
  region: string;
}

type FixtureTuple = [
  ukDate: string,
  ukTime: string,
  stage: string,
  homeTeam: string,
  awayTeam: string,
  region: string,
];

const officialScheduleRows: FixtureTuple[] = [
  ["2026-06-11", "20:00", "A组", "Mexico", "South Africa", "Mexico City"],
  ["2026-06-12", "03:00", "A组", "South Korea", "Czech Republic", "Zapopan"],
  ["2026-06-12", "20:00", "B组", "Canada", "Bosnia & Herzegovina", "Toronto"],
  ["2026-06-13", "02:00", "D组", "USA", "Paraguay", "Los Angeles"],
  ["2026-06-13", "20:00", "B组", "Qatar", "Switzerland", "Santa Clara"],
  ["2026-06-13", "23:00", "C组", "Brazil", "Morocco", "New Jersey"],
  ["2026-06-14", "02:00", "C组", "Haiti", "Scotland", "Foxborough"],
  ["2026-06-14", "05:00", "D组", "Australia", "Turkey", "Vancouver"],
  ["2026-06-14", "18:00", "E组", "Germany", "Curacao", "Houston"],
  ["2026-06-14", "21:00", "F组", "Netherlands", "Japan", "Arlington"],
  ["2026-06-15", "00:00", "E组", "Ivory Coast", "Ecuador", "Philadelphia"],
  ["2026-06-15", "03:00", "F组", "Sweden", "Tunisia", "Guadalupe"],
  ["2026-06-15", "17:00", "H组", "Spain", "Cape Verde", "Atlanta"],
  ["2026-06-15", "20:00", "G组", "Belgium", "Egypt", "Seattle"],
  ["2026-06-15", "23:00", "H组", "Saudi Arabia", "Uruguay", "Miami"],
  ["2026-06-16", "02:00", "G组", "Iran", "New Zealand", "Los Angeles"],
  ["2026-06-16", "20:00", "I组", "France", "Senegal", "New Jersey"],
  ["2026-06-16", "23:00", "I组", "Iraq", "Norway", "Foxborough"],
  ["2026-06-17", "02:00", "J组", "Argentina", "Algeria", "Kansas City"],
  ["2026-06-17", "05:00", "J组", "Austria", "Jordan", "Santa Clara"],
  ["2026-06-17", "18:00", "K组", "Portugal", "DR Congo", "Houston"],
  ["2026-06-17", "21:00", "L组", "England", "Croatia", "Arlington"],
  ["2026-06-18", "00:00", "L组", "Ghana", "Panama", "Toronto"],
  ["2026-06-18", "03:00", "K组", "Uzbekistan", "Colombia", "Mexico City"],
  ["2026-06-18", "17:00", "A组", "Czech Republic", "South Africa", "Atlanta"],
  ["2026-06-18", "20:00", "B组", "Switzerland", "Bosnia & Herzegovina", "Los Angeles"],
  ["2026-06-18", "23:00", "B组", "Canada", "Qatar", "Vancouver"],
  ["2026-06-19", "02:00", "A组", "Mexico", "South Korea", "Zapopan"],
  ["2026-06-19", "20:00", "D组", "USA", "Australia", "Seattle"],
  ["2026-06-19", "23:00", "C组", "Scotland", "Morocco", "Foxborough"],
  ["2026-06-20", "01:30", "C组", "Brazil", "Haiti", "Philadelphia"],
  ["2026-06-20", "04:00", "D组", "Turkey", "Paraguay", "Santa Clara"],
  ["2026-06-20", "18:00", "F组", "Netherlands", "Sweden", "Houston"],
  ["2026-06-20", "21:00", "E组", "Germany", "Ivory Coast", "Toronto"],
  ["2026-06-21", "01:00", "E组", "Ecuador", "Curacao", "Kansas City"],
  ["2026-06-21", "05:00", "F组", "Tunisia", "Japan", "Guadalupe"],
  ["2026-06-21", "17:00", "H组", "Spain", "Saudi Arabia", "Atlanta"],
  ["2026-06-21", "20:00", "G组", "Belgium", "Iran", "Los Angeles"],
  ["2026-06-21", "23:00", "H组", "Uruguay", "Cape Verde", "Miami"],
  ["2026-06-22", "02:00", "G组", "New Zealand", "Egypt", "Vancouver"],
  ["2026-06-22", "18:00", "J组", "Argentina", "Austria", "Arlington"],
  ["2026-06-22", "22:00", "I组", "France", "Iraq", "Philadelphia"],
  ["2026-06-23", "01:00", "I组", "Norway", "Senegal", "Toronto"],
  ["2026-06-23", "04:00", "J组", "Jordan", "Algeria", "Santa Clara"],
  ["2026-06-23", "18:00", "K组", "Portugal", "Uzbekistan", "Houston"],
  ["2026-06-23", "21:00", "L组", "England", "Ghana", "Foxborough"],
  ["2026-06-24", "00:00", "L组", "Panama", "Croatia", "Foxborough"],
  ["2026-06-24", "03:00", "K组", "Colombia", "DR Congo", "Zapopan"],
  ["2026-06-24", "20:00", "B组", "Switzerland", "Canada", "Vancouver"],
  ["2026-06-24", "20:00", "B组", "Bosnia & Herzegovina", "Qatar", "Seattle"],
  ["2026-06-24", "23:00", "C组", "Morocco", "Haiti", "Atlanta"],
  ["2026-06-24", "23:00", "C组", "Scotland", "Brazil", "Miami"],
  ["2026-06-25", "02:00", "A组", "South Africa", "South Korea", "Guadalupe"],
  ["2026-06-25", "02:00", "A组", "Czech Republic", "Mexico", "Mexico City"],
  ["2026-06-25", "21:00", "E组", "Curacao", "Ivory Coast", "Philadelphia"],
  ["2026-06-25", "21:00", "E组", "Ecuador", "Germany", "New Jersey"],
  ["2026-06-26", "00:00", "F组", "Tunisia", "Netherlands", "Kansas City"],
  ["2026-06-26", "00:00", "F组", "Japan", "Sweden", "Arlington"],
  ["2026-06-26", "03:00", "D组", "Turkey", "USA", "Los Angeles"],
  ["2026-06-26", "03:00", "D组", "Paraguay", "Australia", "Santa Clara"],
  ["2026-06-26", "20:00", "I组", "Norway", "France", "Foxborough"],
  ["2026-06-26", "20:00", "I组", "Senegal", "Iraq", "Toronto"],
  ["2026-06-27", "01:00", "H组", "Cape Verde", "Saudi Arabia", "Houston"],
  ["2026-06-27", "01:00", "H组", "Uruguay", "Spain", "Zapopan"],
  ["2026-06-27", "04:00", "G组", "New Zealand", "Belgium", "Vancouver"],
  ["2026-06-27", "04:00", "G组", "Egypt", "Iran", "Seattle"],
  ["2026-06-27", "22:00", "L组", "Panama", "England", "New Jersey"],
  ["2026-06-27", "22:00", "L组", "Croatia", "Ghana", "Philadelphia"],
  ["2026-06-28", "00:30", "K组", "Colombia", "Portugal", "Miami"],
  ["2026-06-28", "00:30", "K组", "DR Congo", "Uzbekistan", "Atlanta"],
  ["2026-06-28", "03:00", "J组", "Algeria", "Austria", "Kansas City"],
  ["2026-06-28", "03:00", "J组", "Jordan", "Argentina", "Arlington"],
  ["2026-06-28", "20:00", "32强 第73场", "A组第二名", "B组第二名", "Los Angeles"],
  ["2026-06-29", "18:00", "32强 第76场", "C组第一名", "F组第二名", "Houston"],
  ["2026-06-29", "21:30", "32强 第74场", "E组第一名", "A/B/C/D/F组第三名", "Foxborough"],
  ["2026-06-30", "02:00", "32强 第75场", "F组第一名", "C组第二名", "Guadalupe"],
  ["2026-06-30", "18:00", "32强 第78场", "E组第二名", "I组第二名", "Arlington"],
  ["2026-06-30", "22:00", "32强 第77场", "I组第一名", "C/D/F/G/H组第三名", "New Jersey"],
  ["2026-07-01", "02:00", "32强 第79场", "A组第一名", "C/E/F/H/I组第三名", "Mexico City"],
  ["2026-07-01", "17:00", "32强 第80场", "L组第一名", "E/H/I/J/K组第三名", "Atlanta"],
  ["2026-07-01", "21:00", "32强 第82场", "G组第一名", "A/E/H/I/J组第三名", "Seattle"],
  ["2026-07-02", "01:00", "32强 第81场", "D组第一名", "B/E/F/I/J组第三名", "Santa Clara"],
  ["2026-07-02", "20:00", "32强 第84场", "H组第一名", "J组第二名", "Los Angeles"],
  ["2026-07-03", "00:00", "32强 第83场", "K组第二名", "L组第二名", "Toronto"],
  ["2026-07-03", "04:00", "32强 第85场", "B组第一名", "E/F/G/I/J组第三名", "Vancouver"],
  ["2026-07-03", "19:00", "32强 第88场", "D组第二名", "G组第二名", "Arlington"],
  ["2026-07-03", "23:00", "32强 第86场", "J组第一名", "H组第二名", "Miami"],
  ["2026-07-04", "02:30", "32强 第87场", "K组第一名", "D/E/I/J/L组第三名", "Kansas City"],
  ["2026-07-04", "18:00", "16强 第90场", "第73场胜者", "第75场胜者", "Houston"],
  ["2026-07-04", "22:00", "16强 第89场", "第74场胜者", "第77场胜者", "Philadelphia"],
  ["2026-07-05", "21:00", "16强 第91场", "第76场胜者", "第78场胜者", "New Jersey"],
  ["2026-07-06", "01:00", "16强 第92场", "第79场胜者", "第80场胜者", "Mexico City"],
  ["2026-07-06", "20:00", "16强 第93场", "第83场胜者", "第84场胜者", "Arlington"],
  ["2026-07-07", "01:00", "16强 第94场", "第81场胜者", "第82场胜者", "Seattle"],
  ["2026-07-07", "17:00", "16强 第95场", "第86场胜者", "第88场胜者", "Atlanta"],
  ["2026-07-07", "21:00", "16强 第96场", "第85场胜者", "第87场胜者", "Vancouver"],
  ["2026-07-09", "21:00", "四分之一决赛 第97场", "第89场胜者", "第90场胜者", "Foxborough"],
  ["2026-07-10", "20:00", "四分之一决赛 第98场", "第93场胜者", "第94场胜者", "Los Angeles"],
  ["2026-07-11", "22:00", "四分之一决赛 第99场", "第91场胜者", "第92场胜者", "Miami"],
  ["2026-07-12", "02:00", "四分之一决赛 第100场", "第95场胜者", "第96场胜者", "Kansas City"],
  ["2026-07-14", "20:00", "半决赛 第101场", "第97场胜者", "第98场胜者", "Arlington"],
  ["2026-07-15", "20:00", "半决赛 第102场", "第99场胜者", "第100场胜者", "Atlanta"],
  ["2026-07-18", "22:00", "三四名决赛 第103场", "第101场负者", "第102场负者", "Miami"],
  ["2026-07-19", "20:00", "决赛 第104场", "第101场胜者", "第102场胜者", "New Jersey"],
];

const tournamentFixtures: FixtureInput[] = officialScheduleRows.map(
  ([ukDate, ukTime, stage, homeTeam, awayTeam, region]) => ({
    ukDate,
    ukTime,
    stage,
    homeTeam,
    awayTeam,
    region,
  }),
);

function createBeijingKickoffAt(ukDate: string, ukTime: string) {
  const [year, month, day] = ukDate.split("-").map(Number);
  const [hour, minute] = ukTime.split(":").map(Number);
  const beijingDate = new Date(Date.UTC(year, month - 1, day, hour + 7, minute));
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${beijingDate.getUTCFullYear()}-${pad(beijingDate.getUTCMonth() + 1)}-${pad(
    beijingDate.getUTCDate(),
  )}T${pad(beijingDate.getUTCHours())}:${pad(beijingDate.getUTCMinutes())}:00+08:00`;
}

export async function getTournamentSchedule(): Promise<TournamentMatchStub[]> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  return tournamentFixtures.map((fixture, index) => ({
    matchId: `wc26_match_${String(index + 1).padStart(3, "0")}`,
    stage: fixture.stage,
    kickoffAt: createBeijingKickoffAt(fixture.ukDate, fixture.ukTime),
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    region: fixture.region,
    venue: fixture.region,
  }));
}

function createSeed(input: string) {
  return [...input].reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function createProbabilities(matchId: string) {
  const seed = createSeed(matchId);
  const homeWin = 0.34 + (seed % 17) / 100;
  const draw = 0.23 + ((seed >> 2) % 8) / 100;
  const awayWin = Math.max(0.18, 1 - homeWin - draw);
  const total = homeWin + draw + awayWin;

  return {
    homeWin: homeWin / total,
    draw: draw / total,
    awayWin: awayWin / total,
  };
}

export function createPredictionFromSchedule(
  match: TournamentMatchStub,
): MatchPredictionStub {
  const homeTeam = getTeamDisplay(match.homeTeam);
  const awayTeam = getTeamDisplay(match.awayTeam);
  const probabilities = createProbabilities(match.matchId);
  const seed = createSeed(`${match.matchId}-${match.homeTeam}-${match.awayTeam}`);

  return {
    predictionId: `pred_${match.matchId}`,
    matchId: match.matchId,
    modelVersion: "football-models-0.1.0",
    kickoffAt: match.kickoffAt,
    venue: getVenueDisplay(match.venue),
    homeTeam: {
      teamId: `team_${homeTeam.code.toLowerCase() || "home"}`,
      name: match.homeTeam,
      code: homeTeam.code || "主队",
      form: ["W", "D", "W", "L", "W"],
    },
    awayTeam: {
      teamId: `team_${awayTeam.code.toLowerCase() || "away"}`,
      name: match.awayTeam,
      code: awayTeam.code || "客队",
      form: ["D", "W", "L", "D", "W"],
    },
    probabilities,
    expectedGoals: {
      home: 1.05 + (seed % 70) / 100,
      away: 0.92 + ((seed >> 3) % 64) / 100,
    },
    scoreDistribution: [
      { homeGoals: 1, awayGoals: 1, probability: 0.12 },
      { homeGoals: 2, awayGoals: 1, probability: 0.1 },
      { homeGoals: 1, awayGoals: 0, probability: 0.09 },
      { homeGoals: 0, awayGoals: 1, probability: 0.08 },
    ],
    explanations: [
      "概率预测基于近期状态、xG趋势、阵型稳定性和赛前情报。",
      "主要风险来自阵容临时变化、旅途恢复、场地气候和关键球员健康状况。",
      "模型输出保留不确定性，需要结合最新球队动态和RAG摘要复核。",
    ],
    citations: [
      {
        documentId: "doc_team_form",
        chunkId: `${match.matchId}_form`,
        sourceName: "球队历史表现数据",
        sourceUrl: "https://source.example.com/team-form",
        publishedAt: "2026-06-01T00:00:00Z",
      },
      {
        documentId: "doc_match_context",
        chunkId: `${match.matchId}_context`,
        sourceName: "比赛环境与阵容动态",
        sourceUrl: "https://source.example.com/match-context",
        publishedAt: "2026-06-02T00:00:00Z",
      },
    ],
    usage: {
      tokensCharged: 800,
      remainingTokens: 76000,
      lowBalance: false,
    },
  };
}
