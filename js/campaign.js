/** Breed campaign slot modifiers (1–5) */
export const BREED_CAMPAIGN = {
  1: {
    label: 'Baseline survey',
    desc: 'Standard crisis pressure — learn the matrix.',
    eventImpactMod: 0,
    defectBonus: 0,
    masterySynergy: 0,
    secretKeys: false,
  },
  2: {
    label: 'Hardened field season',
    desc: 'Environmental impacts hit 10% harder.',
    eventImpactMod: 0.1,
    defectBonus: 0,
    masterySynergy: 0,
    secretKeys: false,
  },
  3: {
    label: 'Mastery protocols',
    desc: '+2 synergy on every correct deploy match.',
    eventImpactMod: 0,
    defectBonus: 0,
    masterySynergy: 2,
    secretKeys: false,
  },
  4: {
    label: 'Fragile genomes',
    desc: 'Defect emergence chance rises.',
    eventImpactMod: 0,
    defectBonus: 0.1,
    masterySynergy: 0,
    secretKeys: false,
  },
  5: {
    label: 'Cryptic resonance',
    desc: 'Old-age stages may unlock harmonic keys.',
    eventImpactMod: 0,
    defectBonus: 0,
    masterySynergy: 0,
    secretKeys: true,
  },
};

export function campaignForSlot(slot) {
  const s = Math.min(5, Math.max(1, Number(slot) || 1));
  return BREED_CAMPAIGN[s];
}

export function applyCampaignEventImpact(ev, breedRound) {
  const camp = campaignForSlot(breedRound);
  const mod = camp.eventImpactMod || 0;
  if (!mod || ev.impact >= 0) return ev;
  return {
    ...ev,
    impact: Math.round(ev.impact * (1 + mod)),
  };
}
