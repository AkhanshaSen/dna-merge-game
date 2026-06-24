import {
  RESOURCES,
  LIFE_STAGES_PER_SUBROUND,
  LIFE_STAGE_LABELS,
  MATRIX_RR_RG,
  MATRIX_RR_WG,
  MATRIX_WR_RG,
  MATRIX_WR_WG,
  GENEFIX_COST,
  CARE_PERKS,
  RESOURCE_SOFT_CAP,
  REVIVAL_LAB_BONUS,
  REVIVAL_VITALITY,
} from '../../../core/constants.js';
import { canAffordDeploy, deployLabCost } from '../../../core/resource-economy.js';
import { game } from '../../../core/state.js';
import { scoreColor, resourceSynergyMatch, synergyBonus, gambitOddsPreview } from '../../../core/game-logic.js';
import { lifeStageTimelineHtml } from '../../../content/cycle-meta.js';
import { ethicalHintBlock, outlookBands } from '../../../content/coach-hints.js';
import { survivalRateLifeStage } from '../../../core/life-round-logic.js';
import {
  crisisDeployHintText,
  crisisHasSynergyDeploys,
  canAffordAnySynergyDeploy,
} from '../../../core/deploy-match.js';
import { isRevivalEligible, revivalHintReason } from '../../../core/extinction-revival.js';
import { gameProgressBannerHtml, gameProgressLabel } from '../../../game/round-tracker.js';
import {
  isLearningMode,
  lifeStageStepStrip,
  renderGoalStrip,
  renderContextHint,
  shouldShowHint,
} from '../../../content/player-guide.js';
import { hybridFromHybrid, dynIcon, lifeStageIcon } from '../../visuals/creature-visuals.js';
import { coachBanner, fmtRes, healthBarHtml, traitBarsHtml, defectCardHtml } from '../helpers.js';

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

function gambitFateMeterHtml() {
  const h = game.HYBRID;
  const { cohortPct, naturePct, threshold } = gambitOddsPreview(h?.score ?? 50);
  const dice = game.lastGambitDice;
  const meter = `<div class="gambit-fate-meter" role="img" aria-label="Cohort ${cohortPct}% versus nature ${naturePct}%">
    <div class="gambit-fate-cohort" style="width:${cohortPct}%"><span>Cohort ${cohortPct}%</span></div>
    <div class="gambit-fate-nature" style="width:${naturePct}%"><span>Nature ${naturePct}%</span></div>
  </div>`;
  const note = dice
    ? `<div class="gambit-roll-result ${dice.cohortWins ? 'gambit-roll-win' : 'gambit-roll-loss'}">
        <div class="gambit-roll-line">Fate roll <strong>${dice.fateRoll}</strong> vs gate <strong>${dice.threshold}%</strong> → <strong>${dice.cohortWins ? 'Cohort' : 'Nature'}</strong> steered the beat</div>
        <div class="gambit-roll-line">Story dice ${dice.diceA} + ${dice.diceB} → outcome <strong>${dice.rolled}</strong></div>
      </div>`
    : `<p class="gambit-fate-note">On resolve: a <strong>d100</strong> roll under <strong>${threshold}%</strong> lets the cohort steer the outcome; otherwise nature prevails. Viability tilts the bar — not a flat 50/50.</p>
      <div class="dice-strip dice-preview"><span class="die die-idle-face">d100</span><span class="die-plus">+</span><span class="die die-idle-face">🎲🎲</span></div>`;
  return meter + note;
}

function gambitPanelHtml() {
  const observeOn = game.LIFE_RES?.id === 'observe';
  return `<div class="gambit-panel anim-up">
    ${gameProgressBannerHtml({ compact: true })}
    <div class="gambit-title">Gambit — lab reserves empty</div>
    <p class="gambit-copy">You cannot fund standard deploys. Pick a <strong>forecast</strong> and roll fate on resolve — or choose <strong>Just Monitor</strong> (same odds, 0 lab).</p>
    <button type="button" class="cc deploy-observe${observeOn ? ' on' : ''}" data-action="pick-life-res" data-res-id="observe">
      <span class="lab-cost-badge lab-free">0 🧪</span>
      ${dynIcon('deploy', 'observe', { size: 34 })}
      <div class="ctname">Just Monitor</div>
      <div class="ccdesc">0 lab — watch and forecast without deploy bonus.</div>
    </button>
    ${gambitFateMeterHtml()}
    ${ethicalHintBlock('forecast')}
  </div>`;
}

