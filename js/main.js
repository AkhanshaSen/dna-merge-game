import { render } from './render.js';
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
  tutorialNext,
  tutorialPrev,
  dismissDevil,
} from './actions.js';
import { game, resetSession, savePersisted, resetRoundSession } from './state.js';

function uiResetSession() {
  resetRoundSession();
  resetSession();
  savePersisted();
  render();
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
  tutorialNext,
  tutorialPrev,
  dismissDevil,
  resetSession: uiResetSession,
  render,
});

if (!game.ST.tutorialDone) {
  game.showTutorial = true;
  game.tutorialStep = 0;
}

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
    case 'tutorial-next':
      tutorialNext();
      break;
    case 'tutorial-prev':
      tutorialPrev();
      break;
    case 'tutorial-done':
      dismissTutorial();
      break;
    case 'show-tutorial':
      showTutorial();
      break;
    case 'dismiss-devil':
      dismissDevil();
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
  if (action === 'tutorial-next') tutorialNext();
  else if (action === 'tutorial-prev') tutorialPrev();
  else if (action === 'tutorial-done') dismissTutorial();
});

render();
