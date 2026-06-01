import {
  RESOURCE_SOFT_CAP,
  PASSES_PER_CROSS_SEQUENCE,
  SUB_ROUNDS_PER_ROUND,
  FORECAST_WIN_ACCURACY,
} from './constants.js';
import { game, savePersisted } from './state.js';
import { beginRoundTracking } from './round-tracker.js';

export const INTRO_STEP_COUNT = 5;

export const INTRO_STEPS = [
  {
    title: 'Species Survival Engine',
    body: 'Merge endangered founders into one living cohort. Your choices decide whether unique genetics persist or vanish.',
    icon: '🧬',
  },
  {
    title: 'One Game · Three Crosses',
    body: `Each <strong>Game</strong> runs <strong>${SUB_ROUNDS_PER_ROUND} animal crosses</strong>. Every cross walks four life stages — help each line survive birth through old age.`,
    icon: '🌍',
  },
  {
    title: 'Deploy · Forecast · Survive',
    body: 'Match conservation deploys to crises (✦ synergy). Then forecast <strong>survive</strong>, <strong>damage</strong>, or <strong>extinct</strong> — humility matters as much as tools.',
    icon: '🛡️',
  },
  {
    title: 'Be smart — or risk extinction',
    body: `Wrong deploys end lines. Honest collapse forecasts can earn a revival. At game end, guess-to-reality <strong>&gt;${FORECAST_WIN_ACCURACY}%</strong> = <strong>Winner</strong>.`,
    icon: '⚖️',
  },
  {
    title: 'Ready?',
    body: `You get <strong>${RESOURCE_SOFT_CAP} shared lab units</strong> per Game (not per cross). Deploy wisely, forecast honestly, and steward three crosses.`,
    icon: '🚀',
    isStart: true,
  },
];

export function nextGameNumber() {
  return (game.roundNumber || 0) + 1;
}

export function openIntroFull() {
  game.showIntro = true;
  game.introStep = 0;
}

export function openIntroStartPrompt() {
  game.showIntro = true;
  game.introStep = INTRO_STEP_COUNT - 1;
}

export function startNewGame() {
  game.ST.resources = RESOURCE_SOFT_CAP;
  game.roundNumber = nextGameNumber();
  game.ST.activeGameNumber = game.roundNumber;
  game.ST.activeGameStartedAt = Date.now();
  game.subRoundIndex = 1;
  game.roundActive = true;
  game.gameAwaitingStart = false;
  game.careMateLedgerPct = 0;
  game.bonusPassesNextSubRound = 0;
  game.roundPointsSnapshot = game.ST.points || 0;
  game.roundDeployStats = { total: 0, wrong: 0 };
  game.devilShownThisRound = false;
  game.isDevilMarked = false;
  game.showDevilModal = false;
  game.crossPassesRemaining = PASSES_PER_CROSS_SEQUENCE[0];
  game.SEL_PARENT_A = game.SEL_PARENT_B = null;
  game.HYBRID = null;
  game.PHASE = 'select';
  game.showIntro = false;
  if (!game.ST.tutorialDone) game.ST.tutorialDone = true;
  beginRoundTracking();
  savePersisted();
}

export function declineStartGame() {
  game.showIntro = false;
  game.gameAwaitingStart = true;
}

export function introStepIndex() {
  return Math.min(INTRO_STEP_COUNT - 1, Math.max(0, game.introStep || 0));
}
