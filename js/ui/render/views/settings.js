import {
  SUB_ROUNDS_PER_ROUND,
  LIFE_STAGES_PER_SUBROUND,
  ROUND_RESOURCE_PASSES,
  RESOURCE_SOFT_CAP,
  FORECAST_WIN_ACCURACY,
} from '../../../core/constants.js';
import { game } from '../../../core/state.js';
import { campaignForSlot } from '../../../core/campaign.js';
import { settingsGuideHtml } from '../../../content/player-guide.js';
import { fmtRes } from '../helpers.js';

export function renderSettings(m) {
  const br = game.ST.breedRound ?? 1;
  const camp = campaignForSlot(br);
  m.innerHTML = `
    <div class="card anim-up">
      <div class="ctitle">📖 How to play</div>
      <div class="settings-body">${settingsGuideHtml({
        subRounds: SUB_ROUNDS_PER_ROUND,
        lifeStages: LIFE_STAGES_PER_SUBROUND,
        passes: ROUND_RESOURCE_PASSES,
        labCap: RESOURCE_SOFT_CAP,
        winPct: FORECAST_WIN_ACCURACY,
      })}</div>
    </div>
    <div class="card anim-up s2">
      <div class="settings-meta">
        Campaign: <strong>${camp.label}</strong> · Resources: <strong>${fmtRes(game.ST.resources)}</strong> · Breed slot: <strong>${br}/5</strong> · Points: <strong>${Math.floor(Number(game.ST.points) || 0)}</strong>
      </div>
      <button type="button" class="btn btn-s" data-action="show-tutorial" style="margin-bottom:.5rem">📖 Replay intro</button>
      <button type="button" class="btn btn-d" data-action="reset-all-confirm">🗑️ Reset all game data</button>
    </div>`;
}