import { DEFECT_POOL } from './constants.js';

const TRAIT_KEYS = [
  'adaptability',
  'immune',
  'reproduction',
  'climate',
  'dietary',
  'size',
  'social',
  'camouflage',
];

function clampTrait(n) {
  return Math.max(5, Math.min(100, Math.round(n)));
}

/** FNV-style hash for deterministic per-founder variance */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministic trait offset from founder id (−11 … +11) */
function individualTraitOffset(individualId, traitKey) {
  const h = hashStr(`${individualId}|${traitKey}`);
  return (h % 23) - 11;
}

/** Deterministic-ish micro-variance from founder personality strings */
function personalityBias(personality, traitKey) {
  const h = hashStr(`${personality}|${traitKey}|p`);
  return (h % 9) - 4;
}

/**
 * Resolved trait profile for one founder (species baseline + individual identity).
 * @param {{ species: { traits: Record<string, number> }, individual: { id: string, personality: string, traits?: Record<string, number> } }} found
 */
export function founderTraits(found) {
  if (!found?.species?.traits || !found.individual) return {};
  const base = found.species.traits;
  const ind = found.individual;
  if (ind.traits && typeof ind.traits === 'object') {
    const t = {};
    for (const k of TRAIT_KEYS) {
      t[k] = clampTrait(ind.traits[k] ?? base[k] ?? 50);
    }
    return t;
  }
  const t = {};
  for (const k of TRAIT_KEYS) {
    const offset = individualTraitOffset(ind.id, k);
    const pers = personalityBias(ind.personality || '', k);
    t[k] = clampTrait((base[k] ?? 50) + offset + Math.round(pers * 0.35));
  }
  return t;
}

/**
 * Blend trait scores from two founders.
 * Same-species pairings tighten variance (within-lineage breeding).
 */
export function blendTraits(foundA, foundB) {
  const sameSpecies = foundA.species.id === foundB.species.id;
  const baseA = founderTraits(foundA);
  const baseB = founderTraits(foundB);
  const t = {};
  for (const k of TRAIT_KEYS) {
    if (sameSpecies) {
      const mid = (baseA[k] + baseB[k]) / 2;
      t[k] = clampTrait(mid + (Math.random() * 6 - 3));
    } else {
      t[k] = clampTrait(baseA[k] * 0.5 + baseB[k] * 0.5 + (Math.random() * 14 - 7));
    }
  }
  return t;
}