function stageReceiptHtml() {
  const lr = game.LAST_RESOLVE;
  if (!lr) return '';
  const learning = isLearningMode(game.ST, game);
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
    ${game.healthMeter > 0 ? `<p class="matrix-hint" style="margin-top:.65rem">${learning ? 'Vitality above 0 means the line continues to the next stage.' : 'The line still breathes. Wrong guesses cost points, not necessarily lives — when you deploy wisely.'}</p>` : ''}
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

function outlookSectionHtml(isLearning) {
  const outlook = outlookBarHtml();
  if (!outlook) return '';
  if (!isLearning) return outlook;
  return `<details class="learning-collapsed anim-up">
    <summary>See odds breakdown</summary>
    ${outlook}
  </details>`;
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
      ${dynIcon('perk', p.id, { glow: false, size: 32, color: '#ffb84f' })}
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

export function renderLifePhase(m) {
  const h = game.HYBRID;
  const ev = game.EVENT;
  if (!h || !ev) {
    m.innerHTML = `<div class="card">Missing crisis data — return to Gene Lab.</div>`;
    return;
  }

  if (game.lifeSubStep === 'receipt') {
    const receiptHint = shouldShowHint('firstReceipt', game.ST) ? renderContextHint('firstReceipt') : '';
    m.innerHTML = `<div class="card anim-up">${coachBanner()}${receiptHint}${renderGoalStrip(game)}${stageReceiptHtml()}</div>`;
    return;
  }
  if (game.lifeSubStep === 'revival') {
    const receiptHint = shouldShowHint('firstReceipt', game.ST) ? renderContextHint('firstReceipt') : '';
    m.innerHTML = `<div class="card anim-up">${coachBanner()}${receiptHint}${renderGoalStrip(game)}${stageReceiptHtml()}${revivalOfferHtml()}</div>`;
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

  const gambit = game.gambitMode;
  if (!gambit && game.LIFE_PRED && !game.LIFE_RES) game.LIFE_PRED = null;

  const stageIdx = Math.max(1, Math.min(LIFE_STAGES_PER_SUBROUND, game.lifeStageIndex || 1));
  const stageLabel = LIFE_STAGE_LABELS[stageIdx - 1];
  const labPool = game.ST.resources;
  const hasSynergy = crisisHasSynergyDeploys(ev);
  const affordSynergy = canAffordAnySynergyDeploy(ev, labPool);
  const showFallbackPath = !hasSynergy || !affordSynergy;
  const showMonitor = stageIdx >= 2 || showFallbackPath;
  const deployTypes = new Set(['survival', 'fallback', 'observe']);
  const resCrds = RESOURCES.filter((r) => r.type !== 'cure' || game.HYBRID?.defect)
    .filter((r) => deployTypes.has(r.type))
    .filter((r) => {
      if (r.type === 'observe') return showMonitor;
      if (r.type === 'fallback') return showFallbackPath;
      return true;
    })
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
              ? '<span class="synergy-tag observe-tag">0 lab · save resources</span>'
              : '';
      return `
    <button type="button" class="${cls}" ${action}>
      ${r.type !== 'observe' ? `<span class="lab-cost-badge">−${cost} 🧪</span>` : '<span class="lab-cost-badge lab-free">0 🧪</span>'}
      ${dynIcon('deploy', r.id, { glow: syn || fallbackRec, pulse: game.LIFE_RES?.id === r.id, size: 34 })}
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

  const forecastLocked = !gambit && !game.LIFE_RES;
  const predOpts = [
    { k: 'survive', i: '✅', t: 'Adapts & survives' },
    { k: 'damage', i: '⚠️', t: 'Survives, damaged' },
    { k: 'extinct', i: '💀', t: 'Collapses' },
  ];
  const predBtns = predOpts
    .map((o) => {
      const sel =
        !forecastLocked && game.LIFE_PRED === o.k
          ? o.k === 'survive'
            ? ' psy'
            : o.k === 'damage'
              ? ' psd'
              : ' pse'
          : '';
      const lockCls = forecastLocked ? ' pb-locked' : '';
      const disabled = forecastLocked ? 'disabled' : '';
      const action = forecastLocked ? '' : `data-action="pick-life-pred" data-pred="${o.k}"`;
      return `<button type="button" class="pb${sel}${lockCls}" ${action} ${disabled}>
      <span class="pi">${o.i}</span><div class="pt">${o.t}</div>
    </button>`;
    })
    .join('');
  const forecastGateHint = forecastLocked
    ? '<p class="forecast-gate-hint">Select a deploy card above before forecasting.</p>'
    : '';

  const juvenileMonitorHint =
    showMonitor && !showFallbackPath && stageIdx >= 2
      ? `<div class="matrix-hint monitor-juvenile-hint">From <strong>Juvenile</strong> onward you can pick <strong>Just Monitor</strong> (0 lab) to save resources for later crises.</div>`
      : '';

  const canGo = gambit
    ? game.LIFE_PRED && game.crossPassesRemaining >= 1
    : game.LIFE_RES && game.LIFE_PRED && game.crossPassesRemaining >= 1;
  const gentleMode = isLearningMode(game.ST, game);
  const contextHint =
    shouldShowHint('firstLifeStage', game.ST)
      ? renderContextHint('firstLifeStage')
      : shouldShowHint('firstDeploy', game.ST) && game.LIFE_RES
        ? renderContextHint('firstDeploy')
        : shouldShowHint('firstForecast', game.ST) && game.LIFE_PRED
          ? renderContextHint('firstForecast')
          : '';

  const deploySection = gambit
    ? gambitPanelHtml()
    : `${ethicalHintBlock('deploy')}
    ${
      game.crossPassesRemaining < 1
        ? `<div class="warn">⚠️ No deploy passes left.</div>`
        : `<div class="matrix-hint">Pick a help card for this crisis (✦ = better fit), then choose your forecast.</div>`
    }
    ${juvenileMonitorHint}
    ${noSynergyBanner}
    <div class="cgrid">${resCrds}</div>
    ${outlookSectionHtml(gentleMode)}`;

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
    ${contextHint}
    ${renderGoalStrip(game)}
    ${gameProgressBannerHtml({ compact: true })}
    ${lifeStageStepStrip()}
    <div class="chdr">
      ${lifeStageIcon(stageIdx)}
      <div><div class="ctit">Life stage ${stageIdx}/${LIFE_STAGES_PER_SUBROUND} — ${stageLabel}</div><div class="csub">${gameProgressLabel({ finalTag: false })} · ${h.name} · lab <strong>${fmtRes(game.ST.resources)}/${RESOURCE_SOFT_CAP}</strong></div></div>
      ${hybridFromHybrid(h, { size: 'sm', animate: true, className: 'life-hybrid-portrait', lifeStage: stageIdx })}
    </div>
    ${lifeStageTimelineHtml(stageIdx)}
    ${traitBarsHtml(h.traits)}
    ${healthBarHtml(game.healthMeter)}
    ${defectCardHtml(h)}
    ${secretKeyHtml()}
    <div class="ecard anim-up s1">
      <div class="ecard-inner">
        ${dynIcon('crisis', ev.id, { glow: true, pulse: true, size: 44, color: '#ff4f6b' })}
        <div class="ecard-body">
          <div class="elbl">⚡ Active crisis</div>
          <div class="enm">${ev.name}</div>
          <div class="edesc">${ev.desc}</div>
          <div class="edelta">${gentleMode ? 'Crisis pressure' : 'Score modifier'}: ${ev.impact}</div>
          <div class="crisis-deploy-hint">${crisisHint}</div>
        </div>
      </div>
    </div>
    ${gambit || gentleMode ? '' : `<div class="tripred matrix-wrap anim-up">
      <div class="tripred-title">Scoring matrix</div>
      <div class="tripred-note tripred-note-spaced">
        <table class="matrix-table">
          <tr><th></th><th>Right guess</th><th>Wrong guess</th></tr>
          <tr><td class="receipt-ok">Right deploy</td><td class="receipt-ok">+${MATRIX_RR_RG} pts</td><td style="color:var(--amber)">+${MATRIX_RR_WG} pts</td></tr>
          <tr><td class="receipt-bad">Wrong deploy</td><td>Extinct · ${MATRIX_WR_RG} pts</td><td>Extinct · ${MATRIX_WR_WG} pts</td></tr>
        </table>
      </div>
    </div>`}
  ${gambit ? '<div class="div">Gambit — forecast only</div>' : '<div class="div">1 · Pick help</div>'}
    ${deploySection}
    <div class="div">${gambit ? 'Your forecast' : '2 · Guess outcome'}</div>
    ${gambit ? '' : ethicalHintBlock('forecast')}
    ${forecastGateHint}
    <div class="prow">${predBtns}</div>
    <button type="button" class="btn btn-p btn-blk btn-lg" data-action="resolve-life-cycle" ${canGo ? '' : 'disabled'}>
      ${game.crossPassesRemaining < 1 ? 'No passes left' : resolveLabel}
    </button>
  </div>`;
}