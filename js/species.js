/**
 * Species catalogue with taxonomy class and three named founders each.
 * taxon: mammal | reptile | avian — cross-class breeding is blocked.
 * realm: terrestrial | marine | freshwater — sea/freshwater animals cannot breed with land-only lineages.
 */
export const SPECIES = [
  {
    id: 'snow-leopard',
    emoji: '🐆',
    name: 'Snow Leopard',
    status: 'Vulnerable',
    iucn: 'VU',
    taxon: 'mammal',
    realm: 'terrestrial',
    traits: { adaptability: 78, immune: 65, reproduction: 35, climate: 82, dietary: 60, size: 55, social: 30, camouflage: 92 },
    individuals: [
      { id: 'snow-leopard-mira', displayName: 'Mira', gender: 'Female', personality: 'Patient sentinel — favors ridge patrols at dawn and caches scent markers obsessively.' },
      { id: 'snow-leopard-tenzin', displayName: 'Tenzin', gender: 'Male', personality: 'Bold explorer — pushes territory edges after storms; learns traps faster than peers.' },
      { id: 'snow-leopard-solukh', displayName: 'Solukh', gender: 'Male', personality: 'Quiet strategist — hangs back during hunts but bonds calves to safety corridors.' },
    ],
  },
  {
    id: 'amur-leopard',
    emoji: '🐈',
    name: 'Amur Leopard',
    status: 'Critically Endangered',
    iucn: 'CR',
    taxon: 'mammal',
    realm: 'terrestrial',
    traits: { adaptability: 62, immune: 58, reproduction: 28, climate: 75, dietary: 55, size: 50, social: 25, camouflage: 88 },
    individuals: [
      { id: 'amur-leopard-nadia', displayName: 'Nadia', gender: 'Female', personality: 'River-skulker — prefers ambush lanes near thawed creeks; wary of engine noise.' },
      { id: 'amur-leopard-vanya', displayName: 'Vanya', gender: 'Male', personality: 'Snow-runner — explosive speed on crust ice; restless until scent-lines reconnect.' },
      { id: 'amur-leopard-ksenia', displayName: 'Ksenia', gender: 'Female', personality: 'Community bridger — tolerates overlapping ranges more than typical Amur cats.' },
    ],
  },
  {
    id: 'axolotl',
    emoji: '🦎',
    name: 'Axolotl',
    status: 'Critically Endangered',
    iucn: 'CR',
    taxon: 'reptile',
    realm: 'freshwater',
    traits: { adaptability: 70, immune: 88, reproduction: 85, climate: 45, dietary: 72, size: 20, social: 40, camouflage: 55 },
    individuals: [
      { id: 'axolotl-nixie', displayName: 'Nixie', gender: 'Female', personality: 'Canopy lurker — hides under floating mats; regenerates fringe tissue fastest in cohort.' },
      { id: 'axolotl-orion', displayName: 'Orion', gender: 'Male', personality: 'Night feeder — exploits insect pulses after rains; cautious around sudden lights.' },
      { id: 'axolotl-lumen', displayName: 'Lumen', gender: 'Female', personality: 'Courtship dancer — exaggerated gill-flares; bonds tightly with familiar substrates.' },
    ],
  },
  {
    id: 'vaquita',
    emoji: '🐬',
    name: 'Vaquita',
    status: 'Critically Endangered',
    iucn: 'CR',
    taxon: 'mammal',
    realm: 'marine',
    traits: { adaptability: 30, immune: 55, reproduction: 20, climate: 50, dietary: 65, size: 38, social: 60, camouflage: 70 },
    individuals: [
      { id: 'vaquita-marina', displayName: 'Marina', gender: 'Female', personality: 'Tide-whisperer — times surfacing with swell shadows to dodge nets.' },
      { id: 'vaquita-paco', displayName: 'Paco', gender: 'Male', personality: 'Echo navigator — unusually long clicks in turbid water; avoids crowded channels.' },
      { id: 'vaquita-lola', displayName: 'Lola', gender: 'Female', personality: 'Shoal diplomat — calves mimic her shallow arcs; prefers dawn crossings.' },
    ],
  },
  {
    id: 'javan-rhino',
    emoji: '🦏',
    name: 'Javan Rhino',
    status: 'Critically Endangered',
    iucn: 'CR',
    taxon: 'mammal',
    realm: 'terrestrial',
    traits: { adaptability: 40, immune: 72, reproduction: 22, climate: 60, dietary: 80, size: 95, social: 20, camouflage: 30 },
    individuals: [
      { id: 'javan-rhino-sinta', displayName: 'Sinta', gender: 'Female', personality: 'Mud sculptor — maintains mineral wallows others reuse; deliberate mover.' },
      { id: 'javan-rhino-bima', displayName: 'Bima', gender: 'Male', personality: 'Forest bulldozer — opens browsing lanes; remembers ranger paths for decades.' },
      { id: 'javan-rhino-dewi', displayName: 'Dewi', gender: 'Female', personality: 'Sapling guardian — favors young shoots after monsoon; avoids noisy ridges.' },
    ],
  },
  {
    id: 'sunda-tiger',
    emoji: '🐯',
    name: 'Sunda Tiger',
    status: 'Critically Endangered',
    iucn: 'CR',
    taxon: 'mammal',
    realm: 'terrestrial',
    traits: { adaptability: 65, immune: 70, reproduction: 40, climate: 68, dietary: 85, size: 80, social: 15, camouflage: 80 },
    individuals: [
      { id: 'sunda-tiger-harimau', displayName: 'Harimau', gender: 'Male', personality: 'River shadow — stakes crossings during floods; impatient with crowded prey.' },
      { id: 'sunda-tiger-sari', displayName: 'Sari', gender: 'Female', personality: 'Patient instructor — teaches stalk-lines to offspring longer than regional norms.' },
      { id: 'sunda-tiger-api', displayName: 'Api', gender: 'Male', personality: 'Fire-season rover — exploits burn scars for visibility; loud territorial vocals.' },
    ],
  },
  {
    id: 'kakapo',
    emoji: '🦜',
    name: 'Kakapo',
    status: 'Critically Endangered',
    iucn: 'CR',
    taxon: 'avian',
    realm: 'terrestrial',
    traits: { adaptability: 35, immune: 60, reproduction: 15, climate: 55, dietary: 75, size: 42, social: 45, camouflage: 65 },
    individuals: [
      { id: 'kakapo-marama', displayName: 'Marama', gender: 'Female', personality: 'Ground poet — booming circuits at precise lunar humidity; hoards aromatic moss.' },
      { id: 'kakapo-tane', displayName: 'Tāne', gender: 'Male', personality: 'Trail comedian — clumsy climbs but remembers every predator scrape on roots.' },
      { id: 'kakapo-aroha', displayName: 'Aroha', gender: 'Female', personality: 'Night gleaner — favors rimu mast years; shy until feeders prove steady.' },
    ],
  },
  {
    id: 'mtn-gorilla',
    emoji: '🦍',
    name: 'Mountain Gorilla',
    status: 'Endangered',
    iucn: 'EN',
    taxon: 'mammal',
    realm: 'terrestrial',
    traits: { adaptability: 55, immune: 68, reproduction: 30, climate: 58, dietary: 78, size: 88, social: 95, camouflage: 25 },
    individuals: [
      { id: 'mtn-gorilla-imani', displayName: 'Imani', gender: 'Female', personality: 'Silver mediator — breaks juvenile squabbles with soft chest-drums.' },
      { id: 'mtn-gorilla-baraka', displayName: 'Baraka', gender: 'Male', personality: 'Bamboo skeptic — tastes shoots twice before committing energy uphill.' },
      { id: 'mtn-gorilla-amara', displayName: 'Amara', gender: 'Female', personality: 'Fog watcher — positions nests leeward on mist mornings.' },
    ],
  },
  {
    id: 'pangolin',
    emoji: '🐾',
    name: 'Chinese Pangolin',
    status: 'Critically Endangered',
    iucn: 'CR',
    taxon: 'mammal',
    realm: 'terrestrial',
    traits: { adaptability: 50, immune: 62, reproduction: 35, climate: 62, dietary: 70, size: 35, social: 15, camouflage: 75 },
    individuals: [
      { id: 'pangolin-jade', displayName: 'Jade', gender: 'Female', personality: 'Termite accountant — remembers mound refill cycles across seasons.' },
      { id: 'pangolin-huang', displayName: 'Huang', gender: 'Male', personality: 'Burrow minimalist — digs shallow hides near bamboo runoff.' },
      { id: 'pangolin-mei', displayName: 'Mei', gender: 'Female', personality: 'Rain responder — shifts routes hours before drizzle hits ridge scent-lines.' },
    ],
  },
  {
    id: 'sea-turtle',
    emoji: '🐢',
    name: 'Leatherback Turtle',
    status: 'Vulnerable',
    iucn: 'VU',
    taxon: 'reptile',
    realm: 'marine',
    traits: { adaptability: 68, immune: 58, reproduction: 70, climate: 72, dietary: 60, size: 85, social: 10, camouflage: 40 },
    individuals: [
      { id: 'sea-turtle-atlas', displayName: 'Atlas', gender: 'Male', personality: 'Thermophone — exploits jellyfish blooms along fronts older turtles skip.' },
      { id: 'sea-turtle-kaimana', displayName: 'Kaimana', gender: 'Female', personality: 'Moon crawler — nests only after tide slack; remembers subtle beach tilt.' },
      { id: 'sea-turtle-liko', displayName: 'Liko', gender: 'Female', personality: 'Deep glider — unusually long dives; cautious near glowing vessels.' },
    ],
  },
  {
    id: 'saola',
    emoji: '🦌',
    name: 'Saola',
    status: 'Critically Endangered',
    iucn: 'CR',
    taxon: 'mammal',
    realm: 'terrestrial',
    traits: { adaptability: 42, immune: 55, reproduction: 28, climate: 55, dietary: 72, size: 55, social: 35, camouflage: 80 },
    individuals: [
      { id: 'saola-trung', displayName: 'Trung', gender: 'Male', personality: 'Stream ghost — crosses riffles noiselessly; hates gravel roads.' },
      { id: 'saola-linh', displayName: 'Linh', gender: 'Female', personality: 'Canopy listener — freezes when gibbons alarm even kilometers away.' },
      { id: 'saola-minh', displayName: 'Minh', gender: 'Male', personality: 'Salt lick loyalist — keeps mineral calendars rivals underestimate.' },
    ],
  },
  {
    id: 'orangutan',
    emoji: '🦧',
    name: 'Sumatran Orangutan',
    status: 'Critically Endangered',
    iucn: 'CR',
    taxon: 'mammal',
    realm: 'terrestrial',
    traits: { adaptability: 60, immune: 65, reproduction: 22, climate: 65, dietary: 82, size: 72, social: 55, camouflage: 35 },
    individuals: [
      { id: 'orangutan-dewa', displayName: 'Dewa', gender: 'Male', personality: 'Fig engineer — remembers mast trees across fragmented corridors.' },
      { id: 'orangutan-sinta-o', displayName: 'Sinta', gender: 'Female', personality: 'Nest artisan — rebuilds drenched platforms nightly during monsoon.' },
      { id: 'orangutan-bayu', displayName: 'Bayu', gender: 'Male', personality: 'Young disperser — probes plantation edges then retreats to core peat forest.' },
    ],
  },
];

/** Human-readable taxon labels */
export const TAXON_LABEL = {
  mammal: 'Mammal',
  reptile: 'Reptile / amphibian',
  avian: 'Bird',
};

export const REALM_LABEL = {
  terrestrial: '🏔️ Land',
  marine: '🌊 Marine',
  freshwater: '💧 Freshwater',
};

export function taxonChipClass(taxon) {
  if (taxon === 'mammal') return 'tax-chip tax-m';
  if (taxon === 'reptile') return 'tax-chip tax-r';
  return 'tax-chip tax-a';
}

export function realmChipClass(realm) {
  if (realm === 'marine') return 'realm-chip realm-sea';
  if (realm === 'freshwater') return 'realm-chip realm-fresh';
  return 'realm-chip realm-land';
}

/** Lookup founder by compound id */
export function findFounder(individualId) {
  for (const sp of SPECIES) {
    const ind = sp.individuals.find((x) => x.id === individualId);
    if (ind) return { species: sp, individual: ind };
  }
  return null;
}
