import { SURVIVAL_CYCLES_IN_COHORT, LIFE_STAGE_LABELS } from './constants.js';
import { campaignForSlot } from './campaign.js';

/** Narrative maturity — keyed by survival cycle 1–4 */
export const CYCLE_PROFILE = {
  1: {
    maturity: 'Neonate cohort',
    ageLabel: 'Gen 0 · First landscape pulse · maximal plasticity',
  },
  2: {
    maturity: 'Juvenile stabilization',
    ageLabel: 'Gen 1 · dispersal · defect diagnostics & parallel pressures',
  },
  3: {
    maturity: 'Sub-adult establishment',
    ageLabel: 'Gen 1–2 · territory traction · breeder recruitment window',
  },
  4: {
    maturity: 'Prime adaptive crucible',
    ageLabel: 'Gen 2+ · apex environmental sorting · final stochastic gate',
  },
};

/** @param {number} cycleNum Survival cycle index 1–4 */
export function cycleLifeBanner(cycleNum, arcRound = 0) {
  const p = CYCLE_PROFILE[cycleNum];
  if (!p) return '';
  const arc = arcRound >= 1 && arcRound <= 2 ? ` · Arc <strong>${arcRound}/2</strong>` : '';
  return `<div class="life-banner anim-up stage-banner-${cycleNum}">
    <div class="life-mat">${p.maturity}</div>
    <div class="life-age">${p.ageLabel}</div>
    <div class="life-round">Life stage <strong>${cycleNum}/${SURVIVAL_CYCLES_IN_COHORT}</strong>${arc}</div>
  </div>`;
}

const STAGE_COLORS = ['var(--stage-1)', 'var(--stage-2)', 'var(--stage-3)', 'var(--stage-4)'];

/** Spore-style horizontal life-stage track */
export function lifeStageTimelineHtml(activeStage) {
  const nodes = LIFE_STAGE_LABELS.map((label, i) => {
    const n = i + 1;
    let cls = 'lt-node';
    if (n < activeStage) cls += ' done';
    else if (n === activeStage) cls += ' active';
    else cls += ' locked';
    return `<div class="${cls}" style="--stage-color:${STAGE_COLORS[i]}">
      <span class="lt-dot"></span>
      <span class="lt-lbl">${label}</span>
    </div>`;
  }).join('');
  return `<div class="life-timeline anim-up" aria-label="Life stages">${nodes}</div>`;
}

export function breedCampaignBanner(breedRound) {
  const c = campaignForSlot(breedRound);
  return `<div class="campaign-banner anim-up">
    <span class="campaign-slot">Slot ${breedRound}/5</span>
    <strong>${c.label}</strong> — ${c.desc}
  </div>`;
}
