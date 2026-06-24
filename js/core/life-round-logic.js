import { synergyBonus } from './game-logic.js';
import { canonicalCorrectResource } from './deploy-match.js';
import { campaignForSlot } from './campaign.js';
import { game as G } from './state.js';

export { canonicalCorrectResource };

/**
 * Projected survival % for one life-stage beat — simplified ledger (no legacy 4-beat baggage).
 * @param {number} lifeStageIndex 0..3 → birth…old age
 */
function defectPenalty(hybrid) {
  if (!hybrid?.defect?.penalty) return 0;
  const { trait, amount } = hybrid.defect.penalty;
  if (hybrid.defectCured) return 0;
  const val = hybrid.traits?.[trait];
  if (val != null && val < 40) return amount + 4;
  return amount;
}

function carePerkBonus(hybrid, ev) {
  const perk = hybrid?.carePerk;
  if (!perk) return 0;
  if (perk.health && perk.id === 'vitality') return 0;
  const tags = ev?.tags || [];
  if (perk.tag && tags.includes(perk.tag)) return perk.bonus || 0;
  if (perk.id === 'immune' && tags.includes('disease')) return perk.bonus || 0;
  if (perk.id === 'climate' && tags.includes('climate')) return perk.bonus || 0;
  return 0;
}

export function survivalRateLifeStage(ev, res, hybrid, lifeStageIndex, careMatePct = 0, legacyFlat = 0) {
  if (!ev || !hybrid) return 50;
  const deploy = res ? res.bonus : 0;
  let syn = synergyBonus(ev, res);
  const camp = campaignForSlot(G.ST?.breedRound || 1);
  if (camp.masterySynergy && syn > 0) syn += camp.masterySynergy;
  const cohortBlend = hybrid.sameSpeciesRenewal ? 10 : -4;
  const stageStrain = lifeStageIndex * 2;
  const fightSpirit = 4;
  const defPen = defectPenalty(hybrid);
  const perk = carePerkBonus(hybrid, ev);
  let secretAdj = 0;
  if (G.secretKey?.applied && lifeStageIndex >= 3) {
    secretAdj = G.secretKey.deltaPct || 0;
  }
  let r =
    hybrid.score +
    cohortBlend +
    ev.impact +
    deploy +
    syn +
    careMatePct +
    legacyFlat +
    perk +
    secretAdj +
    fightSpirit -
    stageStrain -
    defPen;
  return Math.max(18, Math.min(94, Math.round(r)));
}

/** Dice curve tightens toward old age */
export function dicePhaseForLifeStage(lifeStageIndex) {
  if (lifeStageIndex <= 1) return 'early';
  if (lifeStageIndex === 2) return 'establishment';
  return 'apex';
}
