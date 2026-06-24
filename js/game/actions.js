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
  GENEFIX_COST,
  CARE_PERKS,
  GAMBIT_FORECAST_PTS_OK,
  GAMBIT_FORECAST_PTS_MISS,
  FULL_LIFE_LAB_BONUS,
  CROSS_LAB_STIPEND,
  MIN_LAB_FOR_DEPLOY,
  CROSS_STEWARDSHIP_BONUS_PTS,
} from '../core/constants.js';
import { findFounder } from '../core/species.js';
import { LS } from '../core/storage.js';
import { fbHybrid, fbNarrative, fbVerdict, fbCrossEndNarr } from '../core/fallbacks.js';
import {
  blendTraits,
  avgScore,
  mergePairKey,
  mergeBlockReason,
  rollHybridDefect,
  applyTraitDriftToHybrid,
} from '../core/breeding.js';
import {
  rndEvent,
  rollOutcome,
  generateSecretKey,
  resolveStageVitality,
  rollGambitFate,
  applyGambitVitality,
} from '../core/game-logic.js';
import {
  canAffordDeploy,
  syncGambitMode,
  deductDeployCost,
  trackDeployChoice,
  triggerDevilIfNeeded,
  applyStewardshipRefund,
  deployLabCost,
  applyCrossLabStipend,
} from '../core/resource-economy.js';
import { setCoachForPhase } from '../content/coach-hints.js';
import { applyCampaignEventImpact, campaignForSlot } from '../core/campaign.js';
import { checkAchievements } from '../content/achievements.js';
import { showToast } from '../content/toast.js';
import {
  game,
  resetSession,
  reloadPersistedState,
  savePersisted,
  resetRoundSession,
  resetCrossSession,
} from '../core/state.js';
import { render } from '../ui/render/index.js';
import { canonicalCorrectResource, survivalRateLifeStage, dicePhaseForLifeStage } from '../core/life-round-logic.js';
import {
  isDeployCorrectForCrisis,
  isObserveDeploy,
  isImproviseDeploy,
} from '../core/deploy-match.js';
import {
  isRevivalEligible,
  applyExtinctionRevival,
  revivalWouldCompleteCross,
} from '../core/extinction-revival.js';
import { recordCrossOutcome } from './round-tracker.js';
import { evaluateCrossEnd, CROSS_TIER } from '../core/cross-outcomes.js';
import { archiveCompletedGame } from '../content/history-groups.js';
import {
  startNewGame,
  declineStartGame,
  openIntroFull,
  openIntroStartPrompt,
  introStepIndex,
  INTRO_STEP_COUNT,
} from './game-intro.js';
import { markHintSeen } from '../content/player-guide.js';

function clampResource(n) {
  return Math.min(Math.max(0, n), RESOURCE_SOFT_CAP);
}

function clampPoints(n) {
  return Math.min(Math.max(0, Math.floor(n)), FORECAST_POINTS_SOFT_CAP);
}

