import { SPECIES } from '../../core/species.js';
import { SUB_ROUNDS_PER_ROUND, RESOURCE_SOFT_CAP } from '../../core/constants.js';
import { game } from '../../core/state.js';
import { campaignForSlot } from '../../core/campaign.js';
import { estimatedDeploysLeft } from '../../core/resource-economy.js';
import {
  gameProgressLabel,
  gameProgressTrackLabel,
  crossesPassedCount,
} from '../../game/round-tracker.js';
import { nextGameNumber } from '../../game/game-intro.js';
import { renderGoalStrip } from '../../content/player-guide.js';
import { fmtRes } from './helpers.js';

const FOUNDER_COUNT = SPECIES.reduce((n, sp) => n + sp.individuals.length, 0);

const NAV_ITEMS = [
  { v: 'lab', icon: '🧬', label: 'Gene Lab' },
  { v: 'records', icon: '📋', label: 'Records' },
  { v: 'history', icon: '📜', label: 'History' },
  { v: 'settings', icon: '⚙️', label: 'Settings' },
];

function biodiversityAtRiskPct() {
  const extinct = game.ST.extinctions?.length ?? 0;
  const fame = game.ST.fame?.length ?? 0;
  const total = extinct + fame + 12;
  return Math.min(99, Math.max(12, Math.round(40 + extinct * 8 - fame * 2)));
}

export function renderShell() {
  document.body.dataset.view = game.VIEW || 'lab';
  renderSidebar();
  renderMissionBand();
  renderStatsRail();
}

function renderSidebar() {
  const el = document.getElementById('sidebar');
  if (!el) return;
  const nav = NAV_ITEMS.map(
    (item) =>
      `<button type="button" class="nav-item${game.VIEW === item.v ? ' on' : ''}" data-v="${item.v}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </button>`,
  ).join('');
  el.innerHTML = `
    <div class="sidebar-brand">
      <span class="sidebar-logo">🧬</span>
      <div>
        <div class="sidebar-title">DNA LAB</div>
        <div class="sidebar-sub">Species Engine</div>
      </div>
    </div>
    <nav class="sidebar-nav" id="tabs" aria-label="Main navigation">${nav}</nav>
    <div class="sidebar-foot">
      <span class="sidebar-meta">${SPECIES.length} species · ${FOUNDER_COUNT} founders</span>
      <span class="sidebar-meta">💾 Local save</span>
    </div>`;
}

function renderMissionBand() {
  const el = document.getElementById('mission-band');
  if (!el) return;
  const gNum = nextGameNumber();
  const bioRisk = biodiversityAtRiskPct();
  const br = game.ST.breedRound ?? 1;
  const camp = campaignForSlot(br);
  const cross = game.roundActive ? `${game.subRoundIndex}/${SUB_ROUNDS_PER_ROUND}` : '—';
  const passes = game.roundActive ? game.crossPassesRemaining ?? 0 : '—';
  const lab = fmtRes(game.ST.resources);
  const passed = game.roundActive ? crossesPassedCount() : 0;
  const gameLbl = game.roundActive
    ? gameProgressLabel({ finalTag: false })
    : game.gameAwaitingStart
      ? 'Ready to begin'
      : '—';

  const startCta = game.gameAwaitingStart
    ? `<button type="button" class="btn btn-p btn-lg mission-start" data-action="open-start-game">▶ Start Game ${gNum}</button>`
    : '';

  const tags = game.roundActive
    ? `<div class="mission-tags">
        <span class="tag tag-game">${gameLbl}</span>
        ${passed > 0 ? `<span class="tag tag-passed">Passed ${passed}</span>` : ''}
        <span class="tag tag-p">${camp.label}</span>
        <span class="tag tag-b">Cross ${cross}</span>
        <span class="tag tag-a">Actions ${passes}</span>
        <span class="tag tag-g">Lab ${lab}/${RESOURCE_SOFT_CAP}</span>
      </div>`
    : '';

  el.innerHTML = `
    <div class="mission-band-inner glass-panel">
      <div class="mission-copy">
        <h1 class="mission-title">DNA Merge</h1>
        <p class="mission-tagline">Species Survival Engine — <em>Predict. Protect. Preserve.</em></p>
        ${tags}
        ${startCta}
      </div>
      <div class="mission-globe-widget glass-panel-sm" aria-hidden="true">
        <div class="globe-stat-label">Biodiversity at risk</div>
        <div class="globe-stat-value" data-bio-risk="${bioRisk}">${bioRisk}%</div>
        <div class="globe-stat-note">Derived from extinction pressure</div>
      </div>
    </div>`;
}

