import { game } from '../../../core/state.js';

export function renderDevilModal() {
  let root = document.getElementById('devil-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'devil-root';
    document.body.appendChild(root);
  }
  if (!game.showDevilModal) {
    root.innerHTML = '';
    return;
  }
  root.innerHTML = `<div class="devil-overlay anim-up">
    <div class="devil-card">
      <div class="devil-em">😈</div>
      <div class="devil-title">Conservation Devil</div>
      <p class="devil-body">You had the hints — synergy glow, outlook bands, stewardship copy — and still starved these lines of the right intervention. <strong>Playing god poorly is worse than playing none.</strong></p>
      <p class="devil-sub">This mark lasts for the rest of this round. Align deploys with ✦ synergy or accept the consequences.</p>
      <button type="button" class="btn btn-d btn-lg" data-action="dismiss-devil">I understand →</button>
    </div>
  </div>`;
}
