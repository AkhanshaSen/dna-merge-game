import {
  RESOURCES,
  RESOURCE_SOFT_CAP,
  SUB_ROUNDS_PER_ROUND,
  LIFE_STAGES_PER_SUBROUND,
  PASSES_PER_CROSS_SEQUENCE,
  MATRIX_RR_RG,
  MATRIX_RR_WG,
  MATRIX_WR_RG,
  MATRIX_WR_WG,
  CARE_MATE_BONUS_PER_FULL_LIFE,
  FORECAST_POINTS_SOFT_CAP,
} from './constants.js';
import { findFounder } from './species.js';
import { LS } from './storage.js';
import { fbHybrid, fbNarrative, fbVerdict } from './fallbacks.js';
import { blendTraits, avgScore, mergePairKey, mergeBlockReason } from './breeding.js';
import { rndEvent, rollOutcome } from './game-logic.js';
import { showToast } from './toast.js';
import {
  game,
  resetSession,
  reloadPersistedState,
  savePersisted,
  resetRoundSession,
  resetCrossSession,
} from './state.js';
import { render } from './render.js';
import { canonicalCorrectResource, survivalRateLifeStage, dicePhaseForLifeStage } from './life-round-logic.js';

function clampResource(n) {
  return Math.min(Math.max(0, n), RESOURCE_SOFT_CAP);
}

function clampPoints(n) {
  return Math.min(Math.max(0, Math.floor(n)), FORECAST_POINTS_SOFT_CAP);
}

function extinctionPayload() {
  const h = game.HYBRID;
  const fa = h.parentA.individual.displayName;
  const fb = h.parentB.individual.displayName;
  return {
    name: h.name,
    emoji: h.emoji,
    mergeKey: h.mergeKey,
    pA: h.parentA.species.id,
    pB: h.parentB.species.id,
    pAn: h.parentA.species.name,
    pBn: h.parentB.species.name,
    founderAn: fa,
    founderBn: fb,
    founderLine: `${fa} × ${fb}`,
    score: h.score,
  };
}

function famePayload() {
  return {
    ...extinctionPayload(),
    outcome: 'survive',
    fullLife: true,
  };
}

/** Start meta-round bookkeeping when first merge begins */
function ensureRoundBudget() {
  if (!game.roundActive) {
    game.roundActive = true;
    game.roundNumber = (game.roundNumber || 0) + 1;
    game.subRoundIndex = 1;
    game.careMateLedgerPct = 0;
    game.bonusPassesNextSubRound = 0;
    game.roundPointsSnapshot = game.ST.points;
  }
}

export function switchView(v) {
  game.VIEW = v;
  document.querySelectorAll('.tb').forEach((t) => t.classList.toggle('on', t.dataset.v === v));
  render();
}

export function pick(individualId) {
  const hit = findFounder(individualId);
  if (!hit) return;
  const wrapped = { species: hit.species, individual: hit.individual };
  game.coachNote = null;

  if (game.SEL_PARENT_A?.individual.id === individualId) {
    game.SEL_PARENT_A = null;
    render();
    showToast({ title: 'Slot A cleared', body: 'Pick another founder when ready.', variant: 'neutral' }, 2600);
    return;
  }
  if (game.SEL_PARENT_B?.individual.id === individualId) {
    game.SEL_PARENT_B = null;
    render();
    showToast({ title: 'Slot B cleared', body: 'Second founder removed.', variant: 'neutral' }, 2600);
    return;
  }
  if (!game.SEL_PARENT_A) {
    game.SEL_PARENT_A = wrapped;
  } else if (!game.SEL_PARENT_B) {
    game.SEL_PARENT_B = wrapped;
  } else {
    game.SEL_PARENT_A = wrapped;
    game.SEL_PARENT_B = null;
  }
  render();

  const nm = wrapped.individual.displayName;
  if (game.SEL_PARENT_A && !game.SEL_PARENT_B) {
    showToast(
      {
        title: 'Founder A locked',
        body: `${nm} — choose founder B with the same class and realm, and the opposite sex.`,
        variant: 'info',
      },
      4200,
    );
    return;
  }

  const reason = mergeBlockReason(game.SEL_PARENT_A, game.SEL_PARENT_B, game.ST.extinctions);
  if (game.SEL_PARENT_A && game.SEL_PARENT_B) {
    if (reason) {
      game.coachNote = { kind: 'warn', text: `${reason} Adjust your picks.` };
      showToast({ title: 'Cannot merge this pair', body: reason, variant: 'warn' }, 5600);
    } else {
      const sameSp = game.SEL_PARENT_A.species.id === game.SEL_PARENT_B.species.id;
      game.coachNote = {
        kind: 'good',
        text: sameSp
          ? '🌿 Same-species renewal — projections favour cohesive genetics.'
          : '🧬 Cross-line rescue — hybrid friction trims survival outlook versus renewals.',
      };
      showToast(
        {
          title: 'Both founders selected',
          body: `${game.SEL_PARENT_A.individual.displayName} × ${game.SEL_PARENT_B.individual.displayName}`,
          variant: 'good',
        },
        4800,
      );
    }
  }
}

