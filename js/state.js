import { loadState, saveState } from './storage.js';
import { PASSES_PER_CROSS_SEQUENCE } from './constants.js';

/**
 * Mutable session + persisted snapshot (`game.ST`).
 */
export const game = {
  ST: loadState(),
  VIEW: 'lab',
  SEL_PARENT_A: null,
  SEL_PARENT_B: null,
  HYBRID: null,
  EVENT: null,
  PHASE: 'select',
  coachNote: null,

  /** Meta-round: one round = SUB_ROUNDS_PER_ROUND crosses */
  roundActive: false,
  roundNumber: 0,
  /** Current animal cross index 1–3 within the meta-round */
  subRoundIndex: 1,
  /** Deploy passes remaining for the active animal cross */
  crossPassesRemaining: PASSES_PER_CROSS_SEQUENCE[0],
  /** Stacking survival ledger bonus (%pts) granted after each full-life completion */
  careMateLedgerPct: 0,
  /** Granted at start of next cross (+ passes) */
  bonusPassesNextSubRound: 0,
  roundPointsSnapshot: 0,

  /** Current cross — life stage 1–4 */
  lifeStageIndex: 1,
  /** Narrative vitality 0–100 across birth→old age */
  healthMeter: 100,

  LIFE_RES: null,
  LIFE_PRED: null,
  LAST_RESOLVE: null,

  FINAL_NARR: '',
  NARR: '',

  /** Gene Lab filter: all | mammal | reptile | avian | terrestrial | marine | freshwater | compat */
  labFilter: 'all',

  /** life sub-step: null | receipt | triage | care */
  lifeSubStep: null,

  /** Intro / start-game overlay */
  showIntro: false,
  introStep: 0,
  /** Slide direction for intro animation: 1 next, -1 prev */
  introAnimDir: 1,
  /** Player must confirm Start Game before merge (lobby) */
  gameAwaitingStart: true,
  recordsFilter: 'all',

  DEF_PENALTY: 0,
  secretKey: null,

  /** Lab pool empty — forecast-only stages */
  gambitMode: false,
  /** Round-scoped deploy accuracy for devil marking */
  roundDeployStats: { total: 0, wrong: 0 },
  devilShownThisRound: false,
  isDevilMarked: false,
  showDevilModal: false,
  lastGambitDice: null,
  /** One extinction-revival per animal cross */
  revivalUsedThisCross: false,
  /** Cross outcomes for the active game (round) */
  roundCrossResults: [],
  /** Index into ST.predictions where this game began */
  roundPredictionsStartIndex: 0,
};

export function reloadPersistedState() {
  game.ST = loadState();
}

export function savePersisted() {
  saveState(game.ST);
}

/** Cleared between animal crosses inside the same meta-round */
export function resetCrossSession() {
  game.EVENT = null;
  game.LIFE_RES = null;
  game.LIFE_PRED = null;
  game.LAST_RESOLVE = null;
  game.lifeStageIndex = 1;
  game.healthMeter = 100;
  game.FINAL_NARR = '';
  game.NARR = '';
  game.lifeSubStep = null;
  game.DEF_PENALTY = 0;
  game.secretKey = null;
  game.gambitMode = false;
  game.lastGambitDice = null;
  game.revivalUsedThisCross = false;
  game.crossEndTier = null;
}

/** Cleared when finishing a meta-round summary */
export function resetRoundSession() {
  game.roundActive = false;
  game.roundNumber = 0;
  game.subRoundIndex = 1;
  game.crossPassesRemaining = PASSES_PER_CROSS_SEQUENCE[0];
  game.careMateLedgerPct = 0;
  game.bonusPassesNextSubRound = 0;
  game.roundPointsSnapshot = 0;
  game.roundDeployStats = { total: 0, wrong: 0 };
  game.devilShownThisRound = false;
  game.isDevilMarked = false;
  game.showDevilModal = false;
  game.gambitMode = false;
  game.gameAwaitingStart = true;
  game.showIntro = false;
  game.introStep = 0;
}

export function resetSession() {
  game.coachNote = null;
  game.SEL_PARENT_A = game.SEL_PARENT_B = game.HYBRID = null;
  game.PHASE = 'select';
  game.FINAL_NARR = game.NARR = '';
  resetCrossSession();
}
