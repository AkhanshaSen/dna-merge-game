import {
  TMETA,
  RESOURCES,
  SUB_ROUNDS_PER_ROUND,
  LIFE_STAGES_PER_SUBROUND,
  LIFE_STAGE_LABELS,
  ROUND_RESOURCE_PASSES,
  PASSES_PER_CROSS_SEQUENCE,
  MATRIX_RR_RG,
  MATRIX_RR_WG,
  MATRIX_WR_RG,
  MATRIX_WR_WG,
  CARE_MATE_BONUS_PER_FULL_LIFE,
  GENEFIX_COST,
  CARE_PERKS,
  RESOURCE_SOFT_CAP,
  REVIVAL_LAB_BONUS,
  REVIVAL_VITALITY,
  CROSS_LAB_STIPEND,
  MIN_LAB_FOR_DEPLOY,
} from './constants.js';
import {
  canAffordDeploy,
  deployLabCost,
  estimatedDeploysLeft,
  isLabDepleted,
} from './resource-economy.js';
import { SPECIES, TAXON_LABEL, taxonChipClass, REALM_LABEL, realmChipClass } from './species.js';
import { game } from './state.js';
import { scoreColor, resourceSynergyMatch, synergyBonus } from './game-logic.js';
import { mergeBlockReason, previewBlend } from './breeding.js';
import { cycleLifeBanner, lifeStageTimelineHtml, breedCampaignBanner } from './cycle-meta.js';
import { campaignForSlot } from './campaign.js';
import { ACHIEVEMENT_DEFS, hasAchievement } from './achievements.js';
import { ethicalHintBlock, outlookBands } from './coach-hints.js';
import { survivalRateLifeStage } from './life-round-logic.js';
import {
  crisisDeployHintText,
  crisisHasSynergyDeploys,
  canAffordAnySynergyDeploy,
} from './deploy-match.js';
import { isRevivalEligible, revivalHintReason } from './extinction-revival.js';

const LAB_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'mammal', label: 'Mammals' },
  { id: 'reptile', label: 'Reptiles' },
  { id: 'avian', label: 'Birds' },
  { id: 'terrestrial', label: 'Land' },
  { id: 'marine', label: 'Marine' },
  { id: 'freshwater', label: 'Freshwater' },
  { id: 'compat', label: 'Match A' },
];

export function render() {
  renderRunStatus();
  renderStats();
  renderMain();
  renderTutorialOverlay();
  renderDevilModal();
}

function renderRunStatus() {
  const el = document.getElementById('run-status');
  if (!el) return;
  const br = game.ST.breedRound ?? 1;
  const camp = campaignForSlot(br);
  const cross = game.roundActive ? `${game.subRoundIndex}/${SUB_ROUNDS_PER_ROUND}` : '—';
  const passes = game.roundActive ? game.crossPassesRemaining ?? 0 : '—';
  const lab = fmtRes(game.ST.resources);
  const est = estimatedDeploysLeft(game.ST.resources);
  const gambitTag = game.gambitMode ? `<span class="tag tag-devil">Gambit</span>` : '';
  el.innerHTML = `
    <span class="tag tag-p">Breed ${br}/5 · ${camp.label}</span>
    <span class="tag tag-b">Cross ${cross}</span>
    <span class="tag tag-a">Passes ${passes}</span>
    <span class="tag tag-g">Lab ${lab}/${RESOURCE_SOFT_CAP} · ~${est} deploys</span>
    ${gambitTag}
    ${game.isDevilMarked ? '<span class="tag tag-devil">Devil mark</span>' : ''}`;
}

function fmtRes(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  return Math.abs(x - Math.round(x)) < 0.001 ? String(Math.round(x)) : x.toFixed(1);
}

function healthBarHtml(pct) {
  const p = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  const col = p >= 66 ? 'var(--green)' : p >= 33 ? 'var(--amber)' : 'var(--red)';
  return `<div class="ratew vitality-hero anim-up">
    <div class="rateh"><span class="ratel">❤️ Vitality</span><span class="ratep" style="color:${col}">${p}%</span></div>
    <div class="ratetr"><div class="ratefill" style="width:${p}%;background:${col}"></div></div>
    <div class="ratenote">Cumulative stress across birth → old age for this cross.</div>
  </div>`;
}