function markGuideHint(hintId) {
  if (markHintSeen(game.ST, hintId)) savePersisted();
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

/** Game must be started via Start Game; merge only continues an active game. */
function ensureRoundBudget() {
  if (!game.roundActive) return;
}

export function dismissDevil() {
  game.showDevilModal = false;
  render();
}

export function switchView(v) {
  game.VIEW = v;
  document.querySelectorAll('.tb, .nav-item').forEach((t) => {
    const match = t.dataset.v === v;
    t.classList.toggle('on', match);
  });
  render();
}

export function setLabFilter(filter) {
  game.labFilter = filter || 'all';
  render();
}

export function dismissTutorial() {
  game.ST.tutorialDone = true;
  game.showIntro = false;
  savePersisted();
  render();
}

export function confirmStartGame() {
  if (!game.gameAwaitingStart && game.roundActive) return;
  markGuideHint('welcomeLobby');
  startNewGame();
  setCoachForPhase('game-active');
  showToast(
    {
      title: `Game ${game.roundNumber} begins`,
      body: 'Pick two founders and merge to begin your first cross.',
      variant: 'good',
    },
    4200,
  );
  savePersisted();
  render();
}

export function cancelStartGame() {
  declineStartGame();
  setCoachForPhase('lobby');
  render();
}

export function openStartGamePrompt() {
  openIntroStartPrompt();
  render();
}

export function dismissStageReceipt() {
  if (game.lifeSubStep !== 'receipt') return;
  markGuideHint('firstReceipt');
  if (isRevivalEligible(game.LAST_RESOLVE)) {
    game.lifeSubStep = 'revival';
    setCoachForPhase('revival', { resolve: game.LAST_RESOLVE });
    render();
    return;
  }
  proceedAfterReceiptCore();
}

export function acceptExtinctionRevival() {
  if (game.lifeSubStep !== 'revival' || !isRevivalEligible(game.LAST_RESOLVE)) return;
  const lr = game.LAST_RESOLVE;
  const name = game.HYBRID?.name || 'the cohort';
  const result = applyExtinctionRevival();
  game.lifeSubStep = null;
  game.LAST_RESOLVE = null;

  driftAfterStage();

  if (revivalWouldCompleteCross()) {
    showToast(
      {
        title: 'Extinction averted',
        body: `+${result.labAdded} lab units · ${name} completes this cross on borrowed time.`,
        variant: 'good',
      },
      4200,
    );
    logLifeBeat({
      event: game.EVENT?.name || 'crisis',
      res: 'Foreseen revival',
      out: 'revived',
      detail: `revival +${result.labAdded} lab · cross completed at stage ${result.stageBefore}`,
    });
    savePersisted();
    game.NARR = `You read the collapse coming — and earned one last chance. ${name} limps through old age with renewed lab support.`;
    routeCrossEnd(lr);
    return;
  }

  game.lifeStageIndex += 1;
  const stageAfter = game.lifeStageIndex;

  showToast(
    {
      title: 'Extinction averted',
      body: `+${result.labAdded} lab units · vitality restored · advancing to life stage ${stageAfter}.`,
      variant: 'good',
    },
    4200,
  );

  logLifeBeat({
    event: game.EVENT?.name || 'crisis',
    res: 'Foreseen revival',
    out: 'revived',
    detail: `revival +${result.labAdded} lab · stage ${result.stageBefore}→${stageAfter}`,
  });
  savePersisted();
  maybeOfferTriage();
  if (game.lifeSubStep === 'triage') {
    setCoachForPhase('triage');
    render();
    return;
  }
  maybeOfferCarePerk();
  if (game.lifeSubStep === 'care') {
    setCoachForPhase('care');
    render();
    return;
  }

  maybeRollSecretKey();
  game.EVENT = applyCampaignEventImpact(rndEvent(game.EVENT?.id), game.ST.breedRound);
  game.LIFE_RES = null;
  game.LIFE_PRED = null;
  syncGambitMode();
  setCoachForPhase(game.gambitMode ? 'life-gambit' : 'life');
  render();
}

export function declineExtinctionRevival() {
  if (game.lifeSubStep !== 'revival') return;
  game.lifeSubStep = null;
  proceedAfterReceiptCore();
}

export function triageAcceptDefect() {
  if (game.lifeSubStep !== 'triage') return;
  game.lifeSubStep = null;
  setCoachForPhase('life');
  maybeOfferCarePerk();
  render();
}

export function triageCureDefect() {
  if (game.lifeSubStep !== 'triage' || !game.HYBRID?.defect) return;
  if (game.ST.resources < GENEFIX_COST) {
    showToast(
      { title: 'Insufficient resources', body: `Gene therapy costs ${GENEFIX_COST} conservation units.`, variant: 'warn' },
      4000,
    );
    return;
  }
  game.ST.resources = clampResource(game.ST.resources - GENEFIX_COST);
  syncGambitMode();
  game.HYBRID.defectCured = true;
  game.DEF_PENALTY = 0;
  game.lifeSubStep = null;
  savePersisted();
  showToast({ title: 'Defect treated', body: 'Gene therapy eased the genetic burden.', variant: 'good' }, 4200);
  setCoachForPhase('life');
  maybeOfferCarePerk();
  render();
}

export function pickCarePerk(perkId) {
  const perk = CARE_PERKS.find((p) => p.id === perkId);
  if (!perk || game.lifeSubStep !== 'care') return;
  game.HYBRID.carePerk = perk;
  if (perk.health) game.healthMeter = Math.min(100, game.healthMeter + perk.health);
  game.lifeSubStep = null;
  game.lifeStageIndex += 1;
  maybeRollSecretKey();
  game.EVENT = applyCampaignEventImpact(rndEvent(game.EVENT?.id), game.ST.breedRound);
  game.LIFE_RES = null;
  game.LIFE_PRED = null;
  game.PHASE = 'life';
  syncGambitMode();
  setCoachForPhase(game.gambitMode ? 'life-gambit' : 'life');
  render();
}

export function setRecordsFilter(f) {
  game.recordsFilter = f || 'all';
  render();
}

export function showTutorial() {
  openIntroFull();
  render();
}

export function introNext() {
  const idx = introStepIndex();
  if (idx >= INTRO_STEP_COUNT - 1) return;
  game.introAnimDir = 1;
  game.introStep = idx + 1;
  render();
}

export function introPrev() {
  game.introAnimDir = -1;
  game.introStep = Math.max(0, introStepIndex() - 1);
  render();
}

export function introSkipToStart() {
  game.introAnimDir = 1;
  openIntroStartPrompt();
  render();
}

/** @deprecated alias */
export function tutorialNext() {
  introNext();
}

export function tutorialPrev() {
  introPrev();
}

export function pick(individualId) {
  if (game.gameAwaitingStart) {
    showToast(
      { title: 'Start Game first', body: 'Tap Start Game to load lab resources and begin Cross 1.', variant: 'warn' },
      3600,
    );
    if (!game.showIntro) openIntroStartPrompt();
    render();
    return;
  }
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
  if (game.gameAwaitingStart || !game.roundActive) {
    showToast(
      { title: 'Start Game first', body: 'Begin a Game before merging founders.', variant: 'warn' },
      3600,
    );
    if (!game.showIntro) openIntroStartPrompt();
    render();
    return;
  }
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

    const sameSp = A.species.id === B.species.id;
    const defect = rollHybridDefect(sameSp, game.ST.breedRound);
    game.DEF_PENALTY = defect ? 6 : 0;

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
      sameSpeciesRenewal: sameSp,
      defect,
      defectCured: false,
      carePerk: null,
      carePerkOffered: false,
    };

    game.ST.hybrids.push({ id: game.HYBRID.id, name: game.HYBRID.name });
    savePersisted();
    checkAchievements(game, 'hybrid_created');
    const rawEv = rndEvent();
    game.EVENT = applyCampaignEventImpact(rawEv, game.ST.breedRound);
    game.PHASE = 'hybrid';
    setCoachForPhase('hybrid');
  } catch (e) {
    console.error(e);
    game.PHASE = 'select';
  }
  render();
}