export function avgScore(traits) {
  const v = Object.values(traits);
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

/** Projected trait band before merge (no RNG) — Niche-style preview */
export function previewBlend(foundA, foundB) {
  const sameSpecies = foundA.species.id === foundB.species.id;
  const baseA = founderTraits(foundA);
  const baseB = founderTraits(foundB);
  const traitsMin = {};
  const traitsMax = {};
  for (const k of TRAIT_KEYS) {
    if (sameSpecies) {
      const mid = (baseA[k] + baseB[k]) / 2;
      traitsMin[k] = clampTrait(mid - 6);
      traitsMax[k] = clampTrait(mid + 6);
    } else {
      const mid = baseA[k] * 0.5 + baseB[k] * 0.5;
      traitsMin[k] = clampTrait(mid - 10);
      traitsMax[k] = clampTrait(mid + 10);
    }
  }
  return {
    sameSpecies,
    traitsMin,
    traitsMax,
    scoreMin: avgScore(traitsMin),
    scoreMax: avgScore(traitsMax),
  };
}

/** Roll genetic defect for hybrid cohort */
export function rollHybridDefect(sameSpecies, breedRound = 1) {
  let chance = sameSpecies ? 0.12 : 0.42;
  if (breedRound === 4) chance += 0.1;
  if (Math.random() > chance) return null;
  const pick = DEFECT_POOL[Math.floor(Math.random() * DEFECT_POOL.length)];
  return { ...pick, penalty: defectPenaltyFor(pick.name) };
}

function defectPenaltyFor(name) {
  if (name.includes('Immune')) return { trait: 'immune', amount: 12 };
  if (name.includes('Infertility')) return { trait: 'reproduction', amount: 10 };
  if (name.includes('Behavioural')) return { trait: 'social', amount: 10 };
  if (name.includes('Malformation')) return { trait: 'size', amount: 8 };
  if (name.includes('Thermal')) return { trait: 'climate', amount: 12 };
  if (name.includes('Neurological')) return { trait: 'adaptability', amount: 10 };
  return { trait: 'adaptability', amount: 8 };
}

/**
 * Shift two distinct traits by independent ±magnitude rolls (integer magnitude in [minMag,maxMag]),
 * clamp traits to 5–100, then refresh hybrid.score from the trait mean.
 * @returns {{ bothUp: boolean }}
 */
export function applyTraitDriftToHybrid(hybrid, minMag, maxMag) {
  const traits = hybrid.traits;
  const keys = Object.keys(traits);
  if (keys.length < 2) return { bothUp: false };

  let ka = keys[Math.floor(Math.random() * keys.length)];
  let kb = keys[Math.floor(Math.random() * keys.length)];
  let guard = 0;
  while (kb === ka && keys.length > 1 && guard++ < 16) {
    kb = keys[Math.floor(Math.random() * keys.length)];
  }
  if (kb === ka) return { bothUp: false };

  const span = maxMag - minMag + 1;
  const driftDelta = () => {
    const mag = minMag + Math.floor(Math.random() * span);
    return (Math.random() < 0.5 ? -1 : 1) * mag;
  };

  const da = driftDelta();
  const db = driftDelta();
  const va = Math.max(5, Math.min(100, traits[ka] + da));
  const vb = Math.max(5, Math.min(100, traits[kb] + db));

  hybrid.lastDrift = {
    keys: [ka, kb],
    deltas: [da, db],
    before: [traits[ka], traits[kb]],
    after: [va, vb],
  };

  traits[ka] = va;
  traits[kb] = vb;
  hybrid.score = avgScore(traits);
  return { bothUp: da > 0 && db > 0 };
}

/** Canonical key for extinct lookups / locking */
export function mergePairKey(foundA, foundB) {
  const x = `${foundA.species.id}:${foundA.individual.id}`;
  const y = `${foundB.species.id}:${foundB.individual.id}`;
  return [x, y].sort().join('|');
}

/** Legacy species-only extinction rows from older saves */
export function legacySpeciesKey(specIdA, specIdB) {
  return [specIdA, specIdB].sort().join('|');
}

export function isExtinctMerge(foundA, foundB, extinctions) {
  const pairKey = mergePairKey(foundA, foundB);
  const legacyKey = legacySpeciesKey(foundA.species.id, foundB.species.id);
  const sameSpeciesDyad = foundA.species.id === foundB.species.id;
  return extinctions.some((e) => {
    if (e.mergeKey && e.mergeKey === pairKey) return true;
    // Legacy rows without founder-level keys: do not blanket-lock every intra-species pairing.
    if (!e.mergeKey && legacySpeciesKey(e.pA, e.pB) === legacyKey) {
      if (sameSpeciesDyad) return false;
      return true;
    }
    return false;
  });
}

export function taxaCompatible(foundA, foundB) {
  return foundA.species.taxon === foundB.species.taxon;
}

export function realmCompatible(foundA, foundB) {
  const ra = foundA.species.realm || 'terrestrial';
  const rb = foundB.species.realm || 'terrestrial';
  return ra === rb;
}

/** Binary founders only — requires one male + one female */
export function genderCompatible(foundA, foundB) {
  const ga = (foundA.individual.gender || '').trim().toLowerCase();
  const gb = (foundB.individual.gender || '').trim().toLowerCase();
  const male = ga === 'male' && gb === 'female';
  const female = ga === 'female' && gb === 'male';
  return male || female;
}

/** Human-readable blocker for UI */
export function mergeBlockReason(foundA, foundB, extinctions) {
  if (!foundA || !foundB) return null;
  if (foundA.individual.id === foundB.individual.id) {
    return 'Choose two different founders — cloning slots are offline.';
  }
  if (!taxaCompatible(foundA, foundB)) {
    return 'Cross-class breeding blocked — mammals, reptiles/amphibians, and birds cannot hybridise here.';
  }
  if (!realmCompatible(foundA, foundB)) {
    return 'Realm clash — marine / freshwater animals cannot breed with land-only founders (and vice versa).';
  }
  if (!genderCompatible(foundA, foundB)) {
    return 'Breeding requires one male and one female founder.';
  }
  if (isExtinctMerge(foundA, foundB, extinctions)) {
    return 'This founder pairing is sealed — population already declared extinct.';
  }
  return null;
}
