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
} from './constants.js';
import { SPECIES, TAXON_LABEL, taxonChipClass, REALM_LABEL, realmChipClass } from './species.js';
import { game } from './state.js';
import { scoreColor } from './game-logic.js';
import { mergeBlockReason } from './breeding.js';
import { cycleLifeBanner } from './cycle-meta.js';

export function render() {
  renderStats();
  renderMain();
}

function fmtRes(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '0';
  return Math.abs(x - Math.round(x)) < 0.001 ? String(Math.round(x)) : x.toFixed(1);
}

function healthBarHtml(pct) {
  const p = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  const col = p >= 66 ? 'var(--green)' : p >= 33 ? 'var(--amber)' : 'var(--red)';
  return `<div class="ratew anim-up" style="margin:1rem 0">
    <div class="rateh"><span class="ratel">❤️ Vitality (health meter)</span><span class="ratep" style="color:${col}">${p}%</span></div>
    <div class="ratetr"><div class="ratefill" style="width:${p}%;background:${col}"></div></div>
    <div class="ratenote">Tracks cumulative stress across birth → juvenile → adult → old age for this cross.</div>
  </div>`;
}

function renderStats() {
  const preds = Array.isArray(game.ST.predictions) ? game.ST.predictions : [];
  const cor = preds.filter((p) => p.ok).length;
  const acc = preds.length ? Math.round((cor / preds.length) * 100) : 0;
  const pts = Math.floor(Number(game.ST.points) || 0);
  const br = Math.min(5, Math.max(1, Number(game.ST.breedRound) || 1));

  const sr = game.roundActive ? Math.min(SUB_ROUNDS_PER_ROUND, Math.max(1, game.subRoundIndex || 1)) : 0;
  const life = game.PHASE === 'life' ? game.lifeStageIndex || 1 : 0;
  const pills = [1, 2, 3]
    .map((n) => {
      let cls = 'cypill';
      if (game.roundActive && sr === n && game.PHASE !== 'select' && game.PHASE !== 'merging') cls += ' on';
      return `<div class="${cls}" title="Animal cross ${n} of ${SUB_ROUNDS_PER_ROUND}">${n}</div>`;
    })
    .join('');
  const miniLife =
    game.PHASE === 'life' && life
      ? `<span style="margin-left:.5rem;color:var(--amber);font-family:var(--mono);font-size:.72rem"> · Stage ${life}/4</span>`
      : '';

  const showTrack =
    game.roundActive &&
    game.PHASE !== 'roundEnd' &&
    (game.HYBRID || game.PHASE === 'select' || game.PHASE === 'life');

  const track = showTrack
    ? `<div class="cytrack anim-up">${pills}<div class="cybreedlbl">Round meta · Cross <strong>${sr || 1}</strong>/${SUB_ROUNDS_PER_ROUND}${miniLife} · Passes left (this cross) <strong>${game.crossPassesRemaining ?? 0}</strong></div></div>`
    : '';

  document.getElementById('stats').innerHTML = `
    <div class="stats-grid">
      <div class="sc sg anim-up"><div class="n">${game.ST.fame.length}</div><div class="l">🏆 Full lives</div></div>
      <div class="sc sr anim-up s1"><div class="n">${game.ST.extinctions.length}</div><div class="l">💀 Extinct</div></div>
      <div class="sc sa anim-up s2"><div class="n">${fmtRes(game.ST.resources)}</div><div class="l">🧪 Resources</div></div>
      <div class="sc sb anim-up s3"><div class="n">${acc}%</div><div class="l">🔮 Accuracy</div></div>
      <div class="sc spnts anim-up s4"><div class="n">${pts}</div><div class="l">⭐ Points</div></div>
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

function slotHtml(found, cls) {
  if (!found)
    return `<div class="mslot-ph">Select a founder</div>`;
  const sp = found.species;
  const ind = found.individual;
  return `
    <span class="mslot-em">${sp.emoji}</span>
    <div class="mslot-nm">${ind.displayName}</div>
    <div class="mslot-sub">${sp.name} · ${ind.gender}<br/><span style="opacity:.85">${ind.personality}</span></div>`;
}

function renderSelect(m) {
  const reason = mergeBlockReason(game.SEL_PARENT_A, game.SEL_PARENT_B, game.ST.extinctions);
  const canMerge = game.SEL_PARENT_A && game.SEL_PARENT_B && !reason;

  const sections = SPECIES.map((sp) => {
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
        const cls =
          locked ? 'locked' : isA ? 'sa' : isB ? 'sb' : '';
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
          <span class="${badgeCls}" style="position:absolute;top:6px;right:6px;font-size:.52rem;padding:2px 5px;border-radius:4px">${sp.iucn}</span>
          <div class="ind-nm">${sp.emoji} ${ind.displayName}</div>
          <div class="ind-meta">${ind.gender}</div>
          <div class="ind-person">${ind.personality}</div>
        </button>`;
      })
      .join('');

    return `<div class="species-section anim-up">
      <div class="species-head">
        <span class="sp-em">${sp.emoji}</span>
        <strong style="color:var(--text)">${sp.name}</strong>
        <span style="color:var(--text3)">· ${sp.status}</span>
        <span class="${taxonChipClass(sp.taxon)}">${TAXON_LABEL[sp.taxon]}</span>
        <span class="${realmChipClass(sp.realm)}">${REALM_LABEL[sp.realm || 'terrestrial']}</span>
      </div>
      <div class="ind-grid">${cards}</div>
    </div>`;
  }).join('');

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
    <div class="lab-layout">
      <div class="lab-scroll">
        <div class="card gene-lab-card anim-up">
          <div class="ctitle">Animal cross ${game.subRoundIndex}/${SUB_ROUNDS_PER_ROUND} — Choose founders</div>
          <p class="gene-lab-lede">
            Each <strong>round</strong> runs <strong>${SUB_ROUNDS_PER_ROUND} crosses</strong> with only <strong>${ROUND_RESOURCE_PASSES}</strong> conservation deploys total (split <strong>${PASSES_PER_CROSS_SEQUENCE.join('+')}</strong> across the crosses — surviving a full natural life banks <strong>+2 passes</strong> for the next cross).
          </p>
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
  mainEl.innerHTML = `<div class="card anim-up" style="text-align:center;padding:3rem 1.5rem">
    <div class="spin"></div>
    <div style="font-size:1rem;font-weight:500">${main}</div>
    <div style="font-size:.82rem;color:var(--text3);margin-top:.35rem">${sub}</div>
    <div class="dots" style="justify-content:center"><span></span><span></span><span></span></div>
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
  const bars = Object.entries(h.traits)
    .map(([k, v]) => {
      const meta = TMETA[k];
      return `<div class="trow">
      <div class="tlbl">${meta.label}</div>
      <div class="ttrack"><div class="tfill" style="width:${v}%;background:${meta.color}"></div></div>
      <div class="tval" style="color:${meta.color}">${v}</div>
    </div>`;
    })
    .join('');
  const pa = founderLabel(h.parentA);
  const pb = founderLabel(h.parentB);

  m.innerHTML = `<div class="card anim-up">
    <div class="ctitle">🎉 Breeding cohort synthesised</div>
    <div class="hhdr">
      <div class="hem anim-float">${h.emoji}</div>
      <div class="hmeta">
        <div class="hnm">${h.name}</div>
        <div class="hpar">🧬 Parents · ${pa} × ${pb}<br/><span style="opacity:.85">${h.parentA.species.name}${
          h.parentA.species.id === h.parentB.species.id ? ' renewal line' : ' × ' + h.parentB.species.name
        }</span></div>
        <div class="sring-row">
          <div class="sring" style="border-color:${col}">
            <div class="n" style="color:${col}">${sc}</div>
            <div class="l">Viability</div>
          </div>
          <div class="sverdict">${verdict}</div>
        </div>
      </div>
    </div>
    ${h.bio ? `<div class="narr">${h.bio}</div>` : ''}
    <div class="div">Trait profile</div>
    <div class="tbars">${bars}</div>
    <div class="card-sm anim-up" style="margin-top:1rem;font-size:.8rem;color:var(--text2);line-height:1.6">
      <strong style="color:var(--text)">Next:</strong> four life stages (${LIFE_STAGE_LABELS.join(' → ')}) — each beat you must match the <strong>right conservation deploy</strong> to the active crisis <em>and</em> forecast the hidden survival outcome.<br/>
      <strong>Wrong deploy</strong> → cross ends in collapse. If you still call <code>extinct</code> you lose <strong>${Math.abs(MATRIX_WR_RG)}</strong> pts; otherwise <strong>${Math.abs(MATRIX_WR_WG)}</strong> pts.
    </div>
    <button type="button" class="btn btn-p btn-blk btn-lg" data-action="begin-life-stage" style="margin-top:1rem">Begin life arc — Stage 1 (${LIFE_STAGE_LABELS[0]}) →</button>
  </div>`;
}

function renderLifePhase(m) {
  const h = game.HYBRID;
  const ev = game.EVENT;
  if (!h || !ev) {
    m.innerHTML = `<div class="card">Missing crisis data — return to Gene Lab.</div>`;
    return;
  }
  const stageIdx = Math.max(1, Math.min(LIFE_STAGES_PER_SUBROUND, game.lifeStageIndex || 1));
  const stageLabel = LIFE_STAGE_LABELS[stageIdx - 1];
  const resCrds = RESOURCES.map(
    (r) => `
    <button type="button" class="cc${game.LIFE_RES?.id === r.id ? ' on' : ''}" data-action="pick-life-res" data-res-id="${r.id}">
      <span class="ci">${r.emoji}</span>
      <div class="ctname">${r.name}</div>
      <div class="ccdesc">${r.desc}</div>
      <div class="ceff ep">${r.effect}</div>
    </button>`,
  ).join('');

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

  const canGo = game.LIFE_RES && game.LIFE_PRED && game.crossPassesRemaining >= 1;

  m.innerHTML = `<div class="card anim-up">
    ${coachBanner()}
    <div class="chdr">
      <div class="cbadge c2">Cross ${game.subRoundIndex}/${SUB_ROUNDS_PER_ROUND}</div>
      <div><div class="ctit">Life stage ${stageIdx}/${LIFE_STAGES_PER_SUBROUND} — ${stageLabel}</div><div class="csub">${h.name} · ledger care+mate <strong>+${game.careMateLedgerPct}%pts</strong></div></div>
    </div>
    ${cycleLifeBanner(stageIdx, 0)}
    ${healthBarHtml(game.healthMeter)}
    <div class="ecard anim-up s1">
      <div class="elbl">⚡ Active crisis</div>
      <div class="enm">${ev.emoji} ${ev.name}</div>
      <div class="edesc">${ev.desc}</div>
      <div class="edelta">Score modifier: ${ev.impact}</div>
    </div>
    <div class="tripred anim-up" style="margin-top:1rem">
      <div class="tripred-title">Scoring matrix (this stage)</div>
      <div class="tripred-note" style="margin-bottom:.75rem">
        <table style="width:100%;font-size:.76rem;border-collapse:collapse;color:var(--text2)">
          <tr style="border-bottom:1px solid var(--border)"><th style="text-align:left;padding:.35rem"></th><th style="padding:.35rem">Right guess</th><th style="padding:.35rem">Wrong guess</th></tr>
          <tr><td style="padding:.35rem;font-weight:600;color:var(--green)">Right deploy</td><td style="padding:.35rem;color:var(--green)">+${MATRIX_RR_RG} pts</td><td style="padding:.35rem;color:var(--amber)">+${MATRIX_RR_WG} pts</td></tr>
          <tr><td style="padding:.35rem;font-weight:600;color:var(--red)">Wrong deploy</td><td style="padding:.35rem">Extinct · ${MATRIX_WR_RG} pts</td><td style="padding:.35rem">Extinct · ${MATRIX_WR_WG} pts</td></tr>
        </table>
      </div>
    </div>
    <div class="div">1 · Pick conservation deploy (−1 round pass)</div>
    ${
      game.crossPassesRemaining < 1
        ? `<div class="warn">⚠️ No deploy passes left — cannot safely intervene this stage.</div>`
        : `<div style="font-size:.74rem;color:var(--text3);margin:-.25rem 0 .5rem">Align deploy keywords with the crisis narrative (pathogens ↔ vaccine, habitat loss ↔ reserves, marine noise ↔ patrols, climate shocks ↔ shelters).</div>`
    }
    <div class="cgrid">${resCrds}</div>
    <div class="div">2 · One survival forecast (hidden roll)</div>
    <div class="prow">${predBtns}</div>
    <button type="button" class="btn btn-p btn-blk btn-lg" data-action="resolve-life-cycle" ${canGo ? '' : 'disabled'}>
      ${canGo ? 'Resolve this life stage →' : !game.LIFE_RES ? 'Pick a deploy first' : !game.LIFE_PRED ? 'Pick your forecast' : 'No passes left'}
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
      <div class="osub">${ext ? 'Wrong deploy or lethal rolls drained vitality.' : 'Care+mate legacy unlocked for remaining crosses this round.'}</div>
    </div>
    ${game.FINAL_NARR ? `<div class="narr ${ext ? 'nr' : 'ng'} anim-up s1">${game.FINAL_NARR}</div>` : ''}
    <button type="button" class="btn btn-p btn-lg" data-action="continue-sub-round">${game.subRoundIndex >= SUB_ROUNDS_PER_ROUND ? 'See round summary →' : 'Next animal cross →'}</button>`;
}

function renderRoundEnd(m) {
  const gained = Math.floor((game.ST.points || 0) - (game.roundPointsSnapshot || 0));
  m.innerHTML = `
    <div class="card anim-up">
      <div class="ctitle">🏁 Round complete</div>
      <p style="font-size:.88rem;color:var(--text2);line-height:1.65">
        You finished <strong>${SUB_ROUNDS_PER_ROUND}</strong> crosses this meta-round.<br/>
        Points this round: <strong style="color:var(--purple)">${gained >= 0 ? '+' : ''}${gained}</strong>
        · Lifetime scoreboard: <strong>${Math.floor(Number(game.ST.points) || 0)}</strong>
      </p>
      <button type="button" class="btn btn-p btn-lg" data-action="finish-round">Return to Gene Lab · rotate breed slot →</button>
    </div>`;
}

function founderFooter(h) {
  if (h?.founderLine) return h.founderLine;
  const fa = h?.founderAn || '';
  const fb = h?.founderBn || '';
  if (fa && fb) return `${fa} × ${fb}`;
  return `${h?.pAn || ''} × ${h?.pBn || ''}`;
}

function renderRecords(m) {
  const fCards = game.ST.fame.length
    ? game.ST.fame
        .map(
          (h) => `<div class="hcard hf">
        <span class="hem2">${h.emoji}</span>
        <div class="hnm2">${h.name}</div>
        <div class="hpar2">${founderFooter(h)}</div>
        <div class="hscore" style="color:var(--green)">Score: ${h.score}${h.fullLife ? ' · Natural life arc' : ''}</div>
      </div>`,
        )
        .join('')
    : `<div class="empty"><span class="eic">🏆</span><div class="etx">No full-life arcs yet</div></div>`;
  const eCards = game.ST.extinctions.length
    ? game.ST.extinctions
        .map(
          (e) => `<div class="hcard he">
        <span class="hem2">${e.emoji || '💀'}</span>
        <div class="hnm2">${e.name}</div>
        <div class="hpar2">${founderFooter(e)}</div>
        <div class="hscore" style="color:var(--red)">🔒 Permanently extinct</div>
      </div>`,
        )
        .join('')
    : `<div class="empty"><span class="eic">💀</span><div class="etx">No extinctions recorded yet</div></div>`;
  m.innerHTML = `
    <div class="card anim-up"><div class="ctitle">🏆 Hall of Fame (${game.ST.fame.length})</div><div class="hgrid">${fCards}</div></div>
    <div class="card anim-up s2"><div class="ctitle">💀 Hall of Extinction (${game.ST.extinctions.length})</div><div class="hgrid">${eCards}</div></div>`;
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
        .map(
          (l) => `<div class="lrow">
        <div class="lnm">${l.name} — Stage ${l.cycle}</div>
        <div class="ldt">${l.event} → <strong style="color:${l.out === 'survive' ? 'var(--green)' : l.out === 'damage' ? 'var(--amber)' : 'var(--red)'}">${l.out}</strong>${l.res && l.res !== 'None' ? ' · ' + l.res : ''}</div>
      </div>`,
        )
        .join('')
    : `<div class="empty"><span class="eic">📋</span><div class="etx">No cycles logged yet</div></div>`;
  m.innerHTML = `
    <div class="card anim-up">
      <div class="ctitle">🔮 Forecast history (${preds.length})</div>
      ${preds.length ? `<div class="ratew" style="margin-bottom:1rem">
        <div class="rateh"><span class="ratel">Overall accuracy</span><span class="ratep" style="color:${scoreColor(acc)}">${acc}%</span></div>
        <div class="ratetr"><div class="ratefill" style="width:${acc}%;background:${scoreColor(acc)}"></div></div>
      </div>` : ''}
      <div style="max-height:280px;overflow-y:auto;padding-right:4px">${pRows}</div>
    </div>
    <div class="card anim-up s2">
      <div class="ctitle">📋 Life-stage log (${game.ST.log.length})</div>
      <div style="max-height:320px;overflow-y:auto;padding-right:4px">${lRows}</div>
    </div>`;
}

export function renderSettings(m) {
  m.innerHTML = `
    <div class="card anim-up">
      <div class="ctitle">📖 How to play (life-round model)</div>
      <div style="font-size:.83rem;color:var(--text2);line-height:1.82">
        <strong style="color:var(--text)">1. Structure</strong> — One <strong>round</strong> = <strong>${SUB_ROUNDS_PER_ROUND} animal crosses</strong>. Each cross walks <strong>${LIFE_STAGES_PER_SUBROUND} life stages</strong>: ${LIFE_STAGE_LABELS.join(' → ')}.<br>
        <strong style="color:var(--text)">2. Pass economy</strong> — Only <strong>${ROUND_RESOURCE_PASSES}</strong> deploys exist per round, split <strong>${PASSES_PER_CROSS_SEQUENCE.join(' · ')}</strong> across crosses 1→3 (each resolved stage spends one pass). Completing all ${LIFE_STAGES_PER_SUBROUND} life stages grants <strong>+2 bonus passes</strong> toward the next cross.<br>
        <strong style="color:var(--text)">3. Matrix</strong> — Each stage pick <strong>one deploy</strong> + <strong>one survival forecast</strong>.
        Right deploy + right forecast <strong>+${MATRIX_RR_RG}</strong> pts · Right deploy + wrong forecast <strong>+${MATRIX_RR_WG}</strong>.
        <strong>Wrong deploy ⇒ extinction</strong> for that cross · guessed extinct vs not ⇒ <strong>${MATRIX_WR_RG}</strong> vs <strong>${MATRIX_WR_WG}</strong> pts.<br>
        <strong style="color:var(--text)">4. Health meter</strong> — Vitality rises/falls as stages resolve — reaching <strong>0</strong> ends the cross.<br>
        <strong style="color:var(--text)">5. Care+mate legacy</strong> — Surviving all ${LIFE_STAGES_PER_SUBROUND} stages grants <strong>+${CARE_MATE_BONUS_PER_FULL_LIFE}%pts</strong> toward survival math on later crosses this round plus <strong>+2 bonus passes</strong> for the next cross.<br>
      </div>
    </div>
    <div class="card anim-up s3">
      <div style="font-size:.82rem;color:var(--text2);margin-bottom:.85rem">
        Conservation pool (legacy stat): <strong>${fmtRes(game.ST.resources)}</strong> · Breed slot: <strong>${game.ST.breedRound ?? 1}/5</strong> · Points: <strong>${Math.floor(Number(game.ST.points) || 0)}</strong>
      </div>
      <button type="button" class="btn btn-d" data-action="reset-all-confirm">🗑️ Reset all game data</button>
    </div>`;
}
