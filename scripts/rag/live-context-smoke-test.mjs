import {
  buildLiveMatchRiskReport,
  buildLiveSnapshotRagDocument,
  createLiveSnapshotPoller,
  detectLiveSnapshotChanges,
  normalizeLiveMatchSnapshot
} from "../../packages/rag-core/index.js";

const snapshots = [
  normalizeLiveMatchSnapshot({
    matchId: "match_france_opponent_001",
    competition: "2026 FIFA World Cup",
    source: "authorized_live_score_feed",
    observedAt: "2026-06-20T20:05:00Z",
    matchClock: { minute: 55, period: "second_half", status: "live" },
    score: { home: 0, away: 0 },
    teams: {
      home: { teamId: "team_france", name: "France" },
      away: { teamId: "team_opponent", name: "Opponent" }
    },
    stats: {
      possessionPct: { home: 57, away: 43 },
      shots: { home: 9, away: 6 },
      shotsOnTarget: { home: 3, away: 2 },
      xG: { home: 0.8, away: 0.5 },
      redCards: { home: 0, away: 0 }
    },
    market: {
      source: "authorized_market_feed",
      capturedAt: "2026-06-20T20:05:00Z",
      status: "available",
      fullTimeMoneyline: { home: 1.75, draw: 3.4, away: 4.8 },
      total: { line: "2.5", over: 0.92, under: 0.94 }
    }
  }),
  normalizeLiveMatchSnapshot({
    matchId: "match_france_opponent_001",
    competition: "2026 FIFA World Cup",
    source: "authorized_live_score_feed",
    observedAt: "2026-06-20T20:15:00Z",
    matchClock: { minute: 62, period: "second_half", status: "live" },
    score: { home: 0, away: 1 },
    teams: {
      home: { teamId: "team_france", name: "France" },
      away: { teamId: "team_opponent", name: "Opponent" }
    },
    matchEvents: [
      {
        type: "goal",
        minute: 58,
        teamId: "team_opponent",
        description: "Opponent scored from a transition attack"
      }
    ],
    stats: {
      possessionPct: { home: 58, away: 42 },
      shots: { home: 11, away: 7 },
      shotsOnTarget: { home: 4, away: 3 },
      xG: { home: 1.1, away: 0.9 },
      redCards: { home: 0, away: 0 }
    },
    market: {
      source: "authorized_market_feed",
      capturedAt: "2026-06-20T20:15:00Z",
      status: "available",
      fullTimeMoneyline: { home: 2.6, draw: 3.1, away: 2.7 },
      total: { line: "2.5", over: 1.02, under: 0.82 }
    }
  })
];

const captured = [];
let nextSnapshot = 0;

const poller = createLiveSnapshotPoller({
  intervalMs: 5,
  maxRuns: snapshots.length,
  fetchSnapshot: async () => snapshots[nextSnapshot++],
  onSnapshot: (snapshot) => {
    captured.push(snapshot);
  }
});

await poller.start();

const changes = detectLiveSnapshotChanges(captured[0], captured[1]);
const ragDocument = buildLiveSnapshotRagDocument({
  snapshot: captured[1],
  changes
});
const report = buildLiveMatchRiskReport({
  previousSnapshot: captured[0],
  currentSnapshot: captured[1],
  question: "Explain live risk movement after a score change."
});

console.log(
  JSON.stringify(
    {
      pollerStatus: poller.status(),
      capturedCount: captured.length,
      scoreChanged: changes.scoreChanged,
      marketMovementCount: changes.marketMovements.length,
      ragDocumentId: ragDocument.documentId,
      reportStatus: report.status,
      restrictedActions: report.restrictedActions
    },
    null,
    2
  )
);
