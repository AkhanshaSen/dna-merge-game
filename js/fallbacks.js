export function fbHybrid(foundA, foundB, score) {
  const aName = foundA.species.name;
  const bName = foundB.species.name;
  const ra = foundA.individual.displayName;
  const rb = foundB.individual.displayName;
  const lineage =
    foundA.species.id === foundB.species.id
      ? `${aName} lineage (${ra} × ${rb})`
      : `${aName}–${bName} cross (${ra} × ${rb})`;
  const short =
    foundA.species.id === foundB.species.id
      ? `${foundA.species.name.split(' ').pop()} Renewal`
      : `${foundA.species.name.split(' ').pop()}-${foundB.species.name.split(' ').pop()} Hybrid`;
  return {
    name: short,
    emoji: foundA.species.emoji,
    bio: `The ${short} emerges from ${lineage}. With a viability score of ${score}/100, this cohort faces ${score >= 65 ? 'a promising yet uncertain' : score >= 40 ? 'a challenging and precarious' : 'a deeply perilous'} path. Individual temperaments — «${foundA.individual.personality.split('—')[0].trim()}» vs «${foundB.individual.personality.split('—')[0].trim()}» — colour how the population responds to stress.`,
    defects: [
      'Immune incompatibility — subtle founder mismatch creates chronic inflammatory risk under density stress',
      'Reproductive instability — pairing quirks reduce viable offspring unless corridors stay quiet',
    ],
  };
}

export function fbNarrative(hname, ename, outcome, cycle, opts = {}) {
  if (opts.foughtBack) {
    return `Stage ${cycle}: The ${ename} nearly breaks ${hname} — but your intervention holds. Scarred and depleted, the cohort <strong>refuses to collapse</strong> and staggers forward with vitality intact.`;
  }
  const m = {
    survive: `Stage ${cycle}: Despite the ${ename}, ${hname} digs in — inherited resilience and your deploy buy another season of life.`,
    damage: `Stage ${cycle}: The ${ename} wounds ${hname}. Individuals fall, yet the line endures — conservation is often triage, not triumph.`,
    extinct: `Stage ${cycle}: Vitality finally fails. The ${ename} and accumulated stress overcome ${hname}; the experiment pauses here.`,
  };
  return m[outcome] || m.survive;
}

export function fbDefects(seeds) {
  return seeds.map((d) => {
    const p = d.split('—');
    return {
      name: (p[0] || '').trim(),
      desc: (p[1] || 'A fundamental genetic mismatch between founder lineages creates systemic biological stress.').trim(),
      impact: 'Reduces long-term survival probability by 15–25 points.',
    };
  });
}

export function fbVerdict(hname, outcome) {
  if (outcome === 'survive')
    return `${hname} has defied the odds and established a breeding population, securing a unique ecological niche for generations to come.`;
  if (outcome === 'damage')
    return `${hname} persists in a fragile, reduced state. Without further intervention, long-term viability remains deeply uncertain.`;
  return `${hname} has gone extinct. Incompatibilities within this breeding experiment proved insurmountable. This unique cohort is lost forever.`;
}
