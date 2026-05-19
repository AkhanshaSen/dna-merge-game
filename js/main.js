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
  resetSession: uiResetSession,
  render,
});

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
    default:
      break;
  }
});

render();
