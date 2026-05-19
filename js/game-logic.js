import { EVENTS, DEFECT_POOL } from './constants.js';
import { game as G } from './state.js';

export function rndEvent(excludeId = null) {
  const pool = excludeId ? EVENTS.filter((e) => e.id !== excludeId) : EVENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function rndDefects(n = 2) {
  return [...DEFECT_POOL].sort(() => Math.random() - 0.5).slice(0, n);
}

export function scoreColor(n) {
  return n >= 65 ? 'var(--green)' : n >= 38 ? 'var(--amber)' : 'var(--red)';
}

/** Peak survival threshold before Cycle 4 apex — Slot 5 lowers gate */
export function secretKeyPeakThreshold() {
  return G.ST.breedRound === 5 ? 65 : 75;
}

function lineageCycleBonus() {
  return Math.min(11, (G.CYCLE_DEPTH || 0) * 2);
}

export function synergyBonus(ev, res) {
  if (!ev || !res) return 0;
  const rid = res.id;
  const evId = ev.id;
  if (evId === 'disease' && rid === 'vaccine') return 12;
  if (evId === 'parasite_wave' && rid === 'vaccine') return 11;
  if ((evId === 'pollution' || evId === 'algal_bloom' || evId === 'mining') && rid === 'vaccine') return 10;
  if ((evId === 'food' || evId === 'drought') && rid === 'food') return 8;
  if (evId === 'habitat' && rid === 'habitat') return 10;
  if ((evId === 'predator' || evId === 'invasive_plant') && rid === 'habitat') return 9;
  if ((evId === 'shipping_lane' || evId === 'bycatch') && rid === 'patrol') return 10;
  if ((evId === 'human' || evId === 'illegal_trade' || evId === 'predator') && rid === 'patrol') return 9;
  if (evId === 'seismic' && rid === 'shelter') return 10;
  if ((evId === 'fire' || evId === 'windstorm' || evId === 'cold_snap' || evId === 'heat_dome') && rid === 'shelter')
    return 9;
  if ((evId === 'drought' || evId === 'flood') && rid === 'shelter') return 8;
  return 0;
}

/** Slot 3 mastery — flat synergy rider when any deploy is queued */
function masterySynergyRider(res) {
  return G.ST.breedRound === 3 && res ? 2 : 0;
}

function crisisForCycle(cycle) {
  if (cycle === 1) return G.EVENT;
  if (cycle === 2) return G.EVENT_C2;
  if (cycle === 3) return G.EVENT;
  if (cycle === 4) return G.EVENT_C4;
  return null;
}

function resForCycle(cycle) {
  if (cycle === 1) return G.RES;
  if (cycle === 2) return G.RES_C2;
  if (cycle === 3) return G.RES_C3;
  if (cycle === 4) return G.RES_C4;
  return null;
}

/**
 * @param {number|object} optsOrPenalty Legacy: number = extraPenalty preview on Cycle 2. Prefer `{ cycle, extraPenalty }`.
 */
export function survivalRate(optsOrPenalty = {}) {
  let opts = {};
  if (typeof optsOrPenalty === 'number') {
    opts = { cycle: 2, extraPenalty: optsOrPenalty, trackPeak: true };
  } else {
    opts = { ...optsOrPenalty };
    opts.cycle = opts.cycle ?? 1;
    opts.extraPenalty = opts.extraPenalty ?? 0;
    if (opts.trackPeak === undefined) opts.trackPeak = true;
  }

  const cycle = opts.cycle;
  const extraPenalty = opts.extraPenalty;

  const ev = crisisForCycle(cycle);
  if (!G.HYBRID || !ev) return 0;

  const res = resForCycle(cycle);
  let crisisImpact = ev.impact;
  if (cycle === 4 && typeof ev.extraImpact === 'number') {
    crisisImpact += ev.extraImpact;
  }

  let syn = synergyBonus(ev, res) + masterySynergyRider(res);
  const deploy = res ? res.bonus : 0;
  const lineage = lineageCycleBonus();
  const cohortBlend = G.HYBRID.sameSpeciesRenewal ? 10 : -6;

  let secretAdj = 0;
  if (cycle === 4 && G.secretKey) {
    const mode = opts.secretMode || 'auto';
    const useSecret =
      mode === 'on' ? true : mode === 'off' ? false : !!G.secretKey.applied;
    if (useSecret) secretAdj = G.secretKey.deltaPct || 0;
  }

  let r =
    G.HYBRID.score +
    cohortBlend +
    crisisImpact +
    deploy +
    syn +
    lineage -
    (G.DEF_PENALTY || 0) -
    extraPenalty +
    secretAdj;

  const rate = Math.max(12, Math.min(94, Math.round(r)));

  const peakEligibleCycle = cycle === 1 || cycle === 2 || cycle === 3;
  if (opts.trackPeak && peakEligibleCycle) {
    G.peakSurvivalPct = Math.max(G.peakSurvivalPct || 0, rate);
  }

  return rate;
}

/** Itemised rows for UI — deltas are contribution toward survival index (can be negative). */
export function survivalBreakdown(cycle, extraPenalty = 0) {
  const ev = crisisForCycle(cycle);
  if (!G.HYBRID || !ev) return { lines: [], total: 0 };

  const res = resForCycle(cycle);
  let crisisImpact = ev.impact;
  if (cycle === 4 && typeof ev.extraImpact === 'number') {
    crisisImpact += ev.extraImpact;
  }

  const synBase = synergyBonus(ev, res);
  const mastery = masterySynergyRider(res);
  const syn = synBase + mastery;
  const deploy = res ? res.bonus : 0;
  const lineage = lineageCycleBonus();
  const cohortVal = G.HYBRID.sameSpeciesRenewal ? 10 : -6;
  let secretAdj = 0;
  if (cycle === 4 && G.secretKey?.applied) {
    secretAdj = G.secretKey.deltaPct || 0;
  }

  const crisisSuffix = cycle === 4 ? ' (apex surcharge)' : '';

  const lines = [
    { label: 'Baseline viability index', val: G.HYBRID.score },
    {
      label: G.HYBRID.sameSpeciesRenewal ? 'Same-species renewal cohesion' : 'Cross-lineage hybrid friction',
      val: cohortVal,
    },
    {
      label: `${ev.emoji} Crisis · ${ev.name}${crisisSuffix}`,
      val: crisisImpact,
    },
  ];

  if (deploy) lines.push({ label: `Deploy · ${res.name}`, val: deploy });
  else lines.push({ label: 'Deploy · none queued', val: 0 });

  if (syn) {
    lines.push({
      label:
        mastery > 0 && synBase > 0
          ? `Crisis–deploy synergy (+${mastery} mastery)`
          : mastery > 0 && !synBase
            ? `Mastery synergy rider (+${mastery})`
            : 'Crisis–deploy synergy',
      val: syn,
    });
  }

  lines.push({ label: 'Lineage grit (cycles endured)', val: Math.round(lineage * 100) / 100 });

  if (G.DEF_PENALTY > 0) {
    lines.push({ label: 'Accumulated genetic / crisis debt', val: -G.DEF_PENALTY });
  }

  if (extraPenalty) {
    lines.push({ label: 'Hypothetical extra burden (preview)', val: -extraPenalty });
  }

  if (secretAdj) {
    lines.push({
      label: `Cryptic resonance · ${G.secretKey?.kind === 'curse' ? 'volatile' : G.secretKey?.kind === 'boon' ? 'harmonic' : 'odd'} key`,
      val: secretAdj,
    });
  }

  const rawSum =
    G.HYBRID.score +
    cohortVal +
    crisisImpact +
    deploy +
    syn +
    lineage -
    (G.DEF_PENALTY || 0) -
    extraPenalty +
    secretAdj;

  const total = Math.max(12, Math.min(94, Math.round(rawSum)));
  return { lines, total };
}

export function breakdownHtml(cycle, extraPenalty = 0) {
  const { lines, total } = survivalBreakdown(cycle, extraPenalty);
  const rows = lines
    .map((row) => {
      const sign = row.val > 0 ? '+' : '';
      const cls = row.val > 0 ? 'bd-pos' : row.val < 0 ? 'bd-neg' : 'bd-zero';
      return `<div class="bd-row ${cls}"><span>${row.label}</span><span>${sign}${row.val}%pts</span></div>`;
    })
    .join('');
  return `<div class="breakdown card-sm anim-up">
    <div class="bd-title">Survival index ledger → projected <strong>${total}%</strong></div>
    <div class="bd-rows">${rows}</div>
    <div class="bd-note">“%pts” are additive modifiers on the viability meter before clamps (12–94%). Your picks directly raise or lower this stack.</div>
  </div>`;
}

export function generateSecretKey() {
  const roll = Math.random();
  const code = `Σ-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 5)}Ω`;
  if (roll < 0.34) {
    return {
      code,
      label: 'Harmonic lattice — cooperative enzymes stabilize membranes overnight.',
      deltaPct: 16,
      kind: 'boon',
      applied: false,
    };
  }
  if (roll < 0.67) {
    return {
      code,
      label: 'Parasitic resonance — telemetry ghosts amplify inflammatory noise.',
      deltaPct: -12,
      kind: 'curse',
      applied: false,
    };
  }
  return {
    code,
    label: 'Null fork — statistically boring… yet oddly insulating.',
    deltaPct: 4,
    kind: 'neutral',
    applied: false,
  };
}

/**
 * Stochastic survival bands — jitter amplifies toward apex.
 * @param {'early'|'establishment'|'adaptation'|'apex'} opts.dicePhase
 */
export function rollOutcome(rate, opts = {}) {
  const { dicePhase = 'early', sameSpeciesRenewal = false } = opts;
  let jitterAmp = dicePhase === 'apex' ? 14 : 12;
  if (sameSpeciesRenewal) jitterAmp *= 0.76;
  const jitter = (Math.random() - 0.5) * jitterAmp;
  let lateBias = 0;
  if (dicePhase === 'apex') lateBias = 4 + Math.random() * 8;
  else if (dicePhase === 'establishment') lateBias = 6 + Math.random() * 6;
  const effective = Math.max(14, Math.min(93, rate + jitter + lateBias));
  const roll = Math.random() * 100;
  const surviveBand = effective * 0.74;
  const damageBand = effective * 0.93;
  if (roll < surviveBand) return 'survive';
  if (roll < damageBand) return 'damage';
  return 'extinct';
}
