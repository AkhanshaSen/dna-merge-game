import {
  LIFE_STAGES_PER_SUBROUND,
  CROSS_FORECAST_MIN_CORRECT,
  FORECAST_WIN_ACCURACY,
} from './constants.js';
import { game } from './state.js';

export const CROSS_TIER = {
  EXTINCT: 'extinct',
  FULL_LIFE: 'fullLife',
  PARTIAL_ARC: 'partialArc',
  WOUNDED_END: 'woundedEnd',
};

export function predictionsForCross(crossIndex) {
  return (game.ST.predictions || []).filter((p) => Math.floor((p.cycle || 0) / 10) === crossIndex);
}

export function crossForecastStats(crossIndex = game.subRoundIndex || 1) {
  const preds = predictionsForCross(crossIndex);
  const total = preds.length;
  const correct = preds.filter((p) => p.ok).length;
  return {
    correct,
    total,
    pct: total ? Math.round((correct / total) * 100) : 0,
    meetsBar: correct >= CROSS_FORECAST_MIN_CORRECT && total >= LIFE_STAGES_PER_SUBROUND,
  };
}

/**
 * After a stage receipt when cross may end (stage 4 complete path).
 * @returns {{ tier: string, forecast: object, rolled: string }}
 */
export function evaluateCrossEnd(lr) {
  const rolled = lr?.rolled || 'survive';
  const forecast = crossForecastStats();

  if (!lr?.resourceOk || game.healthMeter <= 0) {
    return { tier: CROSS_TIER.EXTINCT, forecast, rolled };
  }

  if (game.lifeStageIndex < LIFE_STAGES_PER_SUBROUND) {
    return { tier: null, forecast, rolled };
  }

  if (rolled === 'extinct') {
    return { tier: CROSS_TIER.WOUNDED_END, forecast, rolled };
  }

  if (forecast.meetsBar) {
    return { tier: CROSS_TIER.FULL_LIFE, forecast, rolled };
  }

  return { tier: CROSS_TIER.PARTIAL_ARC, forecast, rolled };
}

export function countCrossTiers(rows) {
  const r = rows || game.roundCrossResults || [];
  return {
    fullLife: r.filter((x) => x.tier === CROSS_TIER.FULL_LIFE).length,
    partialArc: r.filter((x) => x.tier === CROSS_TIER.PARTIAL_ARC).length,
    woundedEnd: r.filter((x) => x.tier === CROSS_TIER.WOUNDED_END).length,
    extinct: r.filter((x) => x.tier === CROSS_TIER.EXTINCT).length,
  };
}

export function gameWinnerEligible(forecastPct, fullLifeCount) {
  return fullLifeCount >= 1 && forecastPct > FORECAST_WIN_ACCURACY;
}
