import { game } from '../../core/state.js';
import { syncScene } from '../visuals/scene3d.js';
import { renderShell } from './shell.js';
import { renderIntroOverlay } from './modals/intro.js';
import { renderDevilModal } from './modals/devil.js';
import { renderSelect } from './views/lab.js';
import { renderHybrid } from './views/hybrid.js';
import { renderLifePhase } from './views/life.js';
import { renderLoading } from './views/loading.js';
import { renderSubRoundEnd, renderRoundEnd } from './views/round.js';
import { renderRecords } from './views/records.js';
import { renderHistory } from './views/history.js';
import { renderSettings } from './views/settings.js';

export function render() {
  renderShell();
  renderMain();
  renderIntroOverlay();
  renderDevilModal();
  syncScene(game);
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
