import { TMETA } from '../../core/constants.js';
import { game } from '../../core/state.js';

export function fmtRes(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  return Math.abs(x - Math.round(x)) < 0.001 ? String(Math.round(x)) : x.toFixed(1);
}

export function coachBanner() {
  const n = game.coachNote;
  if (!n?.text) return '';
  const cls =
    n.kind === 'good' ? 'coach-good' : n.kind === 'warn' ? 'coach-warn' : 'coach-neutral';
  return `<div class="coach-banner ${cls}" role="status">${n.text}</div>`;
}

export function founderLabel(found) {
  if (!found) return '';
  return `${found.individual.displayName} (${found.individual.gender})`;
}

export function slotHtml(found) {
  if (!found) return `<div class="mslot-ph">Select a founder</div>`;
  const sp = found.species;
  const ind = found.individual;
  return `
    <div class="mslot-portrait-wrap"></div>
    <div class="mslot-nm">${ind.displayName}</div>
    <div class="mslot-sub">${sp.name} · ${ind.gender}</div>`;
}

export function defectCardHtml(h) {
  if (!h?.defect || h.defectCured) return '';
  const d = h.defect;
  return `<div class="dcard anim-up">
    <div class="dnm">⚠️ ${d.name}</div>
    <div class="ddesc">${d.desc}</div>
    <div class="dimp">${d.impact}</div>
  </div>`;
}

export function healthBarHtml(pct) {
  const p = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  const col = p >= 66 ? 'var(--green)' : p >= 33 ? 'var(--amber)' : 'var(--red)';
  return `<div class="ratew vitality-hero anim-up">
    <div class="rateh"><span class="ratel">Vitality</span><span class="ratep" style="color:${col}">${p}%</span></div>
    <div class="ratetr"><div class="ratefill" style="width:${p}%;background:${col}"></div></div>
    <div class="ratenote">Cumulative stress across birth → old age for this cross.</div>
  </div>`;
}

export function traitBarsHtml(traits, driftNote = '') {
  const bars = Object.entries(traits)
    .map(([k, v]) => {
      const meta = TMETA[k];
      return `<div class="trow">
      <div class="tlbl">${meta.label}</div>
      <div class="ttrack"><div class="tfill" style="width:${v}%;background:${meta.color}"></div></div>
      <div class="tval tval-dynamic" style="color:${meta.color}">${v}</div>
    </div>`;
    })
    .join('');
  const drift = driftNote || (game.HYBRID?.lastDrift
    ? `<div class="drift-note">Recent drift: ${game.HYBRID.lastDrift.keys.map((k, i) => `${TMETA[k]?.label || k} ${game.HYBRID.lastDrift.deltas[i] > 0 ? '+' : ''}${game.HYBRID.lastDrift.deltas[i]}`).join(' · ')}</div>`
    : '');
  return `<div class="tbars">${bars}</div>${drift}`;
}
