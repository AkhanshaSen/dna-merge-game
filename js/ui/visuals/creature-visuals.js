import * as THREE from 'three';

/** @typedef {'feline'|'cetacean'|'rhino'|'avian'|'primate'|'amphibian'|'chelonian'|'antelope'|'pangolin'} Archetype */

/** @type {Record<string, { archetype: Archetype, primary: string, secondary: string, accent: string }>} */
export const SPECIES_VIS = {
  'snow-leopard': { archetype: 'feline', primary: '#8ec5ff', secondary: '#4a6a8a', accent: '#c8e4ff' },
  'amur-leopard': { archetype: 'feline', primary: '#ffb07a', secondary: '#8a5030', accent: '#ffd4b0' },
  axolotl: { archetype: 'amphibian', primary: '#c88bff', secondary: '#5a3080', accent: '#e8c0ff' },
  vaquita: { archetype: 'cetacean', primary: '#6ec8ff', secondary: '#2a5878', accent: '#a8e8ff' },
  'javan-rhino': { archetype: 'rhino', primary: '#8a9a78', secondary: '#4a5840', accent: '#b8c8a8' },
  'sunda-tiger': { archetype: 'feline', primary: '#ff9a4a', secondary: '#8a4020', accent: '#ffc890' },
  kakapo: { archetype: 'avian', primary: '#7ad878', secondary: '#3a6838', accent: '#b0f0a8' },
  'mtn-gorilla': { archetype: 'primate', primary: '#9a8a88', secondary: '#4a4038', accent: '#c8b8b0' },
  pangolin: { archetype: 'pangolin', primary: '#c8a868', secondary: '#685830', accent: '#e8d098' },
  'sea-turtle': { archetype: 'chelonian', primary: '#4a8878', secondary: '#284840', accent: '#78b8a8' },
  saola: { archetype: 'antelope', primary: '#a89078', secondary: '#584838', accent: '#d8c0a8' },
  orangutan: { archetype: 'primate', primary: '#c87848', secondary: '#683818', accent: '#f0a878' },
  'african-wild-dog': { archetype: 'feline', primary: '#c87830', secondary: '#684018', accent: '#e8a860' },
  'california-condor': { archetype: 'avian', primary: '#8a5040', secondary: '#4a2820', accent: '#c89070' },
  gharial: { archetype: 'amphibian', primary: '#5a9878', secondary: '#284840', accent: '#88c8a8' },
  'humpback-whale': { archetype: 'cetacean', primary: '#5a8ab8', secondary: '#284860', accent: '#98c8e8' },
};

const TAXON_FALLBACK = {
  mammal: { archetype: 'feline', primary: '#4f7fff', secondary: '#2a4080', accent: '#8ab0ff' },
  reptile: { archetype: 'amphibian', primary: '#2dffb3', secondary: '#188860', accent: '#80ffd8' },
  avian: { archetype: 'avian', primary: '#ffb84f', secondary: '#886020', accent: '#ffd890' },
};

const REALM_GLOW = {
  terrestrial: 'rgba(79,127,255,.35)',
  marine: 'rgba(79,255,223,.35)',
  freshwater: 'rgba(155,95,255,.35)',
};

/** Life-stage maturation — portrait + 3D scale keyed to birth → old age */
const LIFE_STAGE_RING = ['#4fffdf', '#4f7fff', '#9b5fff', '#ffb84f'];
const LIFE_STAGE_SCALE = { 1: 0.46, 2: 0.7, 3: 1, 4: 0.92 };
const LIFE_STAGE_Y = { 1: 10, 2: 5, 3: 0, 4: 1 };
const LIFE_STAGE_GLOW = {
  1: 'rgba(79,255,223,.4)',
  2: 'rgba(79,127,255,.4)',
  3: 'rgba(155,95,255,.4)',
  4: 'rgba(255,184,79,.35)',
};

export function lifeStageScale(stage) {
  const s = Math.max(1, Math.min(4, Number(stage) || 3));
  return LIFE_STAGE_SCALE[s] ?? 1;
}

/** @returns {number} 3D scale multiplier for life stage 1–4 */
export function lifeStageMeshScale(stage) {
  return lifeStageScale(stage) * 0.95;
}

function stageRingSvg(stage) {
  const s = Math.max(1, Math.min(4, stage));
  const color = LIFE_STAGE_RING[s - 1];
  const r = s === 1 ? 19 : s === 2 ? 22 : 25;
  return `<circle cx="32" cy="32" r="${r}" fill="none" stroke="${color}" stroke-width="2" opacity="0.55" class="portrait-stage-ring"/>`;
}

