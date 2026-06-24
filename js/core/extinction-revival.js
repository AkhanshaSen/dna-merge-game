import { LIFE_STAGES_PER_SUBROUND, REVIVAL_LAB_BONUS, REVIVAL_VITALITY, RESOURCE_SOFT_CAP } from './constants.js';
import { game } from './state.js';

/** Player foresaw collapse and the cross would end — one revival per animal cross. */
export function isRevivalEligible(lr) {
  if (!lr || game.revivalUsedThisCross) return false;
  if (!lr.guessOk || lr.pred !== 'extinct' || lr.rolled !== 'extinct') return false;
  const health = lr.healthAfter ?? game.healthMeter;
  const crossEnding = lr.resourceOk === false || health <= 0;
  return crossEnding;
}

export function revivalHintReason(lr) {
  if (!lr) return 'the crisis overwhelmed the cohort';
  if (lr.gambit || lr.observe) return 'lab reserves could not fund a full deploy';
  if (lr.resourceOk === false) return 'intervention did not match the crisis';
  if (lr.partialDeploy) return 'only partial field tools were available';
  return 'vitality finally hit zero despite your read';
}

export function applyRevivalLabBonus() {
  const before = Number(game.ST.resources) || 0;
  game.ST.resources = Math.min(RESOURCE_SOFT_CAP, before + REVIVAL_LAB_BONUS);
  return game.ST.resources - before;
}

/** Restore lab + vitality; caller advances life stage after drift. */
export function applyExtinctionRevival() {
  game.revivalUsedThisCross = true;
  game.healthMeter = REVIVAL_VITALITY;
  if (game.HYBRID) game.HYBRID.outcome = null;
  const labAdded = applyRevivalLabBonus();
  return { labAdded, stageBefore: game.lifeStageIndex };
}

export function revivalWouldCompleteCross() {
  return game.lifeStageIndex >= LIFE_STAGES_PER_SUBROUND;
}
