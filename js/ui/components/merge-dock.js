import { game } from '../../core/state.js';
import { mergeBlockReason, previewBlend } from '../../core/breeding.js';
import { founderPortrait } from '../visuals/creature-visuals.js';
import { scoreColor } from '../../core/game-logic.js';

export function mergeDockHtml(canMerge, mergeLabel, { popup = false } = {}) {
  const A = game.SEL_PARENT_A;
  const B = game.SEL_PARENT_B;
  const preview =
    A && B && !mergeBlockReason(A, B, game.ST.extinctions)
      ? previewBlend(A, B)
      : null;
  const viabPct = preview
    ? Math.round((preview.scoreMin + preview.scoreMax) / 2)
    : null;
  const viabCol = viabPct != null ? scoreColor(viabPct) : 'var(--text3)';

  const slotA = A
    ? `<div class="merge-slot merge-slot-a">
        ${founderPortrait(A, { size: 'md', slot: 'a', animate: true })}
        <div class="merge-slot-name">${A.individual.displayName}</div>
        <div class="merge-slot-species">${A.species.name}</div>
      </div>`
    : `<div class="merge-slot merge-slot-empty"><span class="merge-slot-ph">Founder A</span></div>`;

  const slotB = B
    ? `<div class="merge-slot merge-slot-b">
        ${founderPortrait(B, { size: 'md', slot: 'b', animate: true })}
        <div class="merge-slot-name">${B.individual.displayName}</div>
        <div class="merge-slot-species">${B.species.name}</div>
      </div>`
    : `<div class="merge-slot merge-slot-empty"><span class="merge-slot-ph">Founder B</span></div>`;

  const dock = `<div class="merge-bridge-dock glass-panel${popup ? ' merge-bridge-dock-popup' : ''}" aria-label="Founder merge bridge">
    ${slotA}
    <div class="merge-bridge-center">
      <div class="merge-bridge-visual" aria-hidden="true">
        <div class="merge-bridge-strand"></div>
        <div class="merge-bridge-core"></div>
      </div>
      ${viabPct != null ? `<div class="merge-viability" style="color:${viabCol}">${viabPct}% viability</div>` : '<div class="merge-viability merge-viability-idle">Select two founders</div>'}
    </div>
    ${slotB}
    <button type="button" class="btn-merge-bridge" ${canMerge ? 'data-action="merge"' : 'disabled'}>${mergeLabel}</button>
  </div>`;

  if (!popup) return dock;

  return `<div class="merge-dock-popup" role="dialog" aria-label="Merge founders">
    <div class="merge-dock-popup-backdrop" aria-hidden="true"></div>
    ${dock}
  </div>`;
}