function stageOverlaySvg(stage) {
  if (stage === 1) {
    return `<ellipse cx="32" cy="54" rx="16" ry="4" fill="rgba(79,255,223,.12)"/>
      <ellipse cx="32" cy="54" rx="10" ry="2.5" fill="rgba(79,255,223,.08)"/>`;
  }
  if (stage === 2) {
    return `<circle cx="18" cy="20" r="2" fill="#4f7fff" opacity=".5"/>
      <circle cx="46" cy="18" r="1.5" fill="#4f7fff" opacity=".4"/>`;
  }
  if (stage === 4) {
    return `<path d="M18 20 Q32 10 46 20" stroke="rgba(255,255,255,.22)" fill="none" stroke-width="1.2"/>
      <path d="M22 16 Q32 12 42 16" stroke="rgba(255,184,79,.25)" fill="none" stroke-width="1"/>`;
  }
  return '';
}

function wrapLifeStageSvg(content, stage) {
  const s = Math.max(1, Math.min(4, Number(stage) || 0));
  if (!s) return content;
  const sc = LIFE_STAGE_SCALE[s];
  const oy = LIFE_STAGE_Y[s];
  return `${stageRingSvg(s)}${stageOverlaySvg(s)}
    <g class="portrait-stage-body" transform="translate(32 ${32 + oy}) scale(${sc}) translate(-32 -32)">${content}</g>`;
}

function lifeStagePortraitClass(stage) {
  const s = Math.max(1, Math.min(4, Number(stage) || 0));
  return s ? ` portrait-mature-${s}` : '';
}

function lifeStageGlowStyle(realm, stage) {
  const s = Math.max(1, Math.min(4, Number(stage) || 0));
  const glow = s ? LIFE_STAGE_GLOW[s] : REALM_GLOW[realm] || REALM_GLOW.terrestrial;
  return `--portrait-glow:${glow}`;
}

export function visForSpecies(speciesId, taxon = 'mammal', realm = 'terrestrial') {
  const v = SPECIES_VIS[speciesId] || TAXON_FALLBACK[taxon] || TAXON_FALLBACK.mammal;
  return { ...v, realm, speciesId };
}