function traitBarsHtml(traits, driftNote = '') {
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

function renderStats() {
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
  const miniLife =
    game.PHASE === 'life' && life
      ? `<span class="cy-stage-hint"> · Stage ${life}/4</span>`
      : '';

  const showTrack =
    game.roundActive &&
    game.PHASE !== 'roundEnd' &&
    (game.HYBRID || game.PHASE === 'select' || game.PHASE === 'life');

  const track = showTrack
    ? `<div class="cytrack anim-up">${pills}<div class="cybreedlbl">Round · Cross <strong>${sr || 1}</strong>/${SUB_ROUNDS_PER_ROUND}${miniLife} · Passes <strong>${game.crossPassesRemaining ?? 0}</strong></div></div>`
    : '';

  document.getElementById('stats').innerHTML = `
    <div class="stats-group"><div class="stats-group-lbl">This run</div>
      <div class="stats-grid stats-grid-run">
        <div class="sc sb anim-up"><div class="n">${game.roundActive ? game.crossPassesRemaining ?? 0 : '—'}</div><div class="l">Deploy passes</div></div>
        <div class="sc sa anim-up s1">
          <div class="n">${fmtRes(game.ST.resources)}<span class="res-cap">/${RESOURCE_SOFT_CAP}</span></div>
          <div class="l">🧪 Lab resources</div>
          <div class="resource-meter"><div class="resource-meter-fill" style="width:${Math.round((Number(game.ST.resources) / RESOURCE_SOFT_CAP) * 100)}%"></div></div>
        </div>
      </div>
    </div>
    <div class="stats-group"><div class="stats-group-lbl">Lifetime</div>
      <div class="stats-grid">
        <div class="sc sg anim-up"><div class="n">${game.ST.fame.length}</div><div class="l">🏆 Full lives</div></div>
        <div class="sc sr anim-up s1"><div class="n">${game.ST.extinctions.length}</div><div class="l">💀 Extinct</div></div>
        <div class="sc sb anim-up s2"><div class="n">${acc}%</div><div class="l">🔮 Accuracy</div></div>
        <div class="sc spnts anim-up s3"><div class="n">${pts}</div><div class="l">⭐ Points</div></div>
      </div>
    </div>${track}`;
}

function renderMain() {
  const m = document.getElementById('main');
  m.innerHTML = '';
  if (game.VIEW === 'records') {
    renderRecords(m);
    return;
  }
  if (game.VIEW === 'history') {
    renderHistory(m);
    return;
  }
  if (game.VIEW === 'settings') {
    renderSettings(m);
    return;
  }
  if (game.PHASE === 'select') renderSelect(m);
  else if (game.PHASE === 'merging')
    renderLoading(m, 'Splicing founder genomes…', 'Composing cohort profile from founder data');
  else if (game.PHASE === 'hybrid') renderHybrid(m);
  else if (game.PHASE === 'life') renderLifePhase(m);
  else if (game.PHASE === 'cycling') renderLoading(m, 'Simulating life-stage beat…', 'Rolling conservation matrix');
  else if (game.PHASE === 'subRoundEnd') renderSubRoundEnd(m);
  else if (game.PHASE === 'roundEnd') renderRoundEnd(m);
}

function renderTutorialOverlay() {
  let root = document.getElementById('tutorial-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'tutorial-root';
    document.body.appendChild(root);
  }
  const show = game.showTutorial && !game.ST.tutorialDone;
  if (!show) {
    root.innerHTML = '';
    return;
  }
  const steps = [
    { title: 'Pick two founders', body: 'Slot A and B need the same class and realm, opposite sexes. Extinct pairs stay locked.' },
    { title: 'Merge & preview genetics', body: 'Check the viability preview, then merge. Hybrids walk four life stages.' },
    { title: 'Deploy + forecast', body: 'Match conservation deploys to crises (glowing cards = synergy). Forecast survive / damage / extinct.' },
    { title: 'Campaign slots 1–5', body: 'Finish rounds to advance breed slots — each slot changes pressure and unlocks cryptic keys.' },
  ];
  const idx = game.tutorialStep || 0;
  const step = steps[Math.min(idx, steps.length - 1)];
  root.innerHTML = `<div class="tutorial-overlay anim-up">
    <div class="tutorial-card">
      <div class="tutorial-step">Guide ${idx + 1}/${steps.length}</div>
      <div class="tutorial-title">${step.title}</div>
      <div class="tutorial-body">${step.body}</div>
      <div class="tutorial-actions">
        ${idx > 0 ? '<button type="button" class="btn btn-s" data-action="tutorial-prev">Back</button>' : ''}
        ${idx < steps.length - 1
    ? '<button type="button" class="btn btn-p" data-action="tutorial-next">Next</button>'
    : '<button type="button" class="btn btn-p" data-action="tutorial-done">Start playing</button>'}
      </div>
    </div>
  </div>`;
}

function coachBanner() {
  const n = game.coachNote;
  if (!n?.text) return '';
  const cls =
    n.kind === 'good' ? 'coach-good' : n.kind === 'warn' ? 'coach-warn' : 'coach-neutral';
  return `<div class="coach-banner ${cls}" role="status">${n.text}</div>`;
}

function founderLabel(found) {
  if (!found) return '';
  return `${found.individual.displayName} (${found.individual.gender})`;
}

function slotHtml(found) {
  if (!found) return `<div class="mslot-ph">Select a founder</div>`;
  const sp = found.species;
  const ind = found.individual;
  return `
    <span class="mslot-em">${sp.emoji}</span>
    <div class="mslot-nm">${ind.displayName}</div>
    <div class="mslot-sub">${sp.name} · ${ind.gender}<br/><span class="mslot-sub-dim">${ind.personality}</span></div>`;
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
    ${badge}
    <div class="merge-preview-score" style="color:${col}">Viability band ${prev.scoreMin}–${prev.scoreMax}</div>
    ${traitRows}
  </div>`;
}

function filterChipsHtml() {
  return `<div class="lab-filters">${LAB_FILTERS.map(
    (f) =>
      `<button type="button" class="fchip${game.labFilter === f.id ? ' on' : ''}" data-action="lab-filter" data-filter="${f.id}">${f.label}</button>`,
  ).join('')}</div>`;
}

function labEmptyCrossHintHtml() {
  if (!game.roundActive || !isLabDepleted()) return '';
  const sr = game.subRoundIndex || 1;
  return `<div class="lab-resupply-banner anim-up">
    <span class="lab-resupply-kicker">Lab at zero — cross ${sr} still playable</span>
    <p>Your <strong>${RESOURCE_SOFT_CAP} lab units</strong> are shared across the whole round. When you tap <strong>Merge → Begin life</strong>, field teams resupply to at least <strong>${CROSS_LAB_STIPEND}</strong> if you're below that. Until then you can still run <strong>gambit</strong> (forecast + dice) or <strong>Monitor Only</strong> (0 lab) on life stages.</p>
  </div>`;
}

function renderSelect(m) {
  const reason = mergeBlockReason(game.SEL_PARENT_A, game.SEL_PARENT_B, game.ST.extinctions);
  const canMerge = game.SEL_PARENT_A && game.SEL_PARENT_B && !reason;

  const sections = SPECIES.filter(speciesPassesFilter)
    .map((sp) => {
      const badgeCls = sp.iucn === 'CR' ? 'sp-cr' : sp.iucn === 'EN' ? 'sp-en' : 'sp-vu';
      const cards = sp.individuals
        .map((ind) => {
          const tempFound = { species: sp, individual: ind };
          const isA = game.SEL_PARENT_A?.individual.id === ind.id;
          const isB = game.SEL_PARENT_B?.individual.id === ind.id;
          let locked = false;
          if (game.SEL_PARENT_A && !isA) {
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
          if (game.SEL_PARENT_B && !isB) {
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
          <div class="ind-nm">${sp.emoji} ${ind.displayName}</div>
          <div class="ind-meta">${ind.gender}</div>
          <div class="ind-person">${ind.personality}</div>
        </button>`;
        })
        .join('');

      return `<div class="species-section anim-up">
      <div class="species-head">
        <span class="sp-em">${sp.emoji}</span>
        <strong>${sp.name}</strong>
        <span class="sp-status">· ${sp.status}</span>
        <span class="${taxonChipClass(sp.taxon)}">${TAXON_LABEL[sp.taxon]}</span>
        <span class="${realmChipClass(sp.realm)}">${REALM_LABEL[sp.realm || 'terrestrial']}</span>
      </div>
      <div class="ind-grid">${cards}</div>
    </div>`;
    })
    .join('');

  let mergeLabel = '🧬 Merge founders →';
  if (reason) {
    if (reason.includes('Cross-class')) mergeLabel = '⛔ Different animal classes';
    else if (reason.includes('Realm clash')) mergeLabel = '🌊 Land vs water clash';
    else if (reason.includes('Breeding requires')) mergeLabel = '🚻 Need male + female';
    else if (reason.includes('cloning')) mergeLabel = '⚠️ Same founder twice';
    else if (reason.includes('extinct')) mergeLabel = '🔒 Extinct pairing';
    else mergeLabel = '⚠️ Select two founders';
  }

  m.innerHTML = `
    ${coachBanner()}
    ${breedCampaignBanner(game.ST.breedRound ?? 1)}
    <div class="lab-layout">
      <div class="lab-scroll">
        <div class="card gene-lab-card anim-up">
          <div class="ctitle">Animal cross ${game.subRoundIndex}/${SUB_ROUNDS_PER_ROUND} — Choose founders</div>
          <p class="gene-lab-lede">
            Each <strong>round</strong> runs <strong>${SUB_ROUNDS_PER_ROUND} crosses</strong> with <strong>${ROUND_RESOURCE_PASSES}</strong> deploy passes (split <strong>${PASSES_PER_CROSS_SEQUENCE.join('+')}</strong>) and one shared <strong>${RESOURCE_SOFT_CAP}</strong> lab pool — not 5 lab per cross. Full natural life → <strong>+2 passes</strong> and <strong>+2 lab</strong>.
          </p>
          ${labEmptyCrossHintHtml()}
          ${filterChipsHtml()}
          ${mergePreviewHtml()}
          ${sections}
          ${reason && game.SEL_PARENT_A && game.SEL_PARENT_B ? `<div class="extinct-warn anim-up">${reason}</div>` : ''}
        </div>
      </div>
      <div class="merge-dock anim-up s2" aria-label="Founder merge bar">
        <div class="merge-dock-inner">
          <div class="mpanel mpanel-dock">
            <div class="mslot ${game.SEL_PARENT_A ? 'fa' : ''}">${slotHtml(game.SEL_PARENT_A)}</div>
            <div class="plus">+</div>
            <div class="mslot ${game.SEL_PARENT_B ? 'fb' : ''}">${slotHtml(game.SEL_PARENT_B)}</div>
            <button type="button" class="btn-merge" ${canMerge ? 'data-action="merge"' : 'disabled'}>${mergeLabel}</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderLoading(mainEl, main, sub) {
  mainEl.innerHTML = `<div class="card card-loading anim-up">
    <div class="spin"></div>
    <div class="loading-title">${main}</div>
    <div class="loading-sub">${sub}</div>
    <div class="dots dots-center"><span></span><span></span><span></span></div>
  </div>`;
}

function defectCardHtml(h) {
  if (!h?.defect || h.defectCured) return '';
  const d = h.defect;
  return `<div class="dcard anim-up">
    <div class="dnm">⚠️ ${d.name}</div>
    <div class="ddesc">${d.desc}</div>
    <div class="dimp">${d.impact}</div>
  </div>`;
}

function secretKeyHtml() {
  const sk = game.secretKey;
  if (!sk) return '';
  const cls = sk.kind === 'boon' ? 'secret-boon' : sk.kind === 'curse' ? 'secret-curse' : 'secret-neutral';
  return `<div class="secret-box secret-box-life ${cls} anim-up">
    <div class="secret-tag">Cryptic resonance · slot 5</div>
    <div class="secret-code">${sk.code}</div>
    <div class="secret-desc">${sk.label}</div>
    <div class="secret-delta">${sk.deltaPct > 0 ? '+' : ''}${sk.deltaPct}% survival modifier (old age)</div>
  </div>`;
}

function renderHybrid(m) {
  const h = game.HYBRID;
  const sc = h.score;
  const col = scoreColor(sc);
  const verdict =
    sc >= 70
      ? '✅ Strong cohort viability — survival maths look forgiving.'
      : sc >= 45
        ? '⚠️ Borderline cohort — crises will stress each life stage.'
        : '❌ Critical viability pressure — extinction swings stay dangerously wide.';
  const pa = founderLabel(h.parentA);
  const pb = founderLabel(h.parentB);

  m.innerHTML = `<div class="card anim-up">
    <div class="ctitle">🎉 Breeding cohort synthesised</div>
    ${lifeStageTimelineHtml(1)}
    <div class="hhdr">
      <div class="hem anim-float">${h.emoji}</div>
      <div class="hmeta">
        <div class="hnm">${h.name}</div>
        <div class="hpar">🧬 Parents · ${pa} × ${pb}<br/><span class="hpar-sub">${h.parentA.species.name}${
    h.parentA.species.id === h.parentB.species.id ? ' renewal line' : ' × ' + h.parentB.species.name
  }</span></div>
        <div class="sring-row">
          <div class="sring sring-dynamic" style="border-color:${col}">
            <div class="sring-n-dynamic" style="color:${col}">${sc}</div>
            <div class="l">Viability</div>
          </div>
          <div class="sverdict">${verdict}</div>
        </div>
      </div>
    </div>
    ${defectCardHtml(h)}
    ${h.bio ? `<div class="narr">${h.bio}</div>` : ''}
    <div class="div">Trait profile</div>
    ${traitBarsHtml(h.traits)}
    ${ethicalHintBlock('vitality')}
    <div class="card-sm hybrid-next anim-up">
      <strong>Your role:</strong> Steward, not tyrant. Match deploys to crises, forecast with humility — vitality above zero means ${h.name} can still fight for the next stage.
    </div>
    <button type="button" class="btn btn-p btn-blk btn-lg btn-mt" data-action="begin-life-stage">Begin life arc — ${LIFE_STAGE_LABELS[0]} →</button>
  </div>`;
}

function gambitPanelHtml() {
  const dice = game.lastGambitDice;
  const faces = dice
    ? `<div class="dice-strip anim-up"><span class="die die-a">${dice.diceA}</span><span class="die-plus">+</span><span class="die die-b">${dice.diceB}</span></div>`
    : `<div class="dice-strip dice-idle"><span class="die die-tumble">?</span><span class="die-plus">·</span><span class="die die-tumble">?</span></div>`;
  const observeOn = game.LIFE_RES?.id === 'observe';
  return `<div class="gambit-panel anim-up">
    <div class="gambit-title">Gambit — lab reserves empty</div>
    <p class="gambit-copy">You cannot fund standard deploys. Pick a <strong>forecast</strong> and roll gambit dice — or choose <strong>Monitor Only</strong> (same dice, 0 lab).</p>
    <button type="button" class="cc deploy-observe${observeOn ? ' on' : ''}" data-action="pick-life-res" data-res-id="observe">
      <span class="lab-cost-badge lab-free">0 🧪</span>
      <span class="ci">👁️</span>
      <div class="ctname">Monitor Only</div>
      <div class="ccdesc">Save lab — watch and forecast without deploy bonus.</div>
    </button>
    ${faces}
    ${ethicalHintBlock('forecast')}
  </div>`;
}

function renderDevilModal() {
  let root = document.getElementById('devil-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'devil-root';
    document.body.appendChild(root);
  }
  if (!game.showDevilModal) {
    root.innerHTML = '';
    return;
  }
  root.innerHTML = `<div class="devil-overlay anim-up">
    <div class="devil-card">
      <div class="devil-em">😈</div>
      <div class="devil-title">Conservation Devil</div>
      <p class="devil-body">You had the hints — synergy glow, outlook bands, stewardship copy — and still starved these lines of the right intervention. <strong>Playing god poorly is worse than playing none.</strong></p>
      <p class="devil-sub">This mark lasts for the rest of this round. Align deploys with ✦ synergy or accept the consequences.</p>
      <button type="button" class="btn btn-d btn-lg" data-action="dismiss-devil">I understand →</button>
    </div>
  </div>`;
}

function stageReceiptHtml() {
  const lr = game.LAST_RESOLVE;
  if (!lr) return '';
  const deployCls = lr.resourceOk ? 'receipt-ok' : 'receipt-bad';
  const forecastCls = lr.guessOk ? 'receipt-ok' : 'receipt-bad';
  const ptsSign = lr.pts > 0 ? '+' : '';
  const fought =
    lr.foughtBack
      ? `<div class="receipt-row"><span>Cohort fight-back</span><span class="receipt-ok">Held the line — nature rolled collapse, but vitality remains</span></div>`
      : '';
  const gambitDice =
    lr.gambit && lr.diceA
      ? `<div class="receipt-row"><span>Nature's dice</span><span>${lr.diceA} + ${lr.diceB} · ${lr.cohortWins ? 'cohort held' : 'crisis won'}</span></div>`
      : '';
  const forecastLabel =
    lr.rawRoll && lr.rawRoll !== lr.rolled
      ? `${lr.pred} → ${lr.rolled} <span class="receipt-sub">(wild dice: ${lr.rawRoll})</span>`
      : `${lr.pred} → ${lr.rolled}`;
  const deployRow = lr.observe
    ? `<div class="receipt-row"><span>Deploy</span><span class="receipt-warn">👁️ Monitor only (0 lab)</span></div>`
    : lr.gambit
      ? `<div class="receipt-row"><span>Deploy</span><span class="receipt-warn">— Gambit (no lab pay)</span></div>`
      : `<div class="receipt-row"><span>Deploy</span><span class="${deployCls}">${lr.partialDeploy ? '◐ ' : lr.resourceOk ? '✓ ' : '✗ '}${lr.chosenName || ''}</span></div>`;
  return `<div class="receipt-card anim-pop">
    <div class="receipt-title">Stage resolve</div>
    ${deployRow}
    ${gambitDice}
    ${lr.gambit || lr.resourceOk ? `<div class="receipt-row"><span>Forecast</span><span class="${forecastCls}">${lr.guessOk ? '✓' : '✗'} ${forecastLabel}</span></div>` : ''}
    ${fought}
    <div class="receipt-row"><span>Points</span><span class="receipt-pts">${ptsSign}${lr.pts}</span></div>
    ${typeof lr.healthBefore === 'number' ? `<div class="receipt-row"><span>Vitality</span><span>${lr.healthBefore}% → ${lr.healthAfter ?? game.healthMeter}%</span></div>` : ''}
    ${lr.narrative ? `<div class="narr ${game.healthMeter > 0 ? 'narr-ng' : 'nr'}" style="margin-top:.75rem">${lr.narrative}</div>` : ''}
    ${game.healthMeter > 0 ? `<p class="matrix-hint" style="margin-top:.65rem">The line still breathes. Wrong guesses cost points, not necessarily lives — when you deploy wisely.</p>` : ''}
    ${revivalReceiptTeaserHtml(lr)}
    <button type="button" class="btn btn-p btn-blk btn-mt" data-action="dismiss-receipt">${receiptDismissLabel(lr)}</button>
  </div>`;
}

