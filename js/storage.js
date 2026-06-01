/** Browser persistence — keys prefixed with `dna_` */
export const LS = {
  get(k) {
    try {
      return JSON.parse(localStorage.getItem('dna_' + k));
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('dna_' + k, JSON.stringify(v));
    } catch {
      /* quota */
    }
  },
  clear() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('dna_'))
      .forEach((k) => localStorage.removeItem(k));
  },
};

export function loadState() {
  return {
    hybrids: LS.get('hybrids') || [],
    extinctions: LS.get('extinctions') || [],
    fame: LS.get('fame') || [],
    resources: LS.get('resources') ?? 9 /* RESOURCE_START_DEFAULT */,
    /** 1–5 campaign slot — resources carry between breeds; wraps after slot 5 */
    breedRound: Math.min(5, Math.max(1, LS.get('breedRound') ?? 1)),
    predictions: Array.isArray(LS.get('predictions')) ? LS.get('predictions') : [],
    /** Lifetime forecast skill points (extinction reads, etc.) */
    points: Math.max(0, Math.floor(Number(LS.get('points')) || 0)),
    log: LS.get('log') || [],
    achievements: Array.isArray(LS.get('achievements')) ? LS.get('achievements') : [],
    tutorialDone: !!LS.get('tutorialDone'),
  };
}

export function saveState(s) {
  LS.set('hybrids', s.hybrids);
  LS.set('extinctions', s.extinctions);
  LS.set('fame', s.fame);
  LS.set('resources', s.resources);
  LS.set('breedRound', s.breedRound);
  LS.set('predictions', s.predictions);
  LS.set('points', Math.max(0, Math.floor(Number(s.points) || 0)));
  LS.set('log', s.log);
  LS.set('achievements', s.achievements || []);
  LS.set('tutorialDone', !!s.tutorialDone);
}