function svgDefs(id, primary, secondary, accent) {
  return `<defs>
    <linearGradient id="g-${id}-body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="55%" stop-color="${secondary}"/>
      <stop offset="100%" stop-color="${accent}"/>
    </linearGradient>
    <radialGradient id="g-${id}-shine" cx="35%" cy="28%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".85"/>
      <stop offset="100%" stop-color="${secondary}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow-${id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

/** @param {string} uid @param {Archetype} archetype @param {string} gid */
function archetypePaths(uid, archetype, gid) {
  const b = `url(#g-${gid}-body)`;
  const s = `url(#g-${gid}-shine)`;
  switch (archetype) {
    case 'feline':
      return `
        <ellipse cx="34" cy="38" rx="18" ry="11" fill="${b}" filter="url(#glow-${gid})"/>
        <ellipse cx="34" cy="38" rx="18" ry="11" fill="${s}"/>
        <circle cx="48" cy="30" r="9" fill="${b}"/>
        <path d="M44 22 L46 16 L49 22 Z M51 22 L53 16 L56 22 Z" fill="${b}"/>
        <path d="M18 38 Q8 34 6 28 Q12 32 16 36" fill="${b}" opacity=".9"/>
        <ellipse cx="26" cy="46" rx="3" ry="5" fill="${b}"/><ellipse cx="34" cy="48" rx="3" ry="5" fill="${b}"/>
        <ellipse cx="42" cy="46" rx="3" ry="5" fill="${b}"/><ellipse cx="48" cy="42" rx="3" ry="4" fill="${b}"/>
        <circle cx="50" cy="28" r="1.8" fill="#fff" opacity=".9"/>
      `;
    case 'cetacean':
      return `
        <path d="M12 34 Q28 22 46 30 Q54 34 52 38 Q40 42 24 40 Q14 38 12 34 Z" fill="${b}" filter="url(#glow-${gid})"/>
        <path d="M12 34 Q28 22 46 30 Q54 34 52 38 Q40 42 24 40 Q14 38 12 34 Z" fill="${s}"/>
        <path d="M8 32 L4 28 L8 36 Z" fill="${b}"/>
        <path d="M52 36 Q58 32 60 38 Q58 42 52 40 Z" fill="${b}"/>
        <circle cx="44" cy="30" r="1.6" fill="#fff" opacity=".85"/>
      `;
    case 'rhino':
      return `
        <ellipse cx="34" cy="38" rx="20" ry="13" fill="${b}" filter="url(#glow-${gid})"/>
        <ellipse cx="34" cy="38" rx="20" ry="13" fill="${s}"/>
        <circle cx="50" cy="32" r="10" fill="${b}"/>
        <path d="M58 26 L62 18 L60 30 Z" fill="${b}"/>
        <ellipse cx="22" cy="46" rx="4" ry="6" fill="${b}"/><ellipse cx="34" cy="48" rx="4" ry="6" fill="${b}"/>
        <ellipse cx="44" cy="46" rx="4" ry="6" fill="${b}"/>
      `;
    case 'avian':
      return `
        <ellipse cx="32" cy="36" rx="16" ry="14" fill="${b}" filter="url(#glow-${gid})"/>
        <ellipse cx="32" cy="36" rx="16" ry="14" fill="${s}"/>
        <circle cx="44" cy="30" r="8" fill="${b}"/>
        <path d="M52 30 L58 28 L52 34 Z" fill="${b}"/>
        <path d="M20 34 Q10 28 8 36 Q14 38 22 36" fill="${b}" opacity=".85"/>
        <circle cx="46" cy="28" r="1.5" fill="#fff"/>
      `;
    case 'primate':
      return `
        <ellipse cx="34" cy="36" rx="15" ry="16" fill="${b}" filter="url(#glow-${gid})"/>
        <ellipse cx="34" cy="36" rx="15" ry="16" fill="${s}"/>
        <circle cx="34" cy="22" r="10" fill="${b}"/>
        <path d="M18 30 Q8 24 10 38 Q16 36 20 34" fill="${b}"/>
        <path d="M50 30 Q58 24 56 38 Q50 36 48 34" fill="${b}"/>
        <circle cx="36" cy="20" r="1.6" fill="#fff"/>
      `;
    case 'amphibian':
      return `
        <ellipse cx="34" cy="38" rx="22" ry="9" fill="${b}" filter="url(#glow-${gid})"/>
        <ellipse cx="34" cy="38" rx="22" ry="9" fill="${s}"/>
        <circle cx="50" cy="34" r="8" fill="${b}"/>
        <path d="M54 28 Q58 22 56 32 M54 30 Q58 26 56 34" stroke="${b}" stroke-width="2" fill="none"/>
        <path d="M14 38 L8 42 M18 40 L12 44" stroke="${b}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="52" cy="32" r="1.4" fill="#fff"/>
      `;
    case 'chelonian':
      return `
        <ellipse cx="34" cy="36" rx="20" ry="14" fill="${b}" filter="url(#glow-${gid})"/>
        <ellipse cx="34" cy="36" rx="14" ry="9" fill="${s}"/>
        <circle cx="52" cy="34" r="7" fill="${b}"/>
        <path d="M14 34 L6 30 M14 38 L6 42 M54 34 L60 32 M54 38 L60 40" stroke="${b}" stroke-width="3" stroke-linecap="round"/>
      `;
    case 'antelope':
      return `
        <ellipse cx="34" cy="38" rx="16" ry="10" fill="${b}" filter="url(#glow-${gid})"/>
        <ellipse cx="34" cy="38" rx="16" ry="10" fill="${s}"/>
        <circle cx="48" cy="28" r="7" fill="${b}"/>
        <path d="M46 20 L44 12 M50 20 L52 12" stroke="${b}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M20 42 L16 50 M28 44 L26 52 M38 44 L38 52 M46 42 L48 50" stroke="${b}" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="50" cy="26" r="1.4" fill="#fff"/>
      `;
    case 'pangolin':
      return `
        <path d="M48 34 Q38 28 28 34 Q18 40 14 46 Q20 42 30 38 Q40 34 48 38 Q52 36 48 34 Z" fill="${b}" filter="url(#glow-${gid})"/>
        <path d="M48 34 Q38 28 28 34 Q18 40 14 46 Q20 42 30 38 Q40 34 48 38 Q52 36 48 34 Z" fill="${s}"/>
        <g stroke="${b}" stroke-width="1.2" opacity=".7">
          <path d="M20 40 Q24 36 28 40"/><path d="M26 38 Q30 34 34 38"/><path d="M32 36 Q36 32 40 36"/>
        </g>
        <circle cx="46" cy="32" r="5" fill="${b}"/>
      `;
    default:
      return `<circle cx="32" cy="34" r="16" fill="${b}" filter="url(#glow-${gid})"/>`;
  }
}

/**
 * @param {string} speciesId
 * @param {{ taxon?: string, realm?: string, size?: 'xs'|'sm'|'md'|'lg'|'hero', animate?: boolean, slot?: 'a'|'b'|null, className?: string, lifeStage?: number }} [opts]
 */
export function portraitHtml(speciesId, opts = {}) {
  const {
    taxon = 'mammal',
    realm = 'terrestrial',
    size = 'md',
    animate = true,
    slot = null,
    className = '',
    lifeStage = 0,
  } = opts;
  const vis = visForSpecies(speciesId, taxon, realm);
  const gid = `${speciesId}-${size}${lifeStage || ''}`.replace(/[^a-z0-9-]/gi, '');
  const slotCls = slot === 'a' ? ' portrait-slot-a' : slot === 'b' ? ' portrait-slot-b' : '';
  const animCls = animate ? ' portrait-animate' : '';
  const stageCls = lifeStagePortraitClass(lifeStage);
  const body = archetypePaths(gid, vis.archetype, gid);
  const inner = lifeStage ? wrapLifeStageSvg(body, lifeStage) : body;
  return `<span class="creature-portrait portrait-${size}${slotCls}${animCls}${stageCls} ${className}" data-species="${speciesId}"${lifeStage ? ` data-life-stage="${lifeStage}"` : ''} style="${lifeStageGlowStyle(realm, lifeStage)}" aria-hidden="true">
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="">
      ${svgDefs(gid, vis.primary, vis.secondary, vis.accent)}
      ${inner}
    </svg>
  </span>`;
}

/**
 * @param {string} speciesIdA
 * @param {string} speciesIdB
 * @param {{ taxonA?: string, taxonB?: string, realm?: string, size?: string, sameSpecies?: boolean, lifeStage?: number, className?: string, animate?: boolean }} [opts]
 */
export function hybridPortraitHtml(speciesIdA, speciesIdB, opts = {}) {
  const {
    taxonA = 'mammal',
    taxonB = 'mammal',
    realm = 'terrestrial',
    size = 'hero',
    sameSpecies = speciesIdA === speciesIdB,
    lifeStage = 0,
    className = '',
    animate = true,
  } = opts;
  if (sameSpecies) {
    return portraitHtml(speciesIdA, {
      taxon: taxonA,
      realm,
      size,
      animate,
      className: `portrait-hybrid-solo ${className}`.trim(),
      lifeStage,
    });
  }

  const va = visForSpecies(speciesIdA, taxonA, realm);
  const vb = visForSpecies(speciesIdB, taxonB, realm);
  const gid = `hybrid-${speciesIdA}-${speciesIdB}-${lifeStage || 0}`.replace(/[^a-z0-9-]/gi, '');
  const stageCls = lifeStagePortraitClass(lifeStage);
  const animCls = animate ? ' portrait-animate' : '';
  const left = archetypePaths(`${gid}-l`, va.archetype, `${gid}-a`);
  const right = archetypePaths(`${gid}-r`, vb.archetype, `${gid}-b`);
  const hybridBody = `<g clip-path="url(#clip-left-${gid})">${left}</g>
      <g clip-path="url(#clip-right-${gid})">${right}</g>
      <line x1="32" y1="4" x2="32" y2="60" stroke="rgba(255,255,255,.25)" stroke-width="1.5" stroke-dasharray="3 3"/>
      <circle cx="32" cy="32" r="4" fill="rgba(155,95,255,.6)" stroke="#fff" stroke-width="1"/>`;
  const inner = lifeStage ? wrapLifeStageSvg(hybridBody, lifeStage) : hybridBody;

  return `<span class="creature-portrait portrait-${size} portrait-hybrid${animCls}${stageCls} ${className}"${lifeStage ? ` data-life-stage="${lifeStage}"` : ''} style="${lifeStageGlowStyle(realm, lifeStage)}" aria-hidden="true">
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      ${svgDefs(`${gid}-a`, va.primary, va.secondary, va.accent)}
      ${svgDefs(`${gid}-b`, vb.primary, vb.secondary, vb.accent)}
      <clipPath id="clip-left-${gid}"><rect x="0" y="0" width="32" height="64"/></clipPath>
      <clipPath id="clip-right-${gid}"><rect x="32" y="0" width="32" height="64"/></clipPath>
      ${inner}
    </svg>
  </span>`;
}

/** Dynamic SVG icons for deploy cards, crises, perks */
const DEPLOY_ICON_PATHS = {
  habitat: 'M32 8 L52 28 L52 48 L12 48 L12 28 Z M32 8 L12 28 M32 8 L52 28 M22 48 L22 36 M42 48 L42 36',
  food: 'M20 44 Q32 20 44 44 M26 38 L38 38',
  genefix: 'M32 12 L32 52 M20 24 L44 40 M44 24 L20 40',
  patrol: 'M32 10 L44 18 L44 38 Q32 52 20 38 L20 18 Z M32 28 L32 38 M28 32 L36 32',
  vaccine: 'M24 48 L24 28 Q32 18 40 28 L40 48 M28 48 L28 52 M36 48 L36 52',
  shelter: 'M10 44 L32 18 L54 44 Z M22 44 L22 52 L42 52 L42 44',
  relocate: 'M12 40 Q32 16 52 40 M18 40 L18 48 M46 40 L46 48',
  community: 'M20 36 Q32 22 44 36 M16 44 Q32 30 48 44',
  improvise: 'M18 46 L28 26 L38 40 L48 20',
  observe: 'M32 20 Q44 20 44 32 Q44 44 32 44 Q20 44 20 32 Q20 20 32 20 M32 32 m-6 0 a6 6 0 1 0 12 0',
};

const CRISIS_ICON_PATHS = {
  habitat: 'M10 48 L32 14 L54 48 Z',
  disease: 'M32 14 m-4 0 a4 4 0 1 0 8 0 m-12 10 a4 4 0 1 0 8 0 m16 0 a4 4 0 1 0 8 0 m-12 10 a4 4 0 1 0 8 0',
  predator: 'M14 40 Q32 16 50 40 M22 40 L18 48 M42 40 L46 48',
  drought: 'M32 12 L38 28 L32 24 L26 28 Z M18 44 Q32 34 46 44',
  human: 'M16 48 L16 28 L48 28 L48 48 M22 48 L22 36 L42 36 L42 48',
  food: 'M16 40 Q32 24 48 40',
  pollution: 'M20 44 Q32 28 44 44 M28 36 L36 36',
  flood: 'M10 40 Q22 28 32 36 Q42 28 54 40 L54 48 L10 48 Z',
  fire: 'M32 10 Q42 28 36 38 Q44 32 48 48 Q32 42 16 48 Q20 32 28 38 Q22 28 32 10',
  heat_dome: 'M16 40 Q32 18 48 40 M24 44 L40 44',
  cold_snap: 'M32 12 L32 44 M24 20 L32 12 L40 20 M24 36 L32 44 L40 36',
  illegal_trade: 'M14 36 L50 36 L50 44 L14 44 Z M20 36 L20 28 L44 28 L44 36',
  bycatch: 'M10 32 Q32 20 54 32 M14 40 L50 40',
  algal_bloom: 'M16 36 Q32 24 48 36 Q32 48 16 36',
  seismic: 'M12 44 L22 28 L32 40 L42 24 L52 44',
  windstorm: 'M32 14 Q48 28 32 36 Q16 28 32 14 M32 36 L32 48',
  parasite_wave: 'M20 40 Q28 28 36 40 Q44 28 52 40',
  mining: 'M18 48 L26 24 L38 24 L46 48',
  shipping_lane: 'M10 36 L54 36 M18 36 L14 48 M46 36 L50 48',
  invasive_plant: 'M32 48 L32 20 M24 28 L32 20 L40 28',
};

const STAGE_ICONS = [
  { path: 'M32 20 Q20 32 32 48 Q44 32 32 20', color: '#4fffdf', label: 'Birth' },
  { path: 'M20 44 L32 18 L44 44 Z', color: '#4f7fff', label: 'Juvenile' },
  { path: 'M16 44 Q32 16 48 44', color: '#9b5fff', label: 'Adult' },
  { path: 'M32 14 L44 44 L20 44 Z', color: '#ffb84f', label: 'Old age' },
];

/**
 * @param {'deploy'|'crisis'|'perk'|'stage'} kind
 * @param {string} id
 * @param {{ glow?: boolean, pulse?: boolean, size?: number, color?: string }} [opts]
 */
export function dynIcon(kind, id, opts = {}) {
  const { glow = false, pulse = false, size = 36, color } = opts;
  let path = '';
  let stroke = color || '#4f7fff';
  let fill = 'none';

  if (kind === 'deploy') {
    path = DEPLOY_ICON_PATHS[id] || DEPLOY_ICON_PATHS.observe;
    stroke = color || '#2dffb3';
  } else if (kind === 'crisis') {
    path = CRISIS_ICON_PATHS[id] || CRISIS_ICON_PATHS.habitat;
    stroke = color || '#ff4f6b';
  } else if (kind === 'stage') {
    const idx = Math.max(0, Math.min(3, Number(id) - 1));
    const st = STAGE_ICONS[idx];
    path = st.path;
    stroke = st.color;
    fill = `${st.color}22`;
  } else if (kind === 'perk') {
    path = 'M32 12 L38 28 L32 24 L26 28 Z M20 40 Q32 28 44 40';
    stroke = color || '#ffb84f';
  }

  const cls = ['dyn-icon', glow ? 'dyn-icon-glow' : '', pulse ? 'dyn-icon-pulse' : ''].filter(Boolean).join(' ');
  return `<span class="${cls}" style="--icon-size:${size}px;--icon-color:${stroke}" aria-hidden="true">
    <svg viewBox="0 0 64 64" width="${size}" height="${size}">
      <path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </span>`;
}

export function lifeStageIcon(stageIndex) {
  return dynIcon('stage', String(stageIndex), { glow: true, size: 40 });
}

/** Intro overlay — one animated SVG per step (replaces static emoji) */
const INTRO_STEP_ART = [
  {
    color: '#4f7fff',
    secondary: '#9b5fff',
    svg: `<path d="M22 8 Q34 18 22 28 Q34 38 22 48 Q34 58 22 56" fill="none" stroke="#4f7fff" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M42 8 Q30 18 42 28 Q30 38 42 48 Q30 58 42 56" fill="none" stroke="#9b5fff" stroke-width="2.8" stroke-linecap="round"/>
      <line x1="22" y1="18" x2="42" y2="18" stroke="#4fffdf" stroke-width="1.5" opacity=".6"/>
      <line x1="22" y1="38" x2="42" y2="38" stroke="#4fffdf" stroke-width="1.5" opacity=".6"/>`,
  },
  {
    color: '#9b5fff',
    secondary: '#4f7fff',
    svg: `<circle cx="22" cy="34" r="11" fill="rgba(79,127,255,.15)" stroke="#4f7fff" stroke-width="2.5"/>
      <circle cx="42" cy="34" r="11" fill="rgba(155,95,255,.15)" stroke="#9b5fff" stroke-width="2.5"/>
      <text x="32" y="38" text-anchor="middle" fill="#4fffdf" font-size="14" font-weight="700">+</text>`,
  },
  {
    color: '#2dffb3',
    secondary: '#4f7fff',
    svg: `<circle cx="32" cy="32" r="18" fill="none" stroke="#2dffb3" stroke-width="2" opacity=".5"/>
      <circle cx="32" cy="14" r="5" fill="#4f7fff" stroke="#4fffdf" stroke-width="1.5"/>
      <circle cx="20" cy="40" r="5" fill="#9b5fff" stroke="#4fffdf" stroke-width="1.5"/>
      <circle cx="44" cy="40" r="5" fill="#ffb84f" stroke="#4fffdf" stroke-width="1.5"/>
      <line x1="32" y1="19" x2="32" y2="32" stroke="#4fffdf" stroke-width="1" opacity=".4"/>
      <line x1="24" y1="37" x2="32" y2="32" stroke="#4fffdf" stroke-width="1" opacity=".4"/>
      <line x1="40" y1="37" x2="32" y2="32" stroke="#4fffdf" stroke-width="1" opacity=".4"/>`,
  },
  {
    color: '#2dffb3',
    secondary: '#4f7fff',
    svg: `<path d="M32 10 L44 18 L44 38 Q32 52 20 38 L20 18 Z" fill="rgba(45,255,179,.12)" stroke="#2dffb3" stroke-width="2.8" stroke-linejoin="round"/>
      <rect x="26" y="28" width="12" height="10" rx="2" fill="none" stroke="#4f7fff" stroke-width="2"/>
      <path d="M28 32 L36 32 M32 28 L32 36" stroke="#4f7fff" stroke-width="1.5" stroke-linecap="round"/>`,
  },
  {
    color: '#ffb84f',
    secondary: '#ff4f6b',
    svg: `<circle cx="32" cy="32" r="20" fill="none" stroke="#ffb84f" stroke-width="1.5" opacity=".35"/>
      <circle cx="32" cy="32" r="13" fill="none" stroke="#ffb84f" stroke-width="2" opacity=".55"/>
      <circle cx="32" cy="32" r="6" fill="#ffb84f" stroke="#fff" stroke-width="1"/>
      <path d="M32 12 L32 8 M32 56 L32 52 M12 32 L8 32 M56 32 L52 32" stroke="#ffb84f" stroke-width="2" stroke-linecap="round" opacity=".5"/>`,
  },
  {
    color: '#ffb84f',
    secondary: '#4fffdf',
    svg: `<path d="M32 14 L38 28 L32 24 L26 28 Z" fill="rgba(255,184,79,.25)" stroke="#ffb84f" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M24 30 Q32 22 40 30 L38 44 Q32 50 26 44 Z" fill="rgba(255,184,79,.1)" stroke="#ffb84f" stroke-width="2"/>
      <circle cx="20" cy="20" r="2" fill="#4fffdf" class="intro-spark"/><circle cx="46" cy="22" r="1.5" fill="#4f7fff" class="intro-spark"/>
      <text x="32" y="40" text-anchor="middle" fill="#4fffdf" font-size="11" font-weight="700">✦</text>`,
  },
  {
    color: '#4f7fff',
    secondary: '#9b5fff',
    svg: `<path d="M32 8 L40 44 L32 38 L24 44 Z" fill="rgba(79,127,255,.2)" stroke="#4f7fff" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M28 44 L32 52 L36 44" fill="none" stroke="#9b5fff" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="32" cy="48" rx="6" ry="3" fill="rgba(155,95,255,.35)" class="intro-flame"/>
      <circle cx="32" cy="22" r="3" fill="#4fffdf" opacity=".8"/>`,
  },
];

/**
 * Dynamic intro icon — changes automatically with intro step index.
 * @param {number} stepIndex 0-based
 */
export function introStepIconHtml(stepIndex) {
  const idx = Math.max(0, Math.min(INTRO_STEP_ART.length - 1, Number(stepIndex) || 0));
  const art = INTRO_STEP_ART[idx];
  const launchCls = idx === INTRO_STEP_ART.length - 1 ? ' intro-icon-launch' : '';
  return `<div class="intro-icon-wrap intro-icon-enter${launchCls}" data-intro-step="${idx}" style="--intro-color:${art.color};--intro-color2:${art.secondary}" aria-hidden="true">
    <div class="intro-icon-glow"></div>
    <svg class="intro-icon-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${art.svg}</svg>
  </div>`;
}

export function introStepCount() {
  return INTRO_STEP_ART.length;
}

export function founderPortrait(found, opts = {}) {
  if (!found?.species) return '';
  return portraitHtml(found.species.id, {
    taxon: found.species.taxon,
    realm: found.species.realm || 'terrestrial',
    ...opts,
  });
}

export function hybridFromFounders(parentA, parentB, opts = {}) {
  if (!parentA?.species || !parentB?.species) return '';
  return hybridPortraitHtml(parentA.species.id, parentB.species.id, {
    taxonA: parentA.species.taxon,
    taxonB: parentB.species.taxon,
    realm: parentA.species.realm || parentB.species.realm || 'terrestrial',
    sameSpecies: parentA.species.id === parentB.species.id,
    ...opts,
  });
}

export function hybridFromHybrid(h, opts = {}) {
  if (!h?.parentA?.species || !h?.parentB?.species) {
    return portraitHtml(h?.parentA?.species?.id || 'snow-leopard', opts);
  }
  return hybridFromFounders(h.parentA, h.parentB, opts);
}

export function recordPortrait(pA, pB, opts = {}) {
  if (!pA) return portraitHtml('snow-leopard', opts);
  if (!pB || pA === pB) return portraitHtml(pA, opts);
  return hybridPortraitHtml(pA, pB, opts);
}

// ── Three.js procedural creatures (used by scene3d.js) ──

function meshMat(color, emissive = 0.35) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: emissive,
    metalness: 0.5,
    roughness: 0.32,
  });
}

