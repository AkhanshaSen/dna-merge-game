import { LIFE_STAGE_LABELS } from '../../../core/constants.js';
import { game } from '../../../core/state.js';
import { scoreColor } from '../../../core/game-logic.js';
import { lifeStageTimelineHtml } from '../../../content/cycle-meta.js';
import { renderGoalStrip, shouldShowHint, renderContextHint } from '../../../content/player-guide.js';
import { hybridFromHybrid } from '../../visuals/creature-visuals.js';
import { founderLabel, traitBarsHtml, defectCardHtml } from '../helpers.js';

export function renderHybrid(m) {
  const h = game.HYBRID;
  const sc = h.score;
  const col = scoreColor(sc);
  const verdict =
    sc >= 70
      ? 'Strong — crises should feel more manageable.'
      : sc >= 45
        ? 'OK — this line can survive, but rough crises can still hurt.'
        : 'Fragile — this line needs careful help to avoid collapse.';
  const pa = founderLabel(h.parentA);
  const pb = founderLabel(h.parentB);

  m.innerHTML = `<div class="card anim-up">
    <div class="ctitle">🎉 Breeding cohort synthesised</div>
    ${shouldShowHint('firstMerge', game.ST) ? renderContextHint('firstMerge') : ''}
    ${renderGoalStrip(game)}
    ${lifeStageTimelineHtml(1)}
    <div class="hhdr">
      ${hybridFromHybrid(h, { size: 'hero', animate: true, lifeStage: 1 })}
      <div class="hmeta">
        <div class="hnm">${h.name}</div>
        <div class="hpar">🧬 Parents · ${pa} × ${pb}<br/><span class="hpar-sub">${h.parentA.species.name}${
    h.parentA.species.id === h.parentB.species.id ? ' renewal line' : ' × ' + h.parentB.species.name
  }</span></div>
        <div class="sring-row">
          <div class="sring sring-dynamic" style="border-color:${col}">
            <div class="sring-n-dynamic" style="color:${col}">${sc}</div>
            <div class="l">Viability</div>
          </div>
          <div class="sverdict">${verdict}</div>
        </div>
      </div>
    </div>
    ${defectCardHtml(h)}
    ${h.bio ? `<div class="narr">${h.bio}</div>` : ''}
    <div class="div">Trait profile</div>
    ${traitBarsHtml(h.traits)}
    <div class="card-sm hybrid-next anim-up">
      <strong>Next:</strong> guide ${h.name} through 4 life stages. Pick help first, then guess the outcome.
    </div>
    <button type="button" class="btn btn-p btn-blk btn-lg btn-mt" data-action="begin-life-stage">Begin life arc — ${LIFE_STAGE_LABELS[0]} →</button>
  </div>`;
}