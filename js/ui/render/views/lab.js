import { TMETA } from '../../../core/constants.js';
import { SPECIES, TAXON_LABEL, taxonChipClass, REALM_LABEL, realmChipClass } from '../../../core/species.js';
import { game } from '../../../core/state.js';
import { scoreColor } from '../../../core/game-logic.js';
import { mergeBlockReason, previewBlend, founderTraits } from '../../../core/breeding.js';
import { breedCampaignBanner } from '../../../content/cycle-meta.js';
import { gameProgressBannerHtml, gameProgressLabel } from '../../../game/round-tracker.js';
import { shouldShowHint, renderContextHint, renderGoalStrip } from '../../../content/player-guide.js';
import { portraitHtml, hybridFromFounders } from '../../visuals/creature-visuals.js';
import { coachBanner } from '../helpers.js';
import { filterChipsHtml } from '../../components/filter-chips.js';
import { mergeDockHtml } from '../../components/merge-dock.js';

const FOUNDER_STAT_KEYS = ['adaptability', 'immune', 'climate', 'social'];

function founderStatsHtml(traits) {
  return `<div class="ind-stats">${FOUNDER_STAT_KEYS.map((k) => {
    const v = traits[k] ?? 0;
    const meta = TMETA[k];
    const lbl = meta.label.replace(/^[^\s]+\s/, '').split(' ')[0];
    return `<div class="ind-stat-row">
      <span class="ind-stat-lbl">${lbl}</span>
      <div class="ind-stat-bar"><div class="ind-stat-fill" style="width:${v}%;background:${meta.color}"></div></div>
      <span class="ind-stat-val">${v}</span>
    </div>`;
  }).join('')}</div>`;
}

function speciesPassesFilter(sp) {
  const f = game.labFilter || 'all';
  if (f === 'all') return true;
  if (f === 'mammal' || f === 'reptile' || f === 'avian') return sp.taxon === f;
  if (f === 'terrestrial' || f === 'marine' || f === 'freshwater') return (sp.realm || 'terrestrial') === f;
  if (f === 'compat' && game.SEL_PARENT_A) {
    const probe = mergeBlockReason(game.SEL_PARENT_A, { species: sp, individual: sp.individuals[0] }, game.ST.extinctions);
    return !probe || !(
      probe.includes('Cross-class') ||
      probe.includes('Realm clash') ||
      probe.includes('Breeding requires') ||
      probe.includes('extinct')
    );
  }
  return true;
}

function mergePreviewHtml() {
  const A = game.SEL_PARENT_A;
  const B = game.SEL_PARENT_B;
  if (!A || !B || mergeBlockReason(A, B, game.ST.extinctions)) return '';
  const prev = previewBlend(A, B);
  const col = scoreColor(Math.round((prev.scoreMin + prev.scoreMax) / 2));
  const badge = prev.sameSpecies
    ? '<span class="merge-preview-badge badge-renewal">Same-species renewal</span>'
    : '<span class="merge-preview-badge badge-cross">Cross-line rescue</span>';
  const traitRows = Object.keys(prev.traitsMin)
    .slice(0, 4)
    .map((k) => {
      const meta = TMETA[k];
      const lo = prev.traitsMin[k];
      const hi = prev.traitsMax[k];
      return `<div class="preview-trait-row">
        <span class="preview-trait-lbl">${meta.label.replace(/^[^\s]+\s/, '')}</span>
        <div class="preview-trait-bar">
          <div class="preview-trait-fill" style="left:${lo}%;width:${hi - lo}%;background:${meta.color}"></div>
        </div>
        <span class="tval-dynamic" style="color:${meta.color}">${lo}–${hi}</span>
      </div>`;
    })
    .join('');
  return `<div class="merge-preview anim-up">
    <div class="merge-preview-hdr">Genetics preview</div>
    <div class="merge-preview-visual">${hybridFromFounders(A, B, { size: 'md' })}</div>
    ${badge}
    <div class="merge-preview-score" style="color:${col}">Viability band ${prev.scoreMin}–${prev.scoreMax}</div>
    ${traitRows}
  </div>`;
}