export function startMerge() {
  const A = game.SEL_PARENT_A;
  const B = game.SEL_PARENT_B;
  if (!A || !B || A.individual.id === B.individual.id) return;
  if (mergeBlockReason(A, B, game.ST.extinctions)) return;

  game.coachNote = null;
  ensureRoundBudget();
  game.PHASE = 'merging';
  render();

  try {
    resetCrossSession();
    const traits = blendTraits(A, B);
    const score = avgScore(traits);
    const hd = fbHybrid(A, B, score);
    const mk = mergePairKey(A, B);

    game.HYBRID = {
      id: Date.now(),
      name: hd.name,
      emoji: hd.emoji || A.species.emoji,
      bio: hd.bio,
      rawDefects: hd.defects || [],
      traits,
      score,
      parentA: A,
      parentB: B,
      mergeKey: mk,
      outcome: null,
      sameSpeciesRenewal: A.species.id === B.species.id,
    };

    game.ST.hybrids.push({ id: game.HYBRID.id, name: game.HYBRID.name });
    savePersisted();
    game.EVENT = rndEvent();
    game.PHASE = 'hybrid';
  } catch (e) {
    console.error(e);
    game.PHASE = 'select';
  }
  render();
}

/** From hybrid briefing → first life-stage screen */
export function beginLifeStage() {
  if (!game.HYBRID) return;
  game.coachNote = null;
  game.PHASE = 'life';
  game.lifeStageIndex = 1;
  game.healthMeter = 100;
  game.LIFE_RES = null;
  game.LIFE_PRED = null;
  game.LAST_RESOLVE = null;
  const extra = game.bonusPassesNextSubRound || 0;
  game.bonusPassesNextSubRound = 0;
  const slice = PASSES_PER_CROSS_SEQUENCE[Math.min(SUB_ROUNDS_PER_ROUND, Math.max(1, game.subRoundIndex || 1)) - 1] ?? 3;
  game.crossPassesRemaining = slice + extra;
  if (!game.EVENT) game.EVENT = rndEvent();
  render();
}

export function pickLifeResource(id) {
  const res = RESOURCES.find((r) => r.id === id) || null;
  game.LIFE_RES = res;
  render();
}

export function pickLifePred(pred) {
  if (pred !== 'survive' && pred !== 'damage' && pred !== 'extinct') return;
  game.LIFE_PRED = pred;
  render();
}

function logLifeBeat(extra) {
  game.ST.log.push({
    name: game.HYBRID.name,
    cycle: game.lifeStageIndex,
    event: extra.event,
    res: extra.res,
    out: extra.out,
    detail: extra.detail,
  });
}

function pushPredictionRow(pred, actual, pts) {
  game.ST.predictions.push({
    name: `${game.HYBRID.name} — SR${game.subRoundIndex} · ${game.lifeStageIndex}/4`,
    pred,
    actual,
    ok: pred === actual,
    cycle: game.subRoundIndex * 10 + game.lifeStageIndex,
    slot: 0,
    pts,
  });
}

function advanceAfterSubRoundFailure() {
  game.HYBRID.outcome = 'extinct';
  game.ST.extinctions.push(extinctionPayload());
  savePersisted();
  game.FINAL_NARR = fbVerdict(game.HYBRID.name, 'extinct');
  game.PHASE = 'subRoundEnd';
  render();
}

function advanceAfterSubRoundSuccess() {
  game.HYBRID.outcome = 'survive';
  game.careMateLedgerPct += CARE_MATE_BONUS_PER_FULL_LIFE;
  game.bonusPassesNextSubRound += 2;
  game.ST.fame.push(famePayload());
  game.FINAL_NARR = `🌟 ${game.HYBRID.name} completed a full natural life. Care+mate legacy: <strong>+${CARE_MATE_BONUS_PER_FULL_LIFE}%pts</strong> toward survival in later crosses this round, and <strong>+2 deploy passes</strong> banked toward the next cross.`;
  savePersisted();
  game.PHASE = 'subRoundEnd';
  render();
}

function goToNextCrossOrRound() {
  game.subRoundIndex += 1;
  resetCrossSession();
  if (game.subRoundIndex > SUB_ROUNDS_PER_ROUND) {
    game.roundActive = false;
    game.PHASE = 'roundEnd';
    render();
    return;
  }
  game.SEL_PARENT_A = game.SEL_PARENT_B = null;
  game.HYBRID = null;
  game.PHASE = 'select';
  game.coachNote = {
    kind: 'good',
    text: `🧷 Cross ${game.subRoundIndex}/${SUB_ROUNDS_PER_ROUND} — care+mate ledger <strong>+${game.careMateLedgerPct}%pts</strong> on survival maths`,
  };
  render();
}

