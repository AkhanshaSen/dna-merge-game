import { SUB_ROUNDS_PER_ROUND, LIFE_STAGES_PER_SUBROUND, FORECAST_WIN_ACCURACY } from '../core/constants.js';
import { game } from '../core/state.js';
import {
  CROSS_TIER,
  crossForecastStats,
  countCrossTiers,
  gameWinnerEligible,
} from '../core/cross-outcomes.js';
import { fbGameEndVerdict } from '../core/fallbacks.js';
import { recordPortrait } from '../ui/visuals/creature-visuals.js';

/** e.g. "Game 1 · Cross 3 (final cross)" */
export function gameProgressLabel(opts = {}) {
  const g = game.roundNumber || 1;
  const c = game.subRoundIndex || 1;
  const tagFinal = opts.finalTag !== false && c >= SUB_ROUNDS_PER_ROUND;
  return `Game ${g} · Cross ${c}${tagFinal ? ' (final cross)' : ''}`;
}

/** Crosses that finished without extinction this game. */
export function crossesPassedCount(results = game.roundCrossResults) {
  return (results || []).filter((r) => {
    const tier = r.tier || (r.outcome === 'extinct' ? CROSS_TIER.EXTINCT : CROSS_TIER.FULL_LIFE);
    return tier !== CROSS_TIER.EXTINCT;
  }).length;
}

/** Stats-track line: Game N · Cross M · Passed P · Passes R */
export function gameProgressTrackLabel() {
  const parts = [gameProgressLabel({ finalTag: false })];
  const passed = crossesPassedCount();
  if (passed > 0) parts.push(`Passed <strong class="track-passed">${passed}</strong>`);
  parts.push(`Passes <strong class="track-passes">${game.crossPassesRemaining ?? 0}</strong>`);
  return parts.join(' · ');
}

export function gameProgressBannerHtml(opts = {}) {
  const compact = opts.compact ? ' game-progress-compact' : '';
  const sub = opts.sub
    ? `<span class="game-progress-sub">${opts.sub}</span>`
    : game.PHASE === 'life' && game.lifeStageIndex
      ? `<span class="game-progress-sub">Stage ${game.lifeStageIndex}/${LIFE_STAGES_PER_SUBROUND}</span>`
      : '';
  return `<div class="game-progress anim-up${compact}">
    <span class="game-progress-kicker">Current run</span>
    <span class="game-progress-title">${gameProgressLabel(opts)}</span>${sub}
  </div>`;
}

function thrivingMeta(health, score) {
  const h = Number(health) || 0;
  const s = Number(score) || 0;
  if (h >= 70 && s >= 55) return { label: 'Thriving', detail: `Vitality ${h}% · viability ${s}`, cls: 'cross-thrive-good' };
  if (h >= 40) return { label: 'Wounded but enduring', detail: `Vitality ${h}% · viability ${s}`, cls: 'cross-thrive-mid' };
  if (h > 0) return { label: 'Fragile hold', detail: `Vitality ${h}% · viability ${s}`, cls: 'cross-thrive-low' };
  return { label: 'Collapsed', detail: 'Vitality exhausted', cls: 'cross-thrive-dead' };
}

const TIER_OUTCOME_LABEL = {
  [CROSS_TIER.FULL_LIFE]: '✅ Full natural life',
  [CROSS_TIER.PARTIAL_ARC]: '⚠️ Arc finished — forecasts missed',
  [CROSS_TIER.WOUNDED_END]: '💀 Collapsed at old age',
  [CROSS_TIER.EXTINCT]: '💀 Extinct',
};

function normalizeTier(tier) {
  if (tier === 'survive' || tier === 'full_life') return CROSS_TIER.FULL_LIFE;
  if (tier === CROSS_TIER.FULL_LIFE || tier === CROSS_TIER.PARTIAL_ARC || tier === CROSS_TIER.WOUNDED_END) {
    return tier;
  }
  return CROSS_TIER.EXTINCT;
}