export function renderSelect(m) {
  const reason = mergeBlockReason(game.SEL_PARENT_A, game.SEL_PARENT_B, game.ST.extinctions);
  const canMerge =
    game.roundActive && !game.gameAwaitingStart && game.SEL_PARENT_A && game.SEL_PARENT_B && !reason;

  const sections = SPECIES.filter(speciesPassesFilter)
    .map((sp) => {
      const badgeCls = sp.iucn === 'CR' ? 'sp-cr' : sp.iucn === 'EN' ? 'sp-en' : 'sp-vu';
      const cards = sp.individuals
        .map((ind) => {
          const tempFound = { species: sp, individual: ind };
          const isA = game.SEL_PARENT_A?.individual.id === ind.id;
          const isB = game.SEL_PARENT_B?.individual.id === ind.id;
          let locked = !!game.gameAwaitingStart;
          if (game.SEL_PARENT_A && !isA && !game.gameAwaitingStart) {
            const probe = mergeBlockReason(game.SEL_PARENT_A, tempFound, game.ST.extinctions);
            if (
              probe &&
              (probe.includes('Cross-class') ||
                probe.includes('Realm clash') ||
                probe.includes('Breeding requires') ||
                probe.includes('extinct'))
            )
              locked = true;
          }
          if (game.SEL_PARENT_B && !isB && !game.gameAwaitingStart) {
            const probe = mergeBlockReason(tempFound, game.SEL_PARENT_B, game.ST.extinctions);
            if (
              probe &&
              (probe.includes('Cross-class') ||
                probe.includes('Realm clash') ||
                probe.includes('Breeding requires') ||
                probe.includes('extinct'))
            )
              locked = true;
          }
          const cls = locked ? 'locked' : isA ? 'sa' : isB ? 'sb' : '';
          const slot = isA
            ? `<span class="sp-slot sla">A</span>`
            : isB
              ? `<span class="sp-slot slb">B</span>`
              : locked
                ? `<span class="sp-slot slx">✗</span>`
                : '';
          const interact = locked ? 'disabled' : `data-action="pick-founder" data-founder-id="${ind.id}"`;
          return `<button type="button" class="ind ${cls}" ${interact} title="${ind.displayName}">
          ${slot}
          <span class="${badgeCls} ind-badge">${sp.iucn}</span>
          ${portraitHtml(sp.id, { taxon: sp.taxon, realm: sp.realm, size: 'xs', animate: !locked, slot: isA ? 'a' : isB ? 'b' : null })}
          <div class="ind-nm">${ind.displayName}</div>
          <div class="ind-meta">${ind.gender}</div>
          <div class="ind-person">${ind.personality}</div>
          ${founderStatsHtml(founderTraits(tempFound))}
        </button>`;
        })
        .join('');

      return `<div class="species-section anim-up">
      <div class="species-head">
        ${portraitHtml(sp.id, { taxon: sp.taxon, realm: sp.realm, size: 'sm', animate: true, className: 'species-head-portrait' })}
        <strong>${sp.name}</strong>
        <span class="sp-status">· ${sp.status}</span>
        <span class="${taxonChipClass(sp.taxon)}">${TAXON_LABEL[sp.taxon]}</span>
        <span class="${realmChipClass(sp.realm)}">${REALM_LABEL[sp.realm || 'terrestrial']}</span>
      </div>
      <div class="founder-carousel ind-carousel">${cards}</div>
    </div>`;
    })
    .join('');

  let mergeLabel = '🧬 Merge founders →';
  if (game.gameAwaitingStart) mergeLabel = '▶ Start Game first';
  else if (reason) {
    if (reason.includes('Cross-class')) mergeLabel = '⛔ Different animal classes';
    else if (reason.includes('Realm clash')) mergeLabel = '🌊 Land vs water clash';
    else if (reason.includes('Breeding requires')) mergeLabel = '🚻 Need male + female';
    else if (reason.includes('cloning')) mergeLabel = '⚠️ Same founder twice';
    else if (reason.includes('extinct')) mergeLabel = '🔒 Extinct pairing';
    else mergeLabel = '⚠️ Select two founders';
  }

  const bothSelected = game.SEL_PARENT_A && game.SEL_PARENT_B;

  m.innerHTML = `
    <div class="lab-view-stack">
    ${coachBanner()}
    ${game.gameAwaitingStart && shouldShowHint('welcomeLobby', game.ST) ? renderContextHint('welcomeLobby') : ''}
    ${game.roundActive ? gameProgressBannerHtml() : ''}
    ${breedCampaignBanner(game.ST.breedRound ?? 1)}
    ${game.roundActive ? `<div class="lab-mobile-goal">${renderGoalStrip(game)}</div>` : ''}
    <div class="lab-dashboard${game.gameAwaitingStart ? ' lab-layout-locked' : ''}${bothSelected ? ' lab-has-popup' : ''}">
      <div class="lab-scroll">
        <div class="card gene-lab-card glass-panel anim-up">
          <div class="ctitle">${game.roundActive ? gameProgressLabel() : 'Gene Lab'} — Choose founders</div>
          <p class="gene-lab-lede guide-lede">
            Tap two founders from the grid — the merge bridge pops up when both are selected.
          </p>
          ${filterChipsHtml()}
          ${mergePreviewHtml()}
          ${sections}
          ${reason && bothSelected ? `<div class="extinct-warn anim-up">${reason}</div>` : ''}
        </div>
      </div>
    </div>
    </div>
    ${bothSelected ? mergeDockHtml(canMerge, mergeLabel, { popup: true }) : ''}`;
}