/** From hybrid briefing → first life-stage screen */
export function beginLifeStage() {
  if (!game.HYBRID) return;
  markGuideHint('firstMerge');
  markGuideHint('pickFounders');
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
  if (!game.EVENT) {
    game.EVENT = applyCampaignEventImpact(rndEvent(), game.ST.breedRound);
  }
  game.lifeSubStep = null;
  game.revivalUsedThisCross = false;
  const stipend = applyCrossLabStipend();
  syncGambitMode();
  if (stipend > 0) {
    showToast(
      {
        title: 'Field resupply',
        body: `Cross ${game.subRoundIndex}: +${stipend} lab units (minimum ${CROSS_LAB_STIPEND} per cross · ${RESOURCE_SOFT_CAP} round cap).`,
        variant: 'good',
      },
      4000,
    );
    game.coachNote = {
      kind: 'good',
      text: `<strong>Shared round budget.</strong> Lab is pooled across all ${SUB_ROUNDS_PER_ROUND} crosses (max ${RESOURCE_SOFT_CAP}). You were empty — field teams delivered <strong>+${stipend}</strong> so this cross can still deploy. Gambit remains if you run dry again.`,
    };
  } else {
    setCoachForPhase(game.gambitMode ? 'life-gambit' : 'life');
  }
  markGuideHint('firstLifeStage');
  render();
}

