import { SUB_ROUNDS_PER_ROUND, FORECAST_WIN_ACCURACY } from '../core/constants.js';
import { game } from '../core/state.js';
import { countCrossTiers, gameWinnerEligible } from '../core/cross-outcomes.js';
import { roundForecastStats } from '../game/round-tracker.js';

export const MAX_GAME_SESSIONS = 50;

const tsFmt = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatHistoryTs(ms) {
  if (!ms || !Number.isFinite(ms)) return '';
  return tsFmt.format(new Date(ms));
}

export function lifetimeForecastStats(preds) {
  const rows = preds || [];
  const total = rows.length;
  const correct = rows.filter((p) => p.ok).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return { correct, total, pct };
}

export function crossIndexFromRow(row) {
  if (row.crossIndex != null) return row.crossIndex;
  if (row.cycle != null) return Math.floor(Number(row.cycle) / 10) || 1;
  return 1;
}

export function stageFromRow(row) {
  if (row.stage != null) return row.stage;
  if (row.cycle != null) return Number(row.cycle) % 10 || row.cycle;
  return row.cycle || 1;
}

export function groupRowsByCross(rows) {
  const byCross = {};
  for (let c = 1; c <= SUB_ROUNDS_PER_ROUND; c++) byCross[c] = [];
  for (const row of rows || []) {
    const c = Math.min(SUB_ROUNDS_PER_ROUND, Math.max(1, crossIndexFromRow(row)));
    byCross[c].push(row);
  }
  for (const c of Object.keys(byCross)) {
    byCross[c].sort((a, b) => (a.ts || 0) - (b.ts || 0) || stageFromRow(a) - stageFromRow(b));
  }
  return byCross;
}

function legacyRows(rows) {
  return (rows || []).filter((r) => r.gameNumber == null);
}

function rowsForGame(rows, gameNumber) {
  return (rows || []).filter((r) => r.gameNumber === gameNumber);
}

function tierCountsFromCrossResults(crossResults) {
  return countCrossTiers(crossResults || []);
}

function forecastStatsForRows(rows) {
  return lifetimeForecastStats(rows);
}

/**
 * Persist completed game snapshot before session reset.
 */
export function archiveCompletedGame() {
  const ST = game.ST;
  if (!ST.gameSessions) ST.gameSessions = [];
  const fc = roundForecastStats();
  const tiers = countCrossTiers(game.roundCrossResults);
  const entry = {
    gameNumber: game.roundNumber || ST.activeGameNumber || 1,
    startedAt: ST.activeGameStartedAt || null,
    completedAt: Date.now(),
    forecastCorrect: fc.correct,
    forecastTotal: fc.total,
    forecastPct: fc.pct,
    isWinner: fc.isWinner,
    fullLife: tiers.fullLife,
    partialArc: tiers.partialArc,
    woundedEnd: tiers.woundedEnd,
    extinct: tiers.extinct,
    crossResults: JSON.parse(JSON.stringify(game.roundCrossResults || [])),
  };
  ST.gameSessions.push(entry);
  if (ST.gameSessions.length > MAX_GAME_SESSIONS) {
    ST.gameSessions = ST.gameSessions.slice(-MAX_GAME_SESSIONS);
  }
  ST.activeGameNumber = null;
  ST.activeGameStartedAt = null;
}

/**
 * @returns {{ lifetime: object, games: object[], legacy: object|null }}
 */
export function buildHistorySections(ST, liveGame = game) {
  const preds = ST.predictions || [];
  const log = ST.log || [];
  const lifetime = lifetimeForecastStats(preds);
  const legacyPreds = legacyRows(preds);
  const legacyLog = legacyRows(log);

  const archived = [...(ST.gameSessions || [])].sort((a, b) => (b.gameNumber || 0) - (a.gameNumber || 0));
  const archivedNumbers = new Set(archived.map((s) => s.gameNumber));

  const games = archived.map((session) => ({
    kind: 'game',
    gameNumber: session.gameNumber,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    inProgress: false,
    ...forecastStatsForRows(rowsForGame(preds, session.gameNumber)),
    isWinner: session.isWinner,
    fullLife: session.fullLife,
    partialArc: session.partialArc,
    woundedEnd: session.woundedEnd,
    extinct: session.extinct,
    crossResults: session.crossResults || [],
    predictionsByCross: groupRowsByCross(rowsForGame(preds, session.gameNumber)),
    logByCross: groupRowsByCross(rowsForGame(log, session.gameNumber)),
  }));

  const activeNum = liveGame.roundActive && liveGame.roundNumber ? liveGame.roundNumber : null;
  if (activeNum != null && !archivedNumbers.has(activeNum)) {
    const livePreds = rowsForGame(preds, activeNum);
    const liveFc = forecastStatsForRows(livePreds);
    const tiers = tierCountsFromCrossResults(liveGame.roundCrossResults);
    games.unshift({
      kind: 'game',
      gameNumber: activeNum,
      startedAt: ST.activeGameStartedAt,
      completedAt: null,
      inProgress: true,
      ...liveFc,
      isWinner: gameWinnerEligible(liveFc.pct, tiers.fullLife),
      ...tiers,
      crossResults: liveGame.roundCrossResults || [],
      predictionsByCross: groupRowsByCross(livePreds),
      logByCross: groupRowsByCross(rowsForGame(log, activeNum)),
    });
  }

  games.sort((a, b) => (b.gameNumber || 0) - (a.gameNumber || 0));

  const legacy =
    legacyPreds.length || legacyLog.length
      ? {
          kind: 'legacy',
          predictions: [...legacyPreds].reverse(),
          log: [...legacyLog].reverse(),
        }
      : null;

  return { lifetime, games, legacy };
}