function receiptDismissLabel(lr) {
  if (isRevivalEligible(lr)) return 'Review revival offer →';
  if (game.healthMeter > 0) return 'Continue — fight on →';
  return 'Accept outcome →';
}

function revivalReceiptTeaserHtml(lr) {
  if (!isRevivalEligible(lr)) return '';
  return `<p class="revival-teaser anim-up">You forecast <strong>collapse</strong> and were right — a rare second chance may be available.</p>`;
}

function revivalOfferHtml() {
  const lr = game.LAST_RESOLVE;
  const h = game.HYBRID;
  if (!lr || !h) return '';
  const reason = revivalHintReason(lr);
  const nextStage = Math.min(LIFE_STAGES_PER_SUBROUND, (game.lifeStageIndex || 1) + 1);
  const stageLabel = LIFE_STAGE_LABELS[nextStage - 1] || 'next stage';
  return `<div class="revival-card anim-pop">
    <div class="revival-kicker">🌱 Foreseen collapse — stewardship reward</div>
    <h3 class="revival-title">Revive ${h.name}?</h3>
    <p class="revival-copy">You predicted <strong>extinction</strong> and nature agreed. ${reason.charAt(0).toUpperCase() + reason.slice(1)} — you could not (or did not) fully save them this beat.</p>
    <p class="revival-copy">Because you read the wild honestly, the programme grants a <strong>one-time revival</strong> this cross:</p>
    <ul class="revival-perks">
      <li><strong>+${REVIVAL_LAB_BONUS}</strong> lab units (emergency reserves)</li>
      <li>Vitality restored to <strong>${REVIVAL_VITALITY}%</strong></li>
      <li>Advance to <strong>${stageLabel}</strong> (life stage ${nextStage}/${LIFE_STAGES_PER_SUBROUND})</li>
    </ul>
    <div class="revival-actions">
      <button type="button" class="btn btn-p btn-lg" data-action="accept-extinction-revival">Revive lineage →</button>
      <button type="button" class="btn btn-d btn-lg" data-action="decline-extinction-revival">Accept extinction</button>
    </div>
  </div>`;
}