function maybeOfferCarePerk() {
  const idx = game.lifeStageIndex;
  if (game.HYBRID?.carePerkOffered || idx < 2 || idx >= LIFE_STAGES_PER_SUBROUND) return;
  if (game.HYBRID.outcome === 'extinct') return;
  game.HYBRID.carePerkOffered = true;
  game.lifeSubStep = 'care';
}

function maybeOfferTriage() {
  if (!game.HYBRID?.defect || game.HYBRID.defectCured) return;
  if (game.lifeStageIndex < 2) return;
  game.lifeSubStep = 'triage';
}

function maybeRollSecretKey() {
  const camp = campaignForSlot(game.ST.breedRound);
  if (!camp.secretKeys || game.lifeStageIndex !== LIFE_STAGES_PER_SUBROUND) return;
  if (game.secretKey) return;
  game.secretKey = generateSecretKey();
  game.secretKey.applied = true;
}

function driftAfterStage() {
  const idx = game.lifeStageIndex;
  const minMag = idx <= 1 ? 1 : idx === 2 ? 2 : 3;
  const maxMag = idx <= 1 ? 2 : idx === 2 ? 4 : 6;
  applyTraitDriftToHybrid(game.HYBRID, minMag, maxMag);
  game.HYBRID.score = avgScore(game.HYBRID.traits);
}

function proceedAfterReceiptCore() {
  const lr = game.LAST_RESOLVE;
  game.lifeSubStep = null;

  if (!lr?.resourceOk) {
    advanceAfterSubRoundFailure();
    return;
  }

  if (game.healthMeter <= 0) {
    game.NARR = lr?.narrative || '';
    advanceAfterSubRoundFailure();
    return;
  }

  driftAfterStage();
  maybeOfferTriage();
  if (game.lifeSubStep === 'triage') {
    setCoachForPhase('triage');
    render();
    return;
  }

  if (game.lifeStageIndex >= LIFE_STAGES_PER_SUBROUND) {
    game.NARR = lr.narrative;
    routeCrossEnd(lr);
    return;
  }

  maybeOfferCarePerk();
  if (game.lifeSubStep === 'care') {
    setCoachForPhase('care');
    render();
    return;
  }

  game.lifeStageIndex += 1;
  maybeRollSecretKey();
  game.EVENT = applyCampaignEventImpact(rndEvent(game.EVENT?.id), game.ST.breedRound);
  game.LIFE_RES = null;
  game.LIFE_PRED = null;
  game.PHASE = 'life';
  syncGambitMode();
  setCoachForPhase(game.gambitMode ? 'life-gambit' : 'life');
  render();
}

export function pickLifeResource(id) {
  if (game.gambitMode && id !== 'observe') return;
  const res = RESOURCES.find((r) => r.id === id) || null;
  if (!res || res.type === 'cure') return;
  if (res.type === 'observe') {
    game.LIFE_RES = res;
    game.LIFE_PRED = null;
    setCoachForPhase('life-observe');
    markGuideHint('firstDeploy');
    render();
    return;
  }
  if (!canAffordDeploy(res, game.ST.resources)) {
    showToast(
      { title: 'Insufficient lab resources', body: `Need ${deployLabCost(res)} units for ${res.name}.`, variant: 'warn' },
      3800,
    );
    return;
  }
  game.LIFE_RES = res;
  game.LIFE_PRED = null;
  setCoachForPhase('life-deploy');
  markGuideHint('firstDeploy');
  render();
}

export function pickLifePred(pred) {
  if (pred !== 'survive' && pred !== 'damage' && pred !== 'extinct') return;
  if (!game.gambitMode && !game.LIFE_RES) {
    showToast(
      { title: 'Pick a deploy first', body: 'Select a conservation deploy (or Just Monitor) before forecasting.', variant: 'warn' },
      3200,
    );
    return;
  }
  game.LIFE_PRED = pred;
  setCoachForPhase('life-forecast');
  markGuideHint('firstForecast');
  render();
}

