import { RESOURCES } from './constants.js';
import { synergyBonus } from './game-logic.js';

/** Best matching deployable for this crisis (tie → first in RESOURCES order). */
export function canonicalCorrectResource(ev) {
  if (!ev) return RESOURCES[0];
  let best = RESOURCES[0];
  let bestSyn = synergyBonus(ev, best);
  for (let i = 1; i < RESOURCES.length; i++) {
    const r = RESOURCES[i];
    const s = synergyBonus(ev, r);
    if (s > bestSyn) {
      bestSyn = s;
      best = r;
    }
  }
  if (bestSyn <= 0) {
    const survivalFirst = RESOURCES.find((r) => r.type === 'survival');
    return survivalFirst || RESOURCES[0];
  }
  return best;
}

/**
 * Projected survival % for one life-stage beat — simplified ledger (no legacy 4-beat baggage).
 * @param {number} lifeStageIndex 0..3 → birth…old age
 */
export function survivalRateLifeStage(ev, res, hybrid, lifeStageIndex, careMatePct = 0, legacyFlat = 0) {
  if (!ev || !hybrid) return 50;
  const deploy = res ? res.bonus : 0;
  const syn = synergyBonus(ev, res);
  const cohortBlend = hybrid.sameSpeciesRenewal ? 10 : -6;
  const stageStrain = lifeStageIndex * 3;
  let r =
    hybrid.score +
    cohortBlend +
    ev.impact +
    deploy +
    syn +
    careMatePct +
    legacyFlat -
    stageStrain;
  return Math.max(12, Math.min(94, Math.round(r)));
}

/** Dice curve tightens toward old age */
export function dicePhaseForLifeStage(lifeStageIndex) {
  if (lifeStageIndex <= 1) return 'early';
  if (lifeStageIndex === 2) return 'establishment';
  return 'apex';
}
