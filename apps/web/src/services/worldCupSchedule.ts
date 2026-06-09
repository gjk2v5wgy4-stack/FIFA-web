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
  date: string;
  time: string;
  stage: string;
  homeTeam: string;
  awayTeam: string;
  region: string;
}

type FixtureTuple = [
  date: string,
  time: string,
  stage: string,
  homeTeam: string,
  awayTeam: string,
  region: string,
];

const dailyTimes = ["12:00", "15:00", "18:00", "21:00", "23:00", "23:30"];

const fixturesByDate: Array<{
  date: string;
  stage: string;
  fixtures: Array<[string, string, string]>;
}> = [
  {
    date: "2026-06-13",
    stage: "小组赛",
    fixtures: [
      ["Haiti", "Scotland", "Boston Stadium"],
      ["Australia", "Türkiye", "BC Place Vancouver"],
      ["Brazil", "Morocco", "New York New Jersey Stadium"],
      ["Qatar", "Switzerland", "San Francisco Bay Area Stadium"],
    ],
  },
  {
    date: "2026-06-14",
    stage: "小组赛",
    fixtures: [
      ["Côte d'Ivoire", "Ecuador", "Philadelphia Stadium"],
      ["Germany", "Curaçao", "Houston Stadium"],
      ["Netherlands", "Japan", "Dallas Stadium"],
      ["Sweden", "Tunisia", "Estadio Monterrey"],
    ],
  },
  {
    date: "2026-06-15",
    stage: "小组赛",
    fixtures: [
      ["Saudi Arabia", "Uruguay", "Miami Stadium"],
      ["Spain", "Cabo Verde", "Atlanta Stadium"],
      ["IR Iran", "New Zealand", "Los Angeles Stadium"],
      ["Belgium", "Egypt", "Seattle Stadium"],
    ],
  },
  {
    date: "2026-06-16",
    stage: "小组赛",
    fixtures: [
      ["France", "Senegal", "New York New Jersey Stadium"],
      ["Iraq", "Norway", "Boston Stadium"],
      ["Argentina", "Algeria", "Kansas City Stadium"],
      ["Austria", "Jordan", "San Francisco Bay Area Stadium"],
    ],
  },
  {
    date: "2026-06-17",
    stage: "小组赛",
    fixtures: [
      ["Ghana", "Panama", "Toronto Stadium"],
      ["England", "Croatia", "Dallas Stadium"],
      ["Portugal", "Congo DR", "Houston Stadium"],
      ["Uzbekistan", "Colombia", "Mexico City Stadium"],
    ],
  },
  {
    date: "2026-06-18",
    stage: "小组赛",
    fixtures: [
      ["Czechia", "South Africa", "Atlanta Stadium"],
      ["Switzerland", "Bosnia and Herzegovina", "Los Angeles Stadium"],
      ["Canada", "Qatar", "BC Place Vancouver"],
      ["Mexico", "Korea Republic", "Estadio Guadalajara"],
    ],
  },
  {
    date: "2026-06-19",
    stage: "小组赛",
    fixtures: [
      ["Brazil", "Haiti", "Philadelphia Stadium"],
      ["Scotland", "Morocco", "Boston Stadium"],
      ["Türkiye", "Paraguay", "San Francisco Bay Area Stadium"],
      ["USA", "Australia", "Seattle Stadium"],
    ],
  },
  {
    date: "2026-06-20",
    stage: "小组赛",
    fixtures: [
      ["Germany", "Côte d'Ivoire", "Toronto Stadium"],
      ["Ecuador", "Curaçao", "Kansas City Stadium"],
      ["Netherlands", "Sweden", "Houston Stadium"],
      ["Tunisia", "Japan", "Estadio Monterrey"],
    ],
  },
  {
    date: "2026-06-21",
    stage: "小组赛",
    fixtures: [
      ["Uruguay", "Cabo Verde", "Miami Stadium"],
      ["Spain", "Saudi Arabia", "Atlanta Stadium"],
      ["Belgium", "IR Iran", "Los Angeles Stadium"],
      ["New Zealand", "Egypt", "BC Place Vancouver"],
    ],
  },
  {
    date: "2026-06-22",
    stage: "小组赛",
    fixtures: [
      ["Norway", "Senegal", "New York New Jersey Stadium"],
      ["France", "Iraq", "Philadelphia Stadium"],
      ["Argentina", "Austria", "Dallas Stadium"],
      ["Jordan", "Algeria", "San Francisco Bay Area Stadium"],
    ],
  },
  {
    date: "2026-06-23",
    stage: "小组赛",
    fixtures: [
      ["England", "Ghana", "Boston Stadium"],
      ["Panama", "Croatia", "Toronto Stadium"],
      ["Portugal", "Uzbekistan", "Houston Stadium"],
      ["Colombia", "Congo DR", "Estadio Guadalajara"],
    ],
  },
  {
    date: "2026-06-24",
    stage: "小组赛",
    fixtures: [
      ["Scotland", "Brazil", "Miami Stadium"],
      ["Morocco", "Haiti", "Atlanta Stadium"],
      ["Switzerland", "Canada", "BC Place Vancouver"],
      ["Bosnia and Herzegovina", "Qatar", "Seattle Stadium"],
      ["Czechia", "Mexico", "Mexico City Stadium"],
      ["South Africa", "Korea Republic", "Estadio Monterrey"],
    ],
  },
  {
    date: "2026-06-25",
    stage: "小组赛",
    fixtures: [
      ["Curaçao", "Côte d'Ivoire", "Philadelphia Stadium"],
      ["Ecuador", "Germany", "New York New Jersey Stadium"],
      ["Japan", "Sweden", "Dallas Stadium"],
      ["Tunisia", "Netherlands", "Kansas City Stadium"],
      ["Türkiye", "USA", "Los Angeles Stadium"],
      ["Paraguay", "Australia", "San Francisco Bay Area Stadium"],
    ],
  },
  {
    date: "2026-06-26",
    stage: "小组赛",
    fixtures: [
      ["Norway", "France", "Boston Stadium"],
      ["Senegal", "Iraq", "Toronto Stadium"],
      ["Egypt", "IR Iran", "Seattle Stadium"],
      ["New Zealand", "Belgium", "BC Place Vancouver"],
      ["Cabo Verde", "Saudi Arabia", "Houston Stadium"],
      ["Uruguay", "Spain", "Estadio Guadalajara"],
    ],
  },
  {
    date: "2026-06-27",
    stage: "小组赛",
    fixtures: [
      ["Panama", "England", "New York New Jersey Stadium"],
      ["Croatia", "Ghana", "Philadelphia Stadium"],
      ["Algeria", "Austria", "Kansas City Stadium"],
      ["Jordan", "Argentina", "Dallas Stadium"],
      ["Colombia", "Portugal", "Miami Stadium"],
      ["Congo DR", "Uzbekistan", "Atlanta Stadium"],
    ],
  },
];