export function dismissContextHint(hintId) {
  if (!hintId) return;
  markGuideHint(hintId);
  render();
}

function logLifeBeat(extra) {
  game.ST.log.push({
    name: game.HYBRID.name,
    cycle: game.lifeStageIndex,
    gameNumber: game.roundNumber || null,
    crossIndex: game.subRoundIndex,
    stage: game.lifeStageIndex,
    ts: Date.now(),
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
    gameNumber: game.roundNumber || null,
    crossIndex: game.subRoundIndex,
    stage: game.lifeStageIndex,
    ts: Date.now(),
    slot: 0,
    pts,
  });
}

function finishSubRoundEnd(tier, finalNarr) {
  game.crossEndTier = tier;
  game.FINAL_NARR = finalNarr;
  savePersisted();
  game.PHASE = 'subRoundEnd';
  render();
}

function routeCrossEnd(lr) {
  const { tier, forecast, rolled } = evaluateCrossEnd(lr);
  switch (tier) {
    case CROSS_TIER.FULL_LIFE:
      advanceAfterSubRoundFullLife(forecast, rolled);
      break;
    case CROSS_TIER.PARTIAL_ARC:
      advanceAfterSubRoundPartial(forecast, rolled);
      break;
    case CROSS_TIER.WOUNDED_END:
      advanceAfterSubRoundWounded(forecast, rolled);
      break;
    default:
      advanceAfterSubRoundFailure();
  }
}

function advanceAfterSubRoundFailure() {
  recordCrossOutcome(CROSS_TIER.EXTINCT);
  game.HYBRID.outcome = 'extinct';
  game.ST.extinctions.push(extinctionPayload());
  finishSubRoundEnd(CROSS_TIER.EXTINCT, fbVerdict(game.HYBRID.name, 'extinct'));
}

function advanceAfterSubRoundFullLife(forecast, rolled) {
  recordCrossOutcome(CROSS_TIER.FULL_LIFE, { forecast, rolled });
  game.HYBRID.outcome = 'survive';
  game.careMateLedgerPct += CARE_MATE_BONUS_PER_FULL_LIFE;
  game.bonusPassesNextSubRound += 2;
  game.ST.fame.push(famePayload());
  game.ST.resources = clampResource(game.ST.resources + FULL_LIFE_LAB_BONUS);
  game.ST.points = clampPoints(game.ST.points + CROSS_STEWARDSHIP_BONUS_PTS);
  checkAchievements(game, 'full_life');
  checkAchievements(game, 'fame');
  const narr = fbCrossEndNarr(game.HYBRID.name, CROSS_TIER.FULL_LIFE, forecast, rolled);
  const bonus = ` Stewardship bonus: <strong>+${CROSS_STEWARDSHIP_BONUS_PTS} pts</strong>.`;
  finishSubRoundEnd(
    CROSS_TIER.FULL_LIFE,
    `${narr} Care+mate legacy: <strong>+${CARE_MATE_BONUS_PER_FULL_LIFE}%pts</strong> toward survival in later crosses this game, and <strong>+2 deploy passes</strong> banked toward the next cross.${bonus}`,
  );
}

function advanceAfterSubRoundPartial(forecast, rolled) {
  recordCrossOutcome(CROSS_TIER.PARTIAL_ARC, { forecast, rolled });
  game.HYBRID.outcome = 'damage';
  finishSubRoundEnd(CROSS_TIER.PARTIAL_ARC, fbCrossEndNarr(game.HYBRID.name, CROSS_TIER.PARTIAL_ARC, forecast, rolled));
}