function renderStatsRail() {
  const el = document.getElementById('stats-rail');
  if (!el) return;
  const preds = Array.isArray(game.ST.predictions) ? game.ST.predictions : [];
  const cor = preds.filter((p) => p.ok).length;
  const acc = preds.length ? Math.round((cor / preds.length) * 100) : 0;
  const pts = Math.floor(Number(game.ST.points) || 0);

  const sr = game.roundActive ? Math.min(SUB_ROUNDS_PER_ROUND, Math.max(1, game.subRoundIndex || 1)) : 0;
  const life = game.PHASE === 'life' ? game.lifeStageIndex || 1 : 0;
  const pills = [1, 2, 3]
    .map((n) => {
      let cls = 'cypill';
      if (game.roundActive && sr === n && game.PHASE !== 'select' && game.PHASE !== 'merging') cls += ' on';
      return `<div class="${cls}" title="Animal cross ${n}">${n}</div>`;
    })
    .join('');

  const showTrack =
    game.roundActive &&
    game.PHASE !== 'roundEnd' &&
    (game.HYBRID || game.PHASE === 'select' || game.PHASE === 'life');

  const track = showTrack
    ? `<div class="cytrack anim-up">${pills}<div class="cybreedlbl">${game.roundActive ? gameProgressTrackLabel() : 'Awaiting Start Game'}${life ? `<span class="cy-stage-hint"> · Stage ${life}/4</span>` : ''}</div></div>`
    : '';

  const labNum = game.gameAwaitingStart ? '—' : fmtRes(game.ST.resources);
  const labPct = game.gameAwaitingStart ? 0 : Math.round((Number(game.ST.resources) / RESOURCE_SOFT_CAP) * 100);

  const goalStrip = game.roundActive && game.VIEW === 'lab' ? renderGoalStrip(game) : '';

  el.innerHTML = `
    <div class="rail-section glass-panel">
      <div class="stats-group-lbl">This run</div>
      <div class="stats-grid stats-grid-run">
        <div class="sc sb"><div class="n">${game.roundActive ? game.crossPassesRemaining ?? 0 : '—'}</div><div class="l">Actions left</div></div>
        <div class="sc sa${game.gameAwaitingStart ? ' sc-lab-idle' : ''}">
          <div class="n">${labNum}<span class="res-cap">/${RESOURCE_SOFT_CAP}</span></div>
          <div class="l">Lab resources</div>
          <div class="resource-meter"><div class="resource-meter-fill" style="width:${labPct}%"></div></div>
        </div>
      </div>
      ${track}
    </div>
    <div class="rail-section glass-panel">
      <div class="stats-group-lbl">Lifetime</div>
      <div class="stats-grid stats-grid-lifetime">
        <div class="sc sg"><div class="n">${game.ST.fame.length}</div><div class="l">Full lives</div></div>
        <div class="sc sr"><div class="n">${game.ST.extinctions.length}</div><div class="l">Extinct</div></div>
        <div class="sc sb"><div class="n">${acc}%</div><div class="l">Guess-to-reality</div></div>
        <div class="sc spnts"><div class="n">${pts}</div><div class="l">Points</div></div>
      </div>
    </div>
    ${goalStrip ? `<div class="rail-section rail-goal glass-panel">${goalStrip}</div>` : ''}`;
}