/** @param {THREE.Group} group */
function clearGroup(group) {
  while (group.children.length) {
    const c = group.children[0];
    group.remove(c);
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
      else c.material.dispose();
    }
  }
}

/**
 * @param {string} speciesId
 * @param {{ taxon?: string, color?: number }} [opts]
 * @returns {THREE.Group}
 */
export function buildCreatureGroup(speciesId, opts = {}) {
  const { taxon = 'mammal', color = 0x4f7fff } = opts;
  const vis = SPECIES_VIS[speciesId] || TAXON_FALLBACK[taxon] || TAXON_FALLBACK.mammal;
  const col = new THREE.Color(color);
  const group = new THREE.Group();
  const mat = meshMat(col);

  const add = (geo, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.set(rx, ry, 0);
    m.castShadow = true;
    group.add(m);
    return m;
  };

  switch (vis.archetype) {
    case 'feline':
      add(new THREE.SphereGeometry(0.35, 16, 16), 0.15, 0.05, 0, 1.1, 0.75, 1.4);
      add(new THREE.SphereGeometry(0.22, 14, 14), 0.55, 0.22, 0);
      add(new THREE.ConeGeometry(0.06, 0.14, 4), 0.48, 0.38, -0.08, 1, 1, 1, 0, 0.4);
      add(new THREE.ConeGeometry(0.06, 0.14, 4), 0.48, 0.38, 0.08, 1, 1, 1, 0, -0.4);
      add(new THREE.CylinderGeometry(0.05, 0.04, 0.35, 6), -0.45, 0.05, 0, 1, 1, 1, 0, 0.8);
      break;
    case 'cetacean':
      add(new THREE.SphereGeometry(0.32, 16, 16), 0, 0.08, 0, 1.8, 0.65, 0.75);
      add(new THREE.ConeGeometry(0.12, 0.22, 4), -0.55, 0.12, 0, 1, 1, 1, 0, Math.PI / 2);
      add(new THREE.BoxGeometry(0.04, 0.28, 0.14), 0.55, 0.02, 0);
      break;
    case 'rhino':
      add(new THREE.BoxGeometry(0.55, 0.38, 0.42), 0, 0.02, 0);
      add(new THREE.SphereGeometry(0.24, 14, 14), 0.42, 0.18, 0);
      add(new THREE.ConeGeometry(0.05, 0.28, 5), 0.62, 0.28, 0, 1, 1, 1, -0.3, 0);
      break;
    case 'avian':
      add(new THREE.SphereGeometry(0.28, 14, 14), 0, 0.05, 0, 1, 0.9, 1);
      add(new THREE.SphereGeometry(0.16, 12, 12), 0.32, 0.18, 0);
      add(new THREE.ConeGeometry(0.08, 0.18, 4), 0.48, 0.16, 0, 1, 1, 1, 0, Math.PI / 2);
      add(new THREE.BoxGeometry(0.02, 0.32, 0.18), -0.12, 0.08, 0, 1, 1, 1, 0, 0.6);
      break;
    case 'primate':
      add(new THREE.SphereGeometry(0.3, 14, 14), 0, 0.02, 0, 0.95, 1.05, 0.85);
      add(new THREE.SphereGeometry(0.2, 12, 12), 0.02, 0.38, 0);
      add(new THREE.CapsuleGeometry(0.06, 0.35, 4, 8), -0.32, 0.12, 0, 1, 1, 1, 0, 0.5);
      add(new THREE.CapsuleGeometry(0.06, 0.35, 4, 8), 0.32, 0.12, 0, 1, 1, 1, 0, -0.5);
      break;
    case 'amphibian':
      add(new THREE.SphereGeometry(0.28, 14, 14), 0, 0, 0, 1.5, 0.55, 0.65);
      add(new THREE.SphereGeometry(0.16, 12, 12), 0.42, 0.08, 0);
      for (let i = 0; i < 3; i += 1) {
        add(new THREE.TorusGeometry(0.04, 0.012, 6, 12), 0.5, 0.14 + i * 0.06, 0.06, 1, 1, 1, 0.5, 0);
      }
      break;
    case 'chelonian':
      add(new THREE.SphereGeometry(0.32, 16, 16), 0, 0.05, 0, 1.1, 0.55, 1.2);
      add(new THREE.SphereGeometry(0.14, 12, 12), 0.42, 0.06, 0);
      add(new THREE.BoxGeometry(0.22, 0.04, 0.08), -0.18, 0.02, 0.14, 1, 1, 1, 0, 0.4);
      add(new THREE.BoxGeometry(0.22, 0.04, 0.08), -0.18, 0.02, -0.14, 1, 1, 1, 0, -0.4);
      break;
    case 'antelope':
      add(new THREE.CylinderGeometry(0.14, 0.18, 0.55, 10), 0, 0.02, 0, 1, 1, 1.2);
      add(new THREE.SphereGeometry(0.16, 12, 12), 0.28, 0.28, 0);
      add(new THREE.CylinderGeometry(0.015, 0.02, 0.22, 4), 0.24, 0.42, -0.05);
      add(new THREE.CylinderGeometry(0.015, 0.02, 0.22, 4), 0.24, 0.42, 0.05);
      break;
    case 'pangolin':
      for (let i = 0; i < 6; i += 1) {
        add(new THREE.SphereGeometry(0.12, 10, 10), -0.2 + i * 0.1, 0.04 + Math.sin(i) * 0.04, 0, 1.1, 0.7, 0.9);
      }
      add(new THREE.SphereGeometry(0.14, 12, 12), 0.38, 0.1, 0);
      break;
    default:
      add(new THREE.IcosahedronGeometry(0.38, 1), 0, 0.1, 0);
  }

  group.userData.speciesId = speciesId;
  group.userData.archetype = vis.archetype;
  return group;
}

/**
 * Replace creature in a slot group if species changed.
 * @param {THREE.Group} slotGroup
 * @param {string|null} speciesId
 * @param {number} color
 * @param {string} taxon
 */
export function setSlotCreature(slotGroup, speciesId, color, taxon) {
  if (!slotGroup) return;
  if (!speciesId) {
    slotGroup.visible = false;
    return;
  }
  if (slotGroup.userData.speciesId === speciesId) {
    slotGroup.visible = true;
    return;
  }
  clearGroup(slotGroup);
  const built = buildCreatureGroup(speciesId, { taxon, color });
  while (built.children.length) slotGroup.add(built.children[0]);
  slotGroup.userData.speciesId = speciesId;
  slotGroup.userData.archetype = built.userData.archetype;
  slotGroup.visible = true;
}

export function speciesColorHex(speciesId, taxon = 'mammal') {
  const vis = SPECIES_VIS[speciesId] || TAXON_FALLBACK[taxon];
  return new THREE.Color(vis.primary).getHex();
}