function advanceAfterSubRoundWounded(forecast, rolled) {
  recordCrossOutcome(CROSS_TIER.WOUNDED_END, { forecast, rolled });
  game.HYBRID.outcome = 'damage';
  finishSubRoundEnd(CROSS_TIER.WOUNDED_END, fbCrossEndNarr(game.HYBRID.name, CROSS_TIER.WOUNDED_END, forecast, rolled));
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
  const lab = Number(game.ST.resources) || 0;
  const depleted = lab < MIN_LAB_FOR_DEPLOY;
  game.coachNote = {
    kind: depleted ? 'warn' : 'good',
    text: depleted
      ? `🧷 Cross ${game.subRoundIndex}/${SUB_ROUNDS_PER_ROUND} — lab at <strong>${lab}</strong> (pooled round budget). Merge founders: starting life grants <strong>+${CROSS_LAB_STIPEND}</strong> resupply if still below ${CROSS_LAB_STIPEND}, or play <strong>gambit / monitor</strong> stages.`
      : `🧷 Cross ${game.subRoundIndex}/${SUB_ROUNDS_PER_ROUND} — care+mate ledger <strong>+${game.careMateLedgerPct}%pts</strong> · lab <strong>${lab}/${RESOURCE_SOFT_CAP}</strong>`,
  };
  render();
}

async function finishStageReceipt() {
  game.PHASE = 'cycling';
  render();
  await new Promise((r) => setTimeout(r, 420));
  game.lifeSubStep = 'receipt';
  triggerDevilIfNeeded();
  setCoachForPhase('receipt', { resolve: game.LAST_RESOLVE });
  game.PHASE = 'life';
  render();
}

/** Monitor only — 0 lab, dice + forecast (weaker than full deploy) */
async function resolveObserveLifeCycle() {
  const pred = game.LIFE_PRED;
  const ev = game.EVENT;
  const h = game.HYBRID;
  if (!pred || !ev || !h) return;

  const fate = rollGambitFate(h.score);
  game.lastGambitDice = fate;
  const healthBefore = game.healthMeter;
  const vit = applyGambitVitality(healthBefore, fate.rolled, pred);
  game.healthMeter = vit.health;
  const guessOk = vit.guessOk;
  const pts = guessOk ? GAMBIT_FORECAST_PTS_OK : GAMBIT_FORECAST_PTS_MISS;
  game.ST.points = clampPoints(game.ST.points + pts);
  pushPredictionRow(pred, fate.rolled, pts);
  checkAchievements(game, 'forecast');

  game.LAST_RESOLVE = {
    gambit: true,
    observe: true,
    resourceOk: true,
    partialDeploy: true,
    guessOk,
    pts,
    rolled: fate.rolled,
    pred,
    healthBefore,
    healthAfter: game.healthMeter,
    diceA: fate.diceA,
    diceB: fate.diceB,
    cohortWins: fate.cohortWins,
    chosenName: game.LIFE_RES?.name || 'Just Monitor',
    revivalEligible: guessOk && pred === 'extinct' && fate.rolled === 'extinct' && game.healthMeter <= 0,
    narrative: `You chose to watch rather than spend lab units. ${fate.cohortWins ? 'The cohort endured on its own.' : 'Nature pressed hard.'} ${fbNarrative(h.name, ev.name, fate.rolled, game.lifeStageIndex)}`,
  };

  logLifeBeat({
    event: ev.name,
    res: 'Monitor only',
    out: fate.rolled,
    detail: `observe · pts +${pts}`,
  });
  savePersisted();
  await finishStageReceipt();
}

