import { SURVIVAL_CYCLES_IN_COHORT } from './constants.js';

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
  return `<div class="life-banner anim-up">
    <div class="life-mat">${p.maturity}</div>
    <div class="life-age">${p.ageLabel}</div>
    <div class="life-round">Life stage <strong>${cycleNum}/${SURVIVAL_CYCLES_IN_COHORT}</strong>${arc}</div>
  </div>`;
}