/** Resolve one life-stage beat */
export async function resolveLifeCycle() {
  if (game.PHASE !== 'life' || !game.HYBRID || !game.EVENT) return;
  const pred = game.LIFE_PRED;
  const chosenRes = game.LIFE_RES;
  if (!pred || !chosenRes) {
    showToast({ title: 'Choices needed', body: 'Pick both a deployable and one survival forecast.', variant: 'warn' }, 3200);
    return;
  }
  if (game.crossPassesRemaining < 1) {
    showToast({ title: 'No deploy passes left', body: 'You exhausted passes for this animal cross.', variant: 'warn' }, 3600);
    return;
  }

  game.crossPassesRemaining -= 1;

  const ev = game.EVENT;
  const correct = canonicalCorrectResource(ev);
  const resourceOk = chosenRes.id === correct.id;

  if (!resourceOk) {
    const guessOk = pred === 'extinct';
    const pts = guessOk ? MATRIX_WR_RG : MATRIX_WR_WG;
    game.ST.points = clampPoints(game.ST.points + pts);
    pushPredictionRow(pred, 'extinct', pts);
    game.healthMeter = 0;
    game.LAST_RESOLVE = {
      resourceOk: false,
      guessOk,
      pts,
      correctName: correct.name,
      narrative: `${ev.name}: wrong deploy — cohort collapses. Correct lever would have been <strong>${correct.emoji} ${correct.name}</strong>.`,
    };
    logLifeBeat({
      event: ev.name,
      res: chosenRes.name,
      out: 'extinct',
      detail: `matrix wrong resource · pts ${pts}`,
    });
    savePersisted();
    game.PHASE = 'cycling';
    render();
    await new Promise((r) => setTimeout(r, 380));
    advanceAfterSubRoundFailure();
    return;
  }

  const idx = game.lifeStageIndex - 1;
  const rate = survivalRateLifeStage(ev, chosenRes, game.HYBRID, idx, game.careMateLedgerPct, 0);
  const dicePhase = dicePhaseForLifeStage(idx);
  const rolled = rollOutcome(rate, {
    dicePhase,
    sameSpeciesRenewal: !!game.HYBRID.sameSpeciesRenewal,
  });
  const guessOk = pred === rolled;
  const pts = guessOk ? MATRIX_RR_RG : MATRIX_RR_WG;
  game.ST.points = clampPoints(game.ST.points + pts);
  pushPredictionRow(pred, rolled, pts);

  if (rolled === 'survive') {
    game.healthMeter = Math.min(100, game.healthMeter + (guessOk ? 8 : 3));
  } else if (rolled === 'damage') {
    game.healthMeter -= guessOk ? 12 : 22;
  } else {
    game.healthMeter = 0;
  }

  game.LAST_RESOLVE = {
    resourceOk: true,
    guessOk,
    pts,
    rolled,
    rate,
    correctName: correct.name,
    narrative: fbNarrative(game.HYBRID.name, ev.name, rolled, game.lifeStageIndex),
  };

  logLifeBeat({
    event: ev.name,
    res: chosenRes.name,
    out: rolled,
    detail: `matrix right resource · pts +${pts} · roll ${rolled}`,
  });
  savePersisted();

  game.PHASE = 'cycling';
  render();
  await new Promise((r) => setTimeout(r, 420));

  if (rolled === 'extinct' || game.healthMeter <= 0) {
    game.NARR = game.LAST_RESOLVE.narrative;
    advanceAfterSubRoundFailure();
    return;
  }

  game.lifeStageIndex += 1;
  if (game.lifeStageIndex > LIFE_STAGES_PER_SUBROUND) {
    game.NARR = game.LAST_RESOLVE.narrative;
    advanceAfterSubRoundSuccess();
    return;
  }

  game.EVENT = rndEvent(game.EVENT?.id);
  game.LIFE_RES = null;
  game.LIFE_PRED = null;
  game.PHASE = 'life';
  render();
}

export function continueAfterSubRound() {
  if (game.PHASE !== 'subRoundEnd') return;
  goToNextCrossOrRound();
}

export function finishRoundSummary() {
  if (game.PHASE !== 'roundEnd') return;
  const br = game.ST.breedRound || 1;
  game.ST.breedRound = br >= 5 ? 1 : br + 1;
  resetRoundSession();
  resetSession();
  savePersisted();
  render();
}

export function resetAll() {
  LS.clear();
  reloadPersistedState();
  resetRoundSession();
  resetSession();
  render();
}
