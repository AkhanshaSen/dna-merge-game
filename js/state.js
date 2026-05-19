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
}

export function resetSession() {
  game.coachNote = null;
  game.SEL_PARENT_A = game.SEL_PARENT_B = game.HYBRID = null;
  game.PHASE = 'select';
  game.FINAL_NARR = game.NARR = '';
  resetCrossSession();
}