/** Gambit: no deploy — dice + forecast only */
async function resolveGambitLifeCycle() {
  const pred = game.LIFE_PRED;
  const ev = game.EVENT;
  const h = game.HYBRID;
  if (!pred || !ev || !h) return;

  const fate = rollGambitFate(h.score);
  game.lastGambitDice = fate;
  const healthBefore = game.healthMeter;
  const vit = applyGambitVitality(healthBefore, fate.rolled, pred);
  game.healthMeter = vit.health;
  const guessOk = vit.guessOk;
  const pts = guessOk ? GAMBIT_FORECAST_PTS_OK : GAMBIT_FORECAST_PTS_MISS;
  game.ST.points = clampPoints(game.ST.points + pts);
  pushPredictionRow(pred, fate.rolled, pts);
  checkAchievements(game, 'forecast');

  const diceNote = fate.cohortWins
    ? `Nature's dice (${fate.fateRoll}% vs ${fate.threshold}%): the cohort held.`
    : `Nature's dice (${fate.fateRoll}% vs ${fate.threshold}%): crisis won this beat.`;

  game.LAST_RESOLVE = {
    gambit: true,
    resourceOk: null,
    guessOk,
    pts,
    rolled: fate.rolled,
    pred,
    healthBefore,
    healthAfter: game.healthMeter,
    diceA: fate.diceA,
    diceB: fate.diceB,
    cohortWins: fate.cohortWins,
    revivalEligible: guessOk && pred === 'extinct' && fate.rolled === 'extinct' && game.healthMeter <= 0,
    narrative: `${diceNote} ${fbNarrative(h.name, ev.name, fate.rolled, game.lifeStageIndex)}`,
  };

  logLifeBeat({
    event: ev.name,
    res: 'Gambit (no deploy)',
    out: fate.rolled,
    detail: `gambit · pts +${pts} · dice ${fate.diceA}+${fate.diceB}`,
  });
  savePersisted();
  await finishStageReceipt();
}

