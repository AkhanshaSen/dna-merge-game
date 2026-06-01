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

const CROSS_END_UI = {
  fullLife: {
    title: (n) => `${n} — full natural life`,
    subtitle: 'All four stages · vitality held · forecasts earned stewardship legacy.',
    banner: 'ob-s',
    emoji: '🌟',
  },
  partialArc: {
    title: (n) => `${n} — arc finished`,
    subtitle: 'Four life stages walked, but forecasts fell short — no full-life legacy this cross.',
    banner: 'ob-warn',
    emoji: '⚠️',
  },
  woundedEnd: {
    title: (n) => `${n} — collapsed at old age`,
    subtitle: 'Nature rolled extinction on the final beat — not a complete natural life.',
    banner: 'ob-warn',
    emoji: '💀',
  },
  extinct: {
    title: (n) => `${n} — cross ended`,
    subtitle: 'Vitality failed or deploys misaligned — the line could not be sustained.',
    banner: 'ob-e',
    emoji: '💀',
  },
};

export function fbCrossEndUi(name, tier) {
  const ui = CROSS_END_UI[tier] || CROSS_END_UI.extinct;
  return {
    title: ui.title(name),
    subtitle: ui.subtitle,
    bannerCls: ui.banner,
    emoji: ui.emoji,
  };
}

export function fbCrossEndNarr(name, tier, forecast, rolled) {
  const { correct, total } = forecast;
  const fc = total ? `${correct}/${total} forecasts matched` : 'no forecast record';
  if (tier === 'fullLife') {
    return `You read the wild well enough — all four beats, ${fc}. <strong>${name}</strong> earns care+mate legacy and bonus passes for later crosses this game.`;
  }
  if (tier === 'partialArc') {
    return `Four stages complete and vitality remained, but only <strong>${correct}/${total || 4}</strong> forecasts matched. ${name} does <strong>not</strong> count as a full natural life — no fame or legacy bonuses.`;
  }
  if (tier === 'woundedEnd') {
    return `Old age brought collapse — the final outcome was <strong>${rolled}</strong> (${fc}) even though some vitality lingered. This is not a success arc; stewardship bonuses are withheld.`;
  }
  return fbVerdict(name, 'extinct');
}

export function fbGameEndVerdict(stats) {
  const { fullLifeN, partialN, woundedN, extinctN, forecastPct, isWinner } = stats;
  if (isWinner) {
    return `Stewardship earned: <strong>${fullLifeN}</strong> full-life cross${fullLifeN === 1 ? '' : 'es'}, guess-to-reality <strong>${forecastPct}%</strong>. You read the wild and kept lines alive.`;
  }
  if (fullLifeN >= 2 && forecastPct >= 50) {
    return `Mixed ledger — <strong>${fullLifeN}</strong> full lives, <strong>${partialN + woundedN + extinctN}</strong> imperfect crosses. Forecast skill was uneven (${forecastPct}%).`;
  }
  if (extinctN >= 2) {
    return `The ledger closes heavy — <strong>${extinctN}</strong> lines lost, only <strong>${fullLifeN}</strong> full natural life. Honest forecasting cannot always hold back collapse.`;
  }
  if (partialN + woundedN > 0) {
    return `You finished arcs but rarely earned full-life status — <strong>${partialN}</strong> forecast-short, <strong>${woundedN}</strong> final-collapse. Overall accuracy: <strong>${forecastPct}%</strong>.`;
  }
  return `This game asked for humility. Crosses survived: <strong>${fullLifeN}</strong> · lost: <strong>${extinctN}</strong>. Keep practicing deploy + forecast alignment.`;
}
