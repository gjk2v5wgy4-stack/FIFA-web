import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLiveMatchRiskReport,
  buildLiveSnapshotRagDocument,
  createLiveSnapshotPoller,
  detectLiveSnapshotChanges,
  normalizeLiveMatchSnapshot
} from "../index.js";

function snapshotFixture(overrides = {}) {
  return normalizeLiveMatchSnapshot({
    matchId: "match_france_opponent_001",
    competition: "2026 FIFA World Cup",
    source: "authorized_live_feed",
    observedAt: "2026-06-20T20:15:00Z",
    matchClock: {
      minute: 62,
      period: "second_half",
      status: "live"
    },
    score: {
      home: 0,
      away: 1
    },
    teams: {
      home: {
        teamId: "team_france",
        name: "France"
      },
      away: {
        teamId: "team_opponent",
        name: "Opponent"
      }
    },
    matchEvents: [
      {
        type: "goal",
        minute: 58,
        teamId: "team_opponent",
        description: "Opponent scored from a transition attack"
      }
    ],
    market: {
      source: "authorized_market_feed",
      capturedAt: "2026-06-20T20:15:00Z",
      status: "available",
      usage: "market_context_only",
      fullTimeMoneyline: {
        home: 2.6,
        draw: 3.1,
        away: 2.7
      },
      handicap: {
        homeLine: "-0.25",
        homePrice: 0.98,
        awayLine: "+0.25",
        awayPrice: 0.86
      },
      total: {
        line: "2.5",
        over: 1.02,
        under: 0.82
      }
    },
    stats: {
      possessionPct: {
        home: 58,
        away: 42
      },
      shots: {
        home: 11,
        away: 7
      },
      shotsOnTarget: {
        home: 4,
        away: 3
      },
      xG: {
        home: 1.1,
        away: 0.9
      },
      redCards: {
        home: 0,
        away: 0
      }
    },
    ...overrides
  });
}

test("normalizeLiveMatchSnapshot preserves live score, stats, and market context without stake fields", () => {
  const snapshot = snapshotFixture();

  assert.equal(snapshot.matchId, "match_france_opponent_001");
  assert.equal(snapshot.score.home, 0);
  assert.equal(snapshot.market.usage, "market_context_only");
  assert.equal(Object.hasOwn(snapshot.market, "stakeAmount"), false);
  assert.equal(snapshot.safety.allowedUse, "risk_analysis_only");
});

test("detectLiveSnapshotChanges reports score, red-card, and market movements", () => {
  const previous = snapshotFixture({
    observedAt: "2026-06-20T20:05:00Z",
    score: { home: 0, away: 0 },
    stats: {
      redCards: { home: 0, away: 0 },
      xG: { home: 0.8, away: 0.5 }
    },
    market: {
      fullTimeMoneyline: { home: 1.75, draw: 3.4, away: 4.8 },
      total: { line: "2.5", over: 0.92, under: 0.94 }
    }
  });
  const current = snapshotFixture({
    stats: {
      redCards: { home: 1, away: 0 },
      xG: { home: 1.1, away: 0.9 }
    }
  });

  const changes = detectLiveSnapshotChanges(previous, current);

  assert.equal(changes.scoreChanged, true);
  assert.deepEqual(changes.scoreDelta, { home: 0, away: 1 });
  assert.equal(changes.eventFlags.includes("home_red_card_added"), true);
  assert.equal(changes.marketMovements.length >= 2, true);
  assert.equal(changes.safety.marketUsage, "context_only");
});

test("buildLiveSnapshotRagDocument creates citable RAG content for live context", () => {
  const snapshot = snapshotFixture();
  const changes = detectLiveSnapshotChanges(
    snapshotFixture({ score: { home: 0, away: 0 }, observedAt: "2026-06-20T20:05:00Z" }),
    snapshot
  );

  const document = buildLiveSnapshotRagDocument({ snapshot, changes });

  assert.equal(document.documentId, "live_match_france_opponent_001_2026-06-20T20-15-00Z");
  assert.equal(document.metadata.matchId, "match_france_opponent_001");
  assert.equal(document.metadata.teamId, "team_france");
  assert.equal(document.metadata.sourceType, "stats_feed");
  assert.equal(document.metadata.tags.includes("live_score"), true);
  assert.match(document.content, /Market context is data, not betting advice/);
  assert.match(document.content, /Opponent scored from a transition attack/);
});

test("buildLiveMatchRiskReport describes risk movement without betting or chasing recommendations", () => {
  const previous = snapshotFixture({
    score: { home: 0, away: 0 },
    observedAt: "2026-06-20T20:05:00Z",
    market: {
      fullTimeMoneyline: { home: 1.75, draw: 3.4, away: 4.8 }
    }
  });
  const current = snapshotFixture();

  const report = buildLiveMatchRiskReport({
    previousSnapshot: previous,
    currentSnapshot: current,
    question: "Can France chase after conceding?"
  });

  assert.equal(report.status, "risk_analysis_only");
  assert.equal(report.restrictedActions.includes("stake_sizing"), true);
  assert.equal(report.restrictedActions.includes("market_side_selection"), true);
  assert.match(report.summary, /risk context/);
  assert.doesNotMatch(report.summary, /bet|stake|chase|buy/i);
  assert.equal(report.citations.length, 1);
});

test("createLiveSnapshotPoller runs fixed interval captures through an authorized snapshot supplier", async () => {
  const captured = [];
  let count = 0;
  const poller = createLiveSnapshotPoller({
    intervalMs: 5,
    maxRuns: 2,
    fetchSnapshot: async () => snapshotFixture({ observedAt: `2026-06-20T20:15:0${count++}Z` }),
    onSnapshot: async (snapshot) => {
      captured.push(snapshot.observedAt);
    }
  });

  await poller.start();

  assert.deepEqual(captured, ["2026-06-20T20:15:00Z", "2026-06-20T20:15:01Z"]);
  assert.equal(poller.status().running, false);
  assert.equal(poller.status().runs, 2);
});