const knockoutFixtureRows: FixtureTuple[] = [
  ["2026-06-28", "20:00", "32强", "A组第2", "B组第2", "Los Angeles Stadium"],
  ["2026-06-29", "12:00", "32强", "E组第1", "A/B/C/D/F组第3", "Boston Stadium"],
  ["2026-06-29", "16:00", "32强", "F组第1", "C组第2", "Estadio Monterrey"],
  ["2026-06-29", "20:00", "32强", "C组第1", "F组第2", "Houston Stadium"],
  ["2026-06-30", "12:00", "32强", "I组第1", "C/D/F/G/H组第3", "New York New Jersey Stadium"],
  ["2026-06-30", "16:00", "32强", "E组第2", "I组第2", "Dallas Stadium"],
  ["2026-06-30", "20:00", "32强", "A组第1", "C/E/F/H/I组第3", "Mexico City Stadium"],
  ["2026-07-01", "12:00", "32强", "L组第1", "E/H/I/J/K组第3", "Atlanta Stadium"],
  ["2026-07-01", "16:00", "32强", "D组第1", "B/E/F/I/J组第3", "San Francisco Bay Area Stadium"],
  ["2026-07-01", "20:00", "32强", "G组第1", "A/E/H/I/J组第3", "Seattle Stadium"],
  ["2026-07-02", "12:00", "32强", "K组第2", "L组第2", "Toronto Stadium"],
  ["2026-07-02", "16:00", "32强", "H组第1", "J组第2", "Los Angeles Stadium"],
  ["2026-07-02", "20:00", "32强", "B组第1", "E/F/G/I/J组第3", "BC Place Vancouver"],
  ["2026-07-03", "12:00", "32强", "J组第1", "H组第2", "Miami Stadium"],
  ["2026-07-03", "16:00", "32强", "K组第1", "D/E/I/J/L组第3", "Kansas City Stadium"],
  ["2026-07-03", "20:00", "32强", "D组第2", "G组第2", "Dallas Stadium"],
  ["2026-07-04", "18:00", "16强", "第74场胜者", "第77场胜者", "Philadelphia Stadium"],
  ["2026-07-04", "21:00", "16强", "第73场胜者", "第75场胜者", "Houston Stadium"],
  ["2026-07-05", "18:00", "16强", "第76场胜者", "第78场胜者", "New York New Jersey Stadium"],
  ["2026-07-05", "21:00", "16强", "第79场胜者", "第80场胜者", "Mexico City Stadium"],
  ["2026-07-06", "18:00", "16强", "第83场胜者", "第84场胜者", "Dallas Stadium"],
  ["2026-07-06", "21:00", "16强", "第81场胜者", "第82场胜者", "Seattle Stadium"],
  ["2026-07-07", "18:00", "16强", "第86场胜者", "第88场胜者", "Atlanta Stadium"],
  ["2026-07-07", "21:00", "16强", "第85场胜者", "第87场胜者", "BC Place Vancouver"],
  ["2026-07-09", "21:00", "四分之一决赛", "第89场胜者", "第90场胜者", "Boston Stadium"],
  ["2026-07-10", "21:00", "四分之一决赛", "第93场胜者", "第94场胜者", "Los Angeles Stadium"],
  ["2026-07-11", "18:00", "四分之一决赛", "第91场胜者", "第92场胜者", "Miami Stadium"],
  ["2026-07-11", "21:00", "四分之一决赛", "第95场胜者", "第96场胜者", "Kansas City Stadium"],
  ["2026-07-14", "21:00", "半决赛", "第97场胜者", "第98场胜者", "Dallas Stadium"],
  ["2026-07-15", "21:00", "半决赛", "第99场胜者", "第100场胜者", "Atlanta Stadium"],
  ["2026-07-19", "02:00", "三四名决赛", "第101场负者", "第102场负者", "Miami Stadium"],
  ["2026-07-20", "03:00", "决赛", "第101场胜者", "第102场胜者", "New York New Jersey Stadium"],
];

const knockoutFixtures: FixtureInput[] = knockoutFixtureRows.map(
  ([date, time, stage, homeTeam, awayTeam, region]) => ({
  date,
  time,
  stage,
  homeTeam,
  awayTeam,
  region,
  }),
);

const groupStageFixtures: FixtureInput[] = fixturesByDate.flatMap(({ date, stage, fixtures }) =>
  fixtures.map(([homeTeam, awayTeam, region], index) => ({
    date,
    time: dailyTimes[index],
    stage,
    homeTeam,
    awayTeam,
    region,
  })),
);

const tournamentFixtures = [...groupStageFixtures, ...knockoutFixtures];

function createKickoffAt(date: string, time: string) {
  return `${date}T${time}:00+08:00`;
}

export async function getTournamentSchedule(): Promise<TournamentMatchStub[]> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  return tournamentFixtures.map((fixture, index) => ({
    matchId: `wc26_match_${String(index + 5).padStart(3, "0")}`,
    stage: fixture.stage,
    kickoffAt: createKickoffAt(fixture.date, fixture.time),
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    region: fixture.region,
    venue: fixture.region,
  }));
}
