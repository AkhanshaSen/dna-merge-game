import { RESOURCES } from './constants.js';
import { synergyBonus } from './game-logic.js';
import { canAffordDeploy } from './resource-economy.js';

export function maxSynergyForCrisis(ev) {
  if (!ev) return 0;
  let best = 0;
  for (const r of RESOURCES) {
    if (r.type === 'survival' || r.type === 'fallback') {
      best = Math.max(best, synergyBonus(ev, r));
    }
  }
  return best;
}

export function crisisHasSynergyDeploys(ev) {
  return maxSynergyForCrisis(ev) > 0;
}

/** Deploy cards that synergise with this crisis (for UI hints) */
export function recommendedDeploysForCrisis(ev) {
  if (!ev) return [];
  return RESOURCES.filter(
    (r) => (r.type === 'survival' || r.type === 'fallback') && synergyBonus(ev, r) > 0,
  ).sort((a, b) => synergyBonus(ev, b) - synergyBonus(ev, a));
}

export function canAffordAnySynergyDeploy(ev, resources) {
  return recommendedDeploysForCrisis(ev).some((r) => canAffordDeploy(r, resources));
}

export function isImproviseDeploy(res) {
  return res?.type === 'fallback' || res?.id === 'improvise';
}

export function isObserveDeploy(res) {
  return res?.type === 'observe' || res?.id === 'observe';
}

/**
 * Canonical best deploy for scoring — improvise when nothing else matches.
 */
export function canonicalCorrectResource(ev) {
  if (!ev) return RESOURCES[0];
  const ranked = recommendedDeploysForCrisis(ev);
  if (ranked.length) return ranked[0];
  return RESOURCES.find((r) => r.id === 'improvise') || RESOURCES[0];
}

export function isDeployCorrectForCrisis(ev, chosenRes, resources) {
  if (!ev || !chosenRes) return false;
  if (isObserveDeploy(chosenRes)) return true;
  if (isImproviseDeploy(chosenRes)) {
    if (!crisisHasSynergyDeploys(ev)) return true;
    if (!canAffordAnySynergyDeploy(ev, resources)) return true;
    return false;
  }
  if (synergyBonus(ev, chosenRes) > 0) return true;
  const correct = canonicalCorrectResource(ev);
  return chosenRes.id === correct.id;
}

export function crisisDeployHintText(ev) {
  const rec = recommendedDeploysForCrisis(ev);
  if (!rec.length) {
    return 'No standard deploy fits — use <strong>Improvised Field Response</strong> or <strong>Monitor Only</strong>.';
  }
  const names = rec
    .slice(0, 4)
    .map((r) => `${r.emoji} ${r.name.split(' ')[0]}`)
    .join(' · ');
  return `Best leverage: ${names}`;
}
