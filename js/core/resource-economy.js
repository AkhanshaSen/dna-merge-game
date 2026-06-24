import {
  RESOURCES,
  RESOURCE_SOFT_CAP,
  MIN_LAB_FOR_DEPLOY,
  STEWARD_REFUND,
  DEVIL_MIN_STAGES,
  DEVIL_WRONG_RATIO,
  CROSS_LAB_STIPEND,
} from './constants.js';
import { synergyBonus } from './game-logic.js';
import { crisisHasSynergyDeploys } from './deploy-match.js';
import { game } from './state.js';

export function deployLabCost(res) {
  if (!res || res.type === 'cure') return 0;
  if (res.type === 'observe') return 0;
  return Number(res.labCost) ?? MIN_LAB_FOR_DEPLOY;
}

export function canAffordDeploy(res, resources) {
  const cost = deployLabCost(res);
  if (cost <= 0) return true;
  return Number(resources) >= cost;
}

/** Cheapest survival deploy the player could still fund */
export function cheapestAffordableDeploy(resources) {
  const survival = RESOURCES.filter((r) => r.type === 'survival');
  const affordable = survival.filter((r) => canAffordDeploy(r, resources));
  if (!affordable.length) return null;
  return affordable.reduce((a, b) => (deployLabCost(a) <= deployLabCost(b) ? a : b));
}

export function isGambitMode(resources) {
  return !cheapestAffordableDeploy(resources);
}

export function syncGambitMode() {
  game.gambitMode = isGambitMode(game.ST.resources);
  if (game.gambitMode) {
    game.LIFE_RES = null;
  }
  return game.gambitMode;
}

export function estimatedDeploysLeft(resources) {
  const avg =
    RESOURCES.filter((r) => r.type === 'survival').reduce((s, r) => s + deployLabCost(r), 0) /
    Math.max(1, RESOURCES.filter((r) => r.type === 'survival').length);
  return Math.floor(Number(resources) / avg);
}

export function crisisHasSynergyHints(ev) {
  return crisisHasSynergyDeploys(ev);
}

export function trackDeployChoice(ev, chosenRes, resourceOk) {
  if (!game.roundDeployStats) game.roundDeployStats = { total: 0, wrong: 0 };
  if (!crisisHasSynergyHints(ev)) return;
  game.roundDeployStats.total += 1;
  if (!resourceOk) game.roundDeployStats.wrong += 1;
}

export function shouldShowDevilModal() {
  const s = game.roundDeployStats;
  if (!s || game.devilShownThisRound) return false;
  if (s.total < DEVIL_MIN_STAGES) return false;
  return s.wrong / s.total > DEVIL_WRONG_RATIO;
}

export function triggerDevilIfNeeded() {
  if (!shouldShowDevilModal()) return false;
  game.isDevilMarked = true;
  game.devilShownThisRound = true;
  game.showDevilModal = true;
  return true;
}

export function applyStewardshipRefund(resourceOk, guessOk) {
  if (!resourceOk || !guessOk) return 0;
  const before = game.ST.resources;
  game.ST.resources = Math.min(RESOURCE_SOFT_CAP, before + STEWARD_REFUND);
  return game.ST.resources - before;
}

export function deductDeployCost(res) {
  const cost = deployLabCost(res);
  if (cost <= 0) return 0;
  game.ST.resources = Math.max(0, Number(game.ST.resources) - cost);
  syncGambitMode();
  return cost;
}

export function isLabDepleted(resources = game.ST.resources) {
  return Number(resources) < MIN_LAB_FOR_DEPLOY;
}

/**
 * Shared round budget (max 15) — each new cross tops up to {@link CROSS_LAB_STIPEND} if below.
 * @returns units granted
 */
export function applyCrossLabStipend() {
  const before = Number(game.ST.resources) || 0;
  if (before >= CROSS_LAB_STIPEND) return 0;
  game.ST.resources = Math.min(RESOURCE_SOFT_CAP, CROSS_LAB_STIPEND);
  syncGambitMode();
  return game.ST.resources - before;
}
