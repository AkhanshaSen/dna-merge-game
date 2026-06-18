import { render } from './render.js';
import { initScene } from './scene3d.js';
import {
  switchView,
  pick,
  startMerge,
  beginLifeStage,
  pickLifeResource,
  pickLifePred,
  resolveLifeCycle,
  continueAfterSubRound,
  finishRoundSummary,
  resetAll,
  setLabFilter,
  dismissTutorial,
  dismissStageReceipt,
  acceptExtinctionRevival,
  declineExtinctionRevival,
  triageAcceptDefect,
  triageCureDefect,
  pickCarePerk,
  setRecordsFilter,
  showTutorial,
  introNext,
  introPrev,
  introSkipToStart,
  confirmStartGame,
  cancelStartGame,
  openStartGamePrompt,
  dismissDevil,
  dismissContextHint,
} from './actions.js';
import { game, resetSession, savePersisted, resetRoundSession } from './state.js';
import { setCoachForPhase } from './coach-hints.js';
import { INTRO_STEP_COUNT } from './game-intro.js';

function uiResetSession() {
  resetRoundSession();
  resetSession();
  savePersisted();
  render();
}

function initLobby() {
  if (!game.roundActive) game.gameAwaitingStart = true;
  if (!game.ST.tutorialDone) {
    game.showIntro = true;
    game.introStep = 0;
  } else if (game.gameAwaitingStart) {
    game.showIntro = true;
    game.introStep = INTRO_STEP_COUNT - 1;
  }
  setCoachForPhase(game.gameAwaitingStart ? 'lobby' : 'select');
}

Object.assign(window, {
  switchView,
  pick,
  startMerge,
  beginLifeStage,
  pickLifeResource,
  pickLifePred,
  resolveLifeCycle,
  continueAfterSubRound,
  finishRoundSummary,
  resetAll,
  setLabFilter,
  dismissTutorial,
  dismissStageReceipt,
  acceptExtinctionRevival,
  declineExtinctionRevival,
  triageAcceptDefect,
  triageCureDefect,
  pickCarePerk,
  setRecordsFilter,
  showTutorial,
  introNext,
  introPrev,
  introSkipToStart,
  confirmStartGame,
  cancelStartGame,
  openStartGamePrompt,
  dismissDevil,
  dismissContextHint,
  resetSession: uiResetSession,
  render,
});

initLobby();
initScene();

document.getElementById('tabs').addEventListener('click', (e) => {
  const tb = e.target.closest('.tb');
  if (tb) switchView(tb.dataset.v);
});

document.getElementById('main').addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled || el.closest('.locked')) return;
  const { action } = el.dataset;
  switch (action) {
    case 'pick-founder':
      pick(el.dataset.founderId);
      break;
    case 'merge':
      startMerge();
      break;
    case 'begin-life-stage':
      beginLifeStage();
      break;
    case 'pick-life-res':
      pickLifeResource(el.dataset.resId);
      break;
    case 'pick-life-pred':
      pickLifePred(el.dataset.pred);
      break;
    case 'resolve-life-cycle':
      resolveLifeCycle();
      break;
    case 'continue-sub-round':
      continueAfterSubRound();
      break;
    case 'finish-round':
      finishRoundSummary();
      break;
    case 'switch-view':
      switchView(el.dataset.view);
      break;
    case 'reset-all-confirm':
      if (confirm('Reset ALL game data? Cannot be undone.')) resetAll();
      break;
    case 'lab-filter':
      setLabFilter(el.dataset.filter);
      break;
    case 'dismiss-receipt':
      dismissStageReceipt();
      break;
    case 'accept-extinction-revival':
      acceptExtinctionRevival();
      break;
    case 'decline-extinction-revival':
      declineExtinctionRevival();
      break;
    case 'triage-accept':
      triageAcceptDefect();
      break;
    case 'triage-cure':
      triageCureDefect();
      break;
    case 'pick-care-perk':
      pickCarePerk(el.dataset.perkId);
      break;
    case 'records-filter':
      setRecordsFilter(el.dataset.recordsFilter);
      break;
    case 'intro-next':
      introNext();
      break;
    case 'intro-prev':
      introPrev();
      break;
    case 'intro-skip':
      introSkipToStart();
      break;
    case 'start-game':
      confirmStartGame();
      break;
    case 'decline-start-game':
      cancelStartGame();
      break;
    case 'open-start-game':
      openStartGamePrompt();
      break;
    case 'show-tutorial':
      showTutorial();
      break;
    case 'dismiss-devil':
      dismissDevil();
      break;
    case 'dismiss-hint':
      dismissContextHint(el.dataset.hintId);
      break;
    default:
      break;
  }
});

document.body.addEventListener('click', (e) => {
  if (e.target.closest('#devil-root')) {
    const el = e.target.closest('[data-action]');
    if (el?.dataset.action === 'dismiss-devil') dismissDevil();
    return;
  }
  if (!e.target.closest('#tutorial-root')) return;
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action } = el.dataset;
  if (action === 'intro-next') introNext();
  else if (action === 'intro-prev') introPrev();
  else if (action === 'intro-skip') introSkipToStart();
  else if (action === 'start-game') confirmStartGame();
  else if (action === 'decline-start-game') cancelStartGame();
});

try {
  render();
} catch (err) {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = `<div class="card anim-up">
      <div class="ctitle">Unable to load game</div>
      <p class="settings-body">Something went wrong while loading this session. Please refresh the page. If the issue remains, open the browser console and share the error.</p>
    </div>`;
  }
  console.error(err);
}