/** Resolve one life-stage beat */
export async function resolveLifeCycle() {
  if (game.PHASE !== 'life' || !game.HYBRID || !game.EVENT) return;
  syncGambitMode();

  if (game.crossPassesRemaining < 1) {
    showToast({ title: 'No deploy passes left', body: 'You exhausted passes for this animal cross.', variant: 'warn' }, 3600);
    return;
  }

  if (game.gambitMode) {
    if (isObserveDeploy(game.LIFE_RES)) {
      if (!game.LIFE_PRED) {
        showToast({ title: 'Forecast needed', body: 'Monitor mode still needs a survival forecast.', variant: 'warn' }, 3200);
        return;
      }
      game.crossPassesRemaining -= 1;
      await resolveObserveLifeCycle();
      return;
    }
    if (!game.LIFE_PRED) {
      showToast({ title: 'Forecast needed', body: 'Lab empty — pick how nature might treat this cohort.', variant: 'warn' }, 3200);
      return;
    }
    game.crossPassesRemaining -= 1;
    await resolveGambitLifeCycle();
    return;
  }

  const pred = game.LIFE_PRED;
  const chosenRes = game.LIFE_RES;
  if (!chosenRes) {
    showToast(
      { title: 'Pick a deploy first', body: 'Select a conservation deploy card before resolving this stage.', variant: 'warn' },
      3200,
    );
    return;
  }
  if (!pred) {
    showToast({ title: 'Forecast needed', body: 'Pick survive, damage, or extinct before resolving.', variant: 'warn' }, 3200);
    return;
  }
  if (!isObserveDeploy(chosenRes) && !canAffordDeploy(chosenRes, game.ST.resources)) {
    showToast({ title: 'Cannot afford deploy', body: 'Lab resources too low — gambit mode only.', variant: 'warn' }, 3600);
    syncGambitMode();
    render();
    return;
  }

  game.crossPassesRemaining -= 1;
  if (!isObserveDeploy(chosenRes)) deductDeployCost(chosenRes);

  const ev = game.EVENT;

  if (isObserveDeploy(chosenRes)) {
    await resolveObserveLifeCycle();
    return;
  }

  const correct = canonicalCorrectResource(ev);
  const resourceOk = isDeployCorrectForCrisis(ev, chosenRes, game.ST.resources);
  trackDeployChoice(ev, chosenRes, resourceOk);

  if (!resourceOk) {
    const guessOk = pred === 'extinct';
    const pts = guessOk ? MATRIX_WR_RG : MATRIX_WR_WG;
    const healthBefore = game.healthMeter;
    game.ST.points = clampPoints(game.ST.points + pts);
    pushPredictionRow(pred, 'extinct', pts);
    game.healthMeter = 0;
    game.LAST_RESOLVE = {
      resourceOk: false,
      guessOk,
      pts,
      pred,
      rolled: 'extinct',
      chosenName: chosenRes.name,
      correctName: correct.name,
      healthBefore,
      healthAfter: 0,
      revivalEligible: guessOk,
      narrative: `${ev.name}: wrong deploy — cohort collapses. Correct lever would have been <strong>${correct.emoji} ${correct.name}</strong>.`,
    };
    logLifeBeat({
      event: ev.name,
      res: chosenRes.name,
      out: 'extinct',
      detail: `matrix wrong resource · pts ${pts}`,
    });
    savePersisted();
    checkAchievements(game, 'forecast');
    triggerDevilIfNeeded();
    game.PHASE = 'cycling';
    render();
    await new Promise((r) => setTimeout(r, 380));
    game.lifeSubStep = 'receipt';
    setCoachForPhase('receipt', { resolve: game.LAST_RESOLVE });
    game.PHASE = 'life';
    render();
    return;
  }

  const idx = game.lifeStageIndex - 1;
  const partial = isImproviseDeploy(chosenRes);
  const rate = survivalRateLifeStage(ev, chosenRes, game.HYBRID, idx, game.careMateLedgerPct, 0);
  const dicePhase = dicePhaseForLifeStage(idx);
  const rawRoll = rollOutcome(rate, {
    dicePhase,
    sameSpeciesRenewal: !!game.HYBRID.sameSpeciesRenewal,
    correctDeploy: !partial,
  });
  const healthBefore = game.healthMeter;
  const vitality = resolveStageVitality(healthBefore, rawRoll, pred, game.HYBRID.score);
  game.healthMeter = vitality.health;
  const rolled = vitality.rolled;
  const guessOk = vitality.guessOk;
  const pts = guessOk ? MATRIX_RR_RG : MATRIX_RR_WG;
  game.ST.points = clampPoints(game.ST.points + pts);
  pushPredictionRow(pred, rolled, pts);
  checkAchievements(game, 'forecast');

  game.LAST_RESOLVE = {
    resourceOk: true,
    partialDeploy: partial,
    guessOk,
    pts,
    rolled,
    rawRoll: vitality.displayRoll,
    foughtBack: vitality.foughtBack,
    rate,
    pred,
    healthBefore,
    healthAfter: game.healthMeter,
    revivalEligible: guessOk && pred === 'extinct' && rolled === 'extinct' && game.healthMeter <= 0,
    correctName: correct.name,
    chosenName: chosenRes.name,
    narrative: partial
      ? `Improvised tools bought time — not perfect, but the line persists. ${fbNarrative(game.HYBRID.name, ev.name, rolled, game.lifeStageIndex, { foughtBack: vitality.foughtBack })}`
      : fbNarrative(game.HYBRID.name, ev.name, rolled, game.lifeStageIndex, {
          foughtBack: vitality.foughtBack,
        }),
  };

  const refund = applyStewardshipRefund(true, guessOk);
  if (refund > 0) {
    showToast(
      { title: 'Stewardship dividend', body: `Lab recovered ${refund} unit — deploy and forecast aligned.`, variant: 'good' },
      3600,
    );
  }

  logLifeBeat({
    event: ev.name,
    res: chosenRes.name,
    out: rolled,
    detail: `matrix right resource · pts +${pts} · roll ${rolled}${vitality.foughtBack ? ' · fought back' : ''} · lab −${deployLabCost(chosenRes)}`,
  });
  savePersisted();
  await finishStageReceipt();
}

export function continueAfterSubRound() {
  if (game.PHASE !== 'subRoundEnd') return;
  goToNextCrossOrRound();
}

export function finishRoundSummary() {
  if (game.PHASE !== 'roundEnd') return;
  checkAchievements(game, 'round_end');
  archiveCompletedGame();
  const br = game.ST.breedRound || 1;
  game.ST.breedRound = br >= 5 ? 1 : br + 1;
  resetRoundSession();
  resetSession();
  game.gameAwaitingStart = true;
  openIntroStartPrompt();
  setCoachForPhase('lobby');
  savePersisted();
  render();
}

export function resetAll() {
  LS.clear();
  reloadPersistedState();
  resetRoundSession();
  resetSession();
  game.gameAwaitingStart = true;
  openIntroFull();
  render();
}