/** Snapshot one animal cross when it ends. */
export function recordCrossOutcome(tier, meta = {}) {
  if (!game.HYBRID) return;
  const cross = game.subRoundIndex || 1;
  const tierNorm = normalizeTier(tier);
  const forecast = meta.forecast || crossForecastStats(cross);
  const { correct, total, pct } = forecast;
  const health = game.healthMeter;
  const score = game.HYBRID.score;
  const thrive =
    tierNorm === CROSS_TIER.FULL_LIFE || tierNorm === CROSS_TIER.PARTIAL_ARC || tierNorm === CROSS_TIER.WOUNDED_END
      ? thrivingMeta(health, score)
      : null;

  if (!game.roundCrossResults) game.roundCrossResults = [];
  game.roundCrossResults.push({
    gameNumber: game.roundNumber || 1,
    crossIndex: cross,
    name: game.HYBRID.name,
    emoji: game.HYBRID.emoji || '🧬',
    pA: game.HYBRID.parentA?.species?.id,
    pB: game.HYBRID.parentB?.species?.id,
    tier: tierNorm,
    outcome: tierNorm === CROSS_TIER.EXTINCT ? 'extinct' : tierNorm === CROSS_TIER.FULL_LIFE ? 'survive' : 'partial',
    fullLife: tierNorm === CROSS_TIER.FULL_LIFE,
    healthMeter: health,
    score,
    lastRoll: meta.rolled || null,
    forecastCorrect: correct,
    forecastTotal: total,
    forecastPct: total ? pct : null,
    thrivingLabel: thrive?.label || null,
    thrivingDetail: thrive?.detail || null,
    thrivingCls: thrive?.cls || 'cross-thrive-dead',
  });
}

export function beginRoundTracking() {
  game.roundPredictionsStartIndex = (game.ST.predictions || []).length;
  game.roundCrossResults = [];
}

/** Guess-to-reality for forecasts made this game (round) only. */
export function roundForecastStats() {
  const start = game.roundPredictionsStartIndex ?? 0;
  const preds = (game.ST.predictions || []).slice(start);
  const total = preds.length;
  const correct = preds.filter((p) => p.ok).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const tiers = countCrossTiers();
  return {
    total,
    correct,
    pct,
    isWinner: gameWinnerEligible(pct, tiers.fullLife),
    threshold: FORECAST_WIN_ACCURACY,
    ...tiers,
  };
}

export function gameEndVerdictMessage() {
  const fc = roundForecastStats();
  return fbGameEndVerdict({
    fullLifeN: fc.fullLife,
    partialN: fc.partialArc,
    woundedN: fc.woundedEnd,
    extinctN: fc.extinct,
    forecastPct: fc.pct,
    isWinner: fc.isWinner,
  });
}

export function roundCrossSummaryHtml() {
  const rows = game.roundCrossResults || [];
  if (!rows.length) {
    return `<p class="matrix-hint">No cross data recorded for this game.</p>`;
  }
  const cards = rows
    .map((r) => {
      const tier = r.tier || (r.fullLife ? CROSS_TIER.FULL_LIFE : r.outcome === 'extinct' ? CROSS_TIER.EXTINCT : CROSS_TIER.PARTIAL_ARC);
      const cardCls =
        tier === CROSS_TIER.FULL_LIFE
          ? 'cross-survived'
          : tier === CROSS_TIER.EXTINCT
            ? 'cross-extinct'
            : 'cross-partial';
      const acc =
        r.forecastTotal > 0
          ? `<span class="cross-acc">${r.forecastCorrect}/${r.forecastTotal} forecasts (${r.forecastPct}%)</span>`
          : `<span class="cross-acc">No forecasts logged</span>`;
      const thrive =
        tier !== CROSS_TIER.EXTINCT
          ? `<div class="cross-thrive ${r.thrivingCls}"><strong>${r.thrivingLabel}</strong> — ${r.thrivingDetail}</div>`
          : `<div class="cross-thrive cross-thrive-dead"><strong>Extinct</strong> — line ended this cross</div>`;
      return `<div class="cross-result-card ${cardCls}">
        <div class="cross-result-hdr">
          ${recordPortrait(r.pA, r.pB, { size: 'sm', animate: true, className: 'cross-result-portrait' })}
          <div>
            <div class="cross-result-name">Cross ${r.crossIndex} · ${r.name}</div>
            <div class="cross-result-outcome">${TIER_OUTCOME_LABEL[tier] || tier}</div>
          </div>
        </div>
        ${thrive}
        ${acc}
      </div>`;
    })
    .join('');
  const tiers = countCrossTiers(rows);
  return `<div class="round-cross-stats anim-up">
    <span class="round-cross-pill round-cross-pill-good">${tiers.fullLife} full life</span>
    <span class="round-cross-pill round-cross-pill-warn">${tiers.partialArc + tiers.woundedEnd} imperfect</span>
    <span class="round-cross-pill round-cross-pill-bad">${tiers.extinct} extinct</span>
  </div>
  <div class="cross-result-grid">${cards}</div>`;
}