function outlookBarHtml() {
  const h = game.HYBRID;
  const ev = game.EVENT;
  const res = game.LIFE_RES;
  if (!h || !ev || !res) return '';
  const idx = (game.lifeStageIndex || 1) - 1;
  const rate = survivalRateLifeStage(ev, res, h, idx, game.careMateLedgerPct, 0);
  const b = outlookBands(rate);
  return `<div class="outlook-bar anim-up">
    <div class="outlook-lbl">Survival outlook (with your deploy) · index ${b.rate}</div>
    <div class="outlook-track">
      <span class="outlook-seg os-survive" style="width:${b.survive}%" title="Thrive"></span>
      <span class="outlook-seg os-damage" style="width:${b.damage}%" title="Wounded"></span>
      <span class="outlook-seg os-extinct" style="width:${b.extinct}%" title="Collapse"></span>
    </div>
    <div class="outlook-legend"><span>Thrive ${b.survive}%</span><span>Wounded ${b.damage}%</span><span>Collapse ${b.extinct}%</span></div>
  </div>`;
}

function triageHtml() {
  const d = game.HYBRID?.defect;
  if (!d) return '';
  const canCure = game.ST.resources >= GENEFIX_COST;
  return `<div class="card-sm anim-up" style="margin:1rem 0">
    <div class="ctitle">Defect triage</div>
    <div class="dcard" style="margin-bottom:.75rem">
      <div class="dnm">${d.name}</div>
      <div class="ddesc">${d.desc}</div>
    </div>
    <p class="matrix-hint">Gene therapy costs <strong>${GENEFIX_COST}</strong> resources (you have ${fmtRes(game.ST.resources)}).</p>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem">
      <button type="button" class="btn btn-s" data-action="triage-cure" ${canCure ? '' : 'disabled'}>💉 Cure defect (−${GENEFIX_COST})</button>
      <button type="button" class="btn btn-d" data-action="triage-accept">Accept burden</button>
    </div>
  </div>`;
}

