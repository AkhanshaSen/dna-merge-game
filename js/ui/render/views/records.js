import { game } from '../../../core/state.js';
import { ACHIEVEMENT_DEFS, hasAchievement } from '../../../content/achievements.js';
import { recordPortrait } from '../../visuals/creature-visuals.js';

function founderFooter(h) {
  if (h?.founderLine) return h.founderLine;
  const fa = h?.founderAn || '';
  const fb = h?.founderBn || '';
  if (fa && fb) return `${fa} × ${fb}`;
  return `${h?.pAn || ''} × ${h?.pBn || ''}`;
}

function achievementsHtml() {
  const cards = ACHIEVEMENT_DEFS.map((a) => {
    const unlocked = hasAchievement(game.ST, a.id);
    return `<div class="ach-card${unlocked ? ' unlocked' : ''}">
      <span class="ach-icon">${a.icon}</span>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
    </div>`;
  }).join('');
  return `<div class="card anim-up s3"><div class="ctitle">🏅 Achievements</div><div class="ach-grid">${cards}</div></div>`;
}

export function renderRecords(m) {
  const filter = game.recordsFilter || 'all';
  let fame = [...game.ST.fame];
  let extinct = [...game.ST.extinctions];
  if (filter === 'fame') extinct = [];
  if (filter === 'extinct') fame = [];

  const fCards = fame.length
    ? fame
        .map(
          (h) => `<div class="hcard hf">
        ${recordPortrait(h.pA, h.pB, { size: 'md', animate: true, className: 'hcard-portrait' })}
        <div class="hnm2">${h.name}</div>
        <div class="hpar2">${founderFooter(h)}</div>
        <div class="hscore hscore-good">Score: ${h.score}${h.fullLife ? ' · Natural life' : ''}</div>
      </div>`,
        )
        .join('')
    : `<div class="empty"><span class="eic">🏆</span><div class="etx">No full-life arcs yet</div></div>`;
  const eCards = extinct.length
    ? extinct
        .map(
          (e) => `<div class="hcard he">
        ${recordPortrait(e.pA, e.pB, { size: 'md', animate: false, className: 'hcard-portrait hcard-portrait-extinct' })}
        <div class="hnm2">${e.name}</div>
        <div class="hpar2">🔒 ${founderFooter(e)}</div>
        <div class="hscore hscore-bad">Permanently extinct</div>
      </div>`,
        )
        .join('')
    : `<div class="empty"><span class="eic">💀</span><div class="etx">No extinctions recorded</div></div>`;

  const filt = ['all', 'fame', 'extinct']
    .map(
      (f) =>
        `<button type="button" class="fchip${filter === f ? ' on' : ''}" data-action="records-filter" data-records-filter="${f}">${f === 'all' ? 'All' : f === 'fame' ? 'Fame only' : 'Extinct only'}</button>`,
    )
    .join('');

  m.innerHTML = `
    <div class="card anim-up"><div class="ctitle">🏆 Hall of Fame (${game.ST.fame.length})</div>
      <div class="records-filter">${filt}</div>
      <div class="hgrid">${fCards}</div></div>
    <div class="card anim-up s2"><div class="ctitle">💀 Hall of Extinction (${game.ST.extinctions.length})</div><div class="hgrid">${eCards}</div></div>
    ${achievementsHtml()}`;
}