function carePerkHtml() {
  const perks = CARE_PERKS.map(
    (p) =>
      `<button type="button" class="cc" data-action="pick-care-perk" data-perk-id="${p.id}">
      <span class="ci">${p.emoji}</span>
      <div class="ctname">${p.label}</div>
      <div class="ccdesc">${p.desc}</div>
    </button>`,
  ).join('');
  return `<div class="anim-up" style="margin:1rem 0">
    <div class="ctitle">Husbandry choice (once per cross)</div>
    <p class="matrix-hint">Pick a care perk before the next life stage.</p>
    <div class="cgrid">${perks}</div>
  </div>`;
}

function renderLifePhase(m) {
  const h = game.HYBRID;
  const ev = game.EVENT;
  if (!h || !ev) {
    m.innerHTML = `<div class="card">Missing crisis data — return to Gene Lab.</div>`;
    return;
  }

  if (game.lifeSubStep === 'receipt') {
    m.innerHTML = `<div class="card anim-up">${coachBanner()}${stageReceiptHtml()}</div>`;
    return;
  }
  if (game.lifeSubStep === 'revival') {
    m.innerHTML = `<div class="card anim-up">${coachBanner()}${stageReceiptHtml()}${revivalOfferHtml()}</div>`;
    return;
  }
  if (game.lifeSubStep === 'triage') {
    m.innerHTML = `<div class="card anim-up">${triageHtml()}</div>`;
    return;
  }
  if (game.lifeSubStep === 'care') {
    m.innerHTML = `<div class="card anim-up">${carePerkHtml()}</div>`;
    return;
  }

  const stageIdx = Math.max(1, Math.min(LIFE_STAGES_PER_SUBROUND, game.lifeStageIndex || 1));
  const stageLabel = LIFE_STAGE_LABELS[stageIdx - 1];
  const labPool = game.ST.resources;
  const hasSynergy = crisisHasSynergyDeploys(ev);
  const affordSynergy = canAffordAnySynergyDeploy(ev, labPool);
  const showFallbackPath = !hasSynergy || !affordSynergy;
  const deployTypes = new Set(['survival', 'fallback', 'observe']);
  const resCrds = RESOURCES.filter((r) => r.type !== 'cure' || game.HYBRID?.defect)
    .filter((r) => deployTypes.has(r.type))
    .filter((r) => r.type !== 'fallback' && r.type !== 'observe' ? true : showFallbackPath)
    .map((r) => {
      const synBonus = synergyBonus(ev, r);
      const syn = resourceSynergyMatch(ev, r) || synBonus > 0;
      const fallbackRec =
        r.id === 'improvise' && showFallbackPath && (!hasSynergy || !affordSynergy);
      const cost = deployLabCost(r);
      const afford = r.type === 'observe' || canAffordDeploy(r, labPool);
      const cls = [
        'cc',
        game.LIFE_RES?.id === r.id ? 'on' : '',
        syn || fallbackRec ? 'synergy-match' : '',
        r.type === 'fallback' ? 'deploy-fallback' : '',
        r.type === 'observe' ? 'deploy-observe' : '',
        !afford ? 'unaffordable' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const action = afford ? `data-action="pick-life-res" data-res-id="${r.id}"` : 'disabled';
      const tag =
        syn && r.type === 'survival'
          ? '<span class="synergy-tag">✦ synergy</span>'
          : fallbackRec
            ? '<span class="synergy-tag">✦ best available</span>'
            : r.type === 'observe'
              ? '<span class="synergy-tag observe-tag">0 lab</span>'
              : '';
      return `
    <button type="button" class="${cls}" ${action}>
      ${r.type !== 'observe' ? `<span class="lab-cost-badge">−${cost} 🧪</span>` : '<span class="lab-cost-badge lab-free">0 🧪</span>'}
      <span class="ci">${r.emoji}</span>
      <div class="ctname">${r.name}</div>
      ${tag}
      <div class="ccdesc">${r.desc}</div>
      <div class="ceff ep">${r.effect}</div>
      ${!afford ? '<div class="cc-locked">Insufficient lab units</div>' : ''}
    </button>`;
    })
    .join('');
  const crisisHint = crisisDeployHintText(ev);
  const noSynergyBanner = !hasSynergy
    ? `<div class="deploy-alt-banner warn">No standard deploy fully answers this crisis — <strong>Improvise</strong> or <strong>Monitor</strong> below.</div>`
    : !affordSynergy
      ? `<div class="deploy-alt-banner warn">✦ synergy cards exist but lab is too low — <strong>Improvise</strong> (${deployLabCost(RESOURCES.find((x) => x.id === 'improvise'))} 🧪), <strong>Monitor</strong> (free), or save lab for later.</div>`
      : '';

  const predOpts = [
    { k: 'survive', i: '✅', t: 'Adapts & survives' },
    { k: 'damage', i: '⚠️', t: 'Survives, damaged' },
    { k: 'extinct', i: '💀', t: 'Collapses' },
  ];
  const predBtns = predOpts
    .map(
      (o) =>
        `<button type="button" class="pb${game.LIFE_PRED === o.k ? (o.k === 'survive' ? ' psy' : o.k === 'damage' ? ' psd' : ' pse') : ''}" data-action="pick-life-pred" data-pred="${o.k}">
      <span class="pi">${o.i}</span><div class="pt">${o.t}</div>
    </button>`,
    )
    .join('');

  const gambit = game.gambitMode;
  const canGo = gambit
    ? game.LIFE_PRED && game.crossPassesRemaining >= 1
    : game.LIFE_RES && game.LIFE_PRED && game.crossPassesRemaining >= 1;

  const deploySection = gambit
    ? gambitPanelHtml()
    : `${ethicalHintBlock('deploy')}
    ${
      game.crossPassesRemaining < 1
        ? `<div class="warn">⚠️ No deploy passes left.</div>`
        : `<div class="matrix-hint">Cards with ✦ synergy align with this crisis — each costs lab units (see badge). When nothing fits or you cannot pay, use <strong>Improvise</strong> or <strong>Monitor Only</strong>.</div>`
    }
    ${noSynergyBanner}
    <div class="cgrid">${resCrds}</div>
    ${outlookBarHtml()}`;

  const resolveLabel = gambit
    ? !game.LIFE_PRED
      ? 'Pick your forecast'
      : game.LIFE_RES?.type === 'observe'
        ? 'Resolve — monitor & forecast →'
        : 'Roll gambit dice →'
    : !game.LIFE_RES
      ? 'Pick a deploy first'
      : !game.LIFE_PRED
        ? 'Pick your forecast'
        : game.LIFE_RES?.type === 'observe'
          ? 'Resolve — monitor & forecast →'
          : 'Resolve this life stage →';

  m.innerHTML = `<div class="card anim-up">
    ${coachBanner()}
    <div class="chdr">
      <div class="cbadge c2">${stageIdx}</div>
      <div><div class="ctit">Life stage ${stageIdx}/${LIFE_STAGES_PER_SUBROUND} — ${stageLabel}</div><div class="csub">${h.name} · care+mate <strong>+${game.careMateLedgerPct}%pts</strong> · lab <strong>${fmtRes(game.ST.resources)}/${RESOURCE_SOFT_CAP}</strong></div></div>
    </div>
    ${lifeStageTimelineHtml(stageIdx)}
    ${traitBarsHtml(h.traits)}
    ${healthBarHtml(game.healthMeter)}
    ${defectCardHtml(h)}
    ${secretKeyHtml()}
    <div class="ecard anim-up s1">
      <div class="elbl">⚡ Active crisis</div>
      <div class="enm">${ev.emoji} ${ev.name}</div>
      <div class="edesc">${ev.desc}</div>
      <div class="edelta">Score modifier: ${ev.impact}</div>
      <div class="crisis-deploy-hint">${crisisHint}</div>
    </div>
    ${gambit ? '' : `<div class="tripred matrix-wrap anim-up">
      <div class="tripred-title">Scoring matrix</div>
      <div class="tripred-note tripred-note-spaced">
        <table class="matrix-table">
          <tr><th></th><th>Right guess</th><th>Wrong guess</th></tr>
          <tr><td class="receipt-ok">Right deploy</td><td class="receipt-ok">+${MATRIX_RR_RG} pts</td><td style="color:var(--amber)">+${MATRIX_RR_WG} pts</td></tr>
          <tr><td class="receipt-bad">Wrong deploy</td><td>Extinct · ${MATRIX_WR_RG} pts</td><td>Extinct · ${MATRIX_WR_WG} pts</td></tr>
        </table>
      </div>
    </div>`}
  ${gambit ? '<div class="div">Gambit — forecast only</div>' : '<div class="div">1 · Pick conservation deploy (−1 pass · costs lab units)</div>'}
    ${deploySection}
    <div class="div">${gambit ? 'Your forecast' : '2 · Survival forecast'}</div>
    ${gambit ? '' : ethicalHintBlock('forecast')}
    <div class="prow">${predBtns}</div>
    <button type="button" class="btn btn-p btn-blk btn-lg" data-action="resolve-life-cycle" ${canGo ? '' : 'disabled'}>
      ${game.crossPassesRemaining < 1 ? 'No passes left' : resolveLabel}
    </button>
  </div>`;
}

function renderSubRoundEnd(m) {
  const ext = game.HYBRID?.outcome === 'extinct';
  const banCls = ext ? 'ob-e' : 'ob-s';
  const em = ext ? '💀' : '🌟';
  const tit = ext ? `${game.HYBRID?.name || 'Line'} — cross ended` : `${game.HYBRID?.name || 'Line'} — full natural life`;
  m.innerHTML = `
    <div class="obanner ${banCls}">
      <span class="oem">${em}</span>
      <div class="otit ${ext ? 'cr' : 'cg'}">${tit}</div>
      <div class="osub">${ext ? 'Vitality reached zero — the line could fight no longer. Your deploys and forecasts still shaped how long they lasted.' : 'Care+mate legacy unlocked for remaining crosses this round.'}</div>
    </div>
    ${game.FINAL_NARR ? `<div class="narr ${ext ? 'nr' : 'ng'} anim-up s1">${game.FINAL_NARR}</div>` : ''}
    <button type="button" class="btn btn-p btn-lg" data-action="continue-sub-round">${game.subRoundIndex >= SUB_ROUNDS_PER_ROUND ? 'See round summary →' : 'Next animal cross →'}</button>`;
}

function renderRoundEnd(m) {
  const gained = Math.floor((game.ST.points || 0) - (game.roundPointsSnapshot || 0));
  const br = game.ST.breedRound ?? 1;
  const camp = campaignForSlot(br);
  m.innerHTML = `
    <div class="card anim-up">
      <div class="ctitle">🏁 Round complete</div>
      ${breedCampaignBanner(br)}
      <p class="round-summary">
        Finished <strong>${SUB_ROUNDS_PER_ROUND}</strong> crosses.<br/>
        Points this round: <strong class="round-pts">${gained >= 0 ? '+' : ''}${gained}</strong>
        · Lifetime: <strong>${Math.floor(Number(game.ST.points) || 0)}</strong><br/>
        Next campaign: <strong>${camp.label}</strong> — ${camp.desc}
      </p>
      <button type="button" class="btn btn-p btn-lg" data-action="finish-round">Return to Gene Lab · advance breed slot →</button>
    </div>`;
}

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

function renderRecords(m) {
  const filter = game.recordsFilter || 'all';
  let fame = [...game.ST.fame];
  let extinct = [...game.ST.extinctions];
  if (filter === 'fame') extinct = [];
  if (filter === 'extinct') fame = [];

  const fCards = fame.length
    ? fame
        .map(
          (h) => `<div class="hcard hf">
        <span class="hem2">${h.emoji}</span>
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
        <span class="hem2">${e.emoji || '💀'}</span>
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

function sparklineFromLog() {
  const log = game.ST.log || [];
  const recent = log.slice(-12);
  if (!recent.length) return '';
  const pts = recent.map((l) => {
    const pt = l.detail?.match(/pts ([+-]?\d+)/);
    return pt ? Math.abs(parseInt(pt[1], 10)) : l.out === 'survive' ? 10 : 5;
  });
  const max = Math.max(...pts, 1);
  const bars = pts
    .map((v) => `<div class="spark-bar" style="height:${Math.round((v / max) * 100)}%"></div>`)
    .join('');
  return `<div class="sparkline" title="Recent stage outcomes">${bars}</div>`;
}

function renderHistory(m) {
  const preds = Array.isArray(game.ST.predictions) ? game.ST.predictions : [];
  const cor = preds.filter((p) => p.ok).length;
  const acc = preds.length ? Math.round((cor / preds.length) * 100) : 0;
  const pRows = preds.length
    ? [...preds]
        .reverse()
        .map(
          (p) => `<div class="hrow">
        <span>${p.ok ? '✅' : '❌'}</span>
        <div class="hrow-info">
          <div class="hrow-nm">${p.name}</div>
          <div class="hrow-dt">Predicted: ${p.pred} · Actual: ${p.actual}${typeof p.pts === 'number' ? ` · pts ${p.pts > 0 ? '+' : ''}${p.pts}` : ''}</div>
        </div>
      </div>`,
        )
        .join('')
    : `<div class="empty"><span class="eic">🔮</span><div class="etx">No forecasts logged yet</div></div>`;
  const lRows = game.ST.log.length
    ? [...game.ST.log]
        .reverse()
        .slice(0, 40)
        .map((l) => {
          const oc =
            l.out === 'survive' ? 'var(--green)' : l.out === 'damage' ? 'var(--amber)' : 'var(--red)';
          return `<div class="lrow">
        <div class="lnm">${l.name} — Stage ${l.cycle}</div>
        <div class="ldt">${l.event} → <strong class="outcome-dynamic" style="color:${oc}">${l.out}</strong>${l.res && l.res !== 'None' ? ' · ' + l.res : ''}</div>
      </div>`;
        })
        .join('')
    : `<div class="empty"><span class="eic">📋</span><div class="etx">No cycles logged yet</div></div>`;

  m.innerHTML = `
    <div class="card anim-up">
      <div class="ctitle">🔮 Forecast history (${preds.length})</div>
      ${preds.length ? `<div class="acc-bar-wrap ratew">
        <div class="rateh"><span class="ratel">Overall accuracy</span><span class="ratep" style="color:${scoreColor(acc)}">${acc}%</span></div>
        <div class="ratetr"><div class="ratefill" style="width:${acc}%;background:${scoreColor(acc)}"></div></div>
      </div>` : ''}
      ${sparklineFromLog()}
      <div class="history-scroll">${pRows}</div>
    </div>
    <div class="card anim-up s2">
      <div class="ctitle">📋 Life-stage log (${game.ST.log.length})</div>
      <div class="history-scroll history-scroll-lg">${lRows}</div>
    </div>`;
}

export function renderSettings(m) {
  const br = game.ST.breedRound ?? 1;
  const camp = campaignForSlot(br);
  m.innerHTML = `
    <div class="card anim-up">
      <div class="ctitle">📖 How to play</div>
      <div class="settings-body">
        <strong>1. Structure</strong> — One <strong>round</strong> = <strong>${SUB_ROUNDS_PER_ROUND} crosses</strong>, each with <strong>${LIFE_STAGES_PER_SUBROUND} life stages</strong>: ${LIFE_STAGE_LABELS.join(' → ')}.<br>
        <strong>2. Pass economy</strong> — <strong>${ROUND_RESOURCE_PASSES}</strong> deploys per round (${PASSES_PER_CROSS_SEQUENCE.join(' · ')}). Full life → <strong>+2 bonus passes</strong>.<br>
        <strong>3. Matrix</strong> — Right deploy + right forecast <strong>+${MATRIX_RR_RG}</strong> · Right deploy + wrong <strong>+${MATRIX_RR_WG}</strong>. Wrong deploy ⇒ extinction.<br>
        <strong>4. Genetics</strong> — Preview traits before merge. Cross-line hybrids may carry defects; spend <strong>${GENEFIX_COST}</strong> resources to cure. Traits drift each survived stage.<br>
        <strong>5. Campaign</strong> — Breed slots 1–5 modify difficulty. Slot 5 unlocks cryptic resonance on old age.<br>
        <strong>6. Care+mate</strong> — Full arc grants <strong>+${CARE_MATE_BONUS_PER_FULL_LIFE}%pts</strong> and <strong>+2 passes</strong> for the next cross.<br>
      </div>
    </div>
    <div class="card anim-up s2">
      <div class="settings-meta">
        Campaign: <strong>${camp.label}</strong> · Resources: <strong>${fmtRes(game.ST.resources)}</strong> · Breed slot: <strong>${br}/5</strong> · Points: <strong>${Math.floor(Number(game.ST.points) || 0)}</strong>
      </div>
      <button type="button" class="btn btn-s" data-action="show-tutorial" style="margin-bottom:.5rem">📖 Replay tutorial</button>
      <button type="button" class="btn btn-d" data-action="reset-all-confirm">🗑️ Reset all game data</button>
    </div>`;
}
