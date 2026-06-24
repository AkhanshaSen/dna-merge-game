import { SUB_ROUNDS_PER_ROUND } from '../../../core/constants.js';
import { game } from '../../../core/state.js';
import { fbCrossEndUi } from '../../../core/fallbacks.js';
import { CROSS_TIER } from '../../../core/cross-outcomes.js';
import { campaignForSlot } from '../../../core/campaign.js';
import {
  roundForecastStats,
  roundCrossSummaryHtml,
  gameEndVerdictMessage,
} from '../../../game/round-tracker.js';
import { breedCampaignBanner } from '../../../content/cycle-meta.js';
import { hybridFromHybrid } from '../../visuals/creature-visuals.js';

export function renderSubRoundEnd(m) {
  const tier = game.crossEndTier || (game.HYBRID?.outcome === 'extinct' ? CROSS_TIER.EXTINCT : CROSS_TIER.FULL_LIFE);
  const name = game.HYBRID?.name || 'Line';
  const ui = fbCrossEndUi(name, tier);
  const titCls =
    tier === CROSS_TIER.FULL_LIFE ? 'cg' : tier === CROSS_TIER.EXTINCT || tier === CROSS_TIER.WOUNDED_END ? 'cr' : 'cw';
  const narrCls =
    tier === CROSS_TIER.FULL_LIFE ? 'ng' : tier === CROSS_TIER.EXTINCT || tier === CROSS_TIER.WOUNDED_END ? 'nr' : 'nw';
  m.innerHTML = `
    <div class="obanner ${ui.bannerCls}">
      ${hybridFromHybrid(game.HYBRID, { size: 'lg', animate: true, className: 'obanner-portrait', lifeStage: 4 })}
      <div class="obanner-text">
        <div class="otit ${titCls}">${ui.title}</div>
        <div class="osub">${ui.subtitle}</div>
      </div>
    </div>
    ${game.FINAL_NARR ? `<div class="narr ${narrCls} anim-up s1">${game.FINAL_NARR}</div>` : ''}
    <button type="button" class="btn btn-p btn-lg" data-action="continue-sub-round">${game.subRoundIndex >= SUB_ROUNDS_PER_ROUND ? 'See round summary →' : 'Next animal cross →'}</button>`;
}

export function renderRoundEnd(m) {
  const gained = Math.floor((game.ST.points || 0) - (game.roundPointsSnapshot || 0));
  const br = game.ST.breedRound ?? 1;
  const camp = campaignForSlot(br);
  const g = game.roundNumber || 1;
  const fc = roundForecastStats();
  const verdictCls = fc.isWinner ? 'round-verdict-winner' : 'round-verdict-loser';
  const verdictLabel = fc.total === 0 ? 'No forecasts' : fc.isWinner ? '🏆 Winner' : '💀 Loser';
  const verdictNote =
    fc.total === 0
      ? 'Make survival forecasts during life stages to score guess-to-reality. Winner also needs at least one full-life cross.'
      : fc.isWinner
        ? `Guess-to-reality <strong>${fc.pct}%</strong> — above ${fc.threshold}% with <strong>${fc.fullLife}</strong> full-life cross${fc.fullLife === 1 ? '' : 'es'}.`
        : `Guess-to-reality <strong>${fc.pct}%</strong> — need more than ${fc.threshold}% and at least one full-life cross to win.`;
  const gameVerdict = gameEndVerdictMessage();
  m.innerHTML = `
    <div class="card anim-up round-end-card">
      <div class="game-progress game-progress-end anim-up">
        <span class="game-progress-kicker">Game complete</span>
        <span class="game-progress-title">Game ${g} — all ${SUB_ROUNDS_PER_ROUND} crosses</span>
      </div>
      <div class="ctitle">🏁 Game ${g} summary</div>
      ${breedCampaignBanner(br)}
      <div class="round-verdict ${verdictCls} anim-up">
        <div class="round-verdict-label">${verdictLabel}</div>
        <div class="round-verdict-pct">${fc.total ? `${fc.pct}%` : '—'}</div>
        <div class="round-verdict-sub">Guess-to-reality · ${fc.correct}/${fc.total} forecasts matched</div>
        <p class="round-verdict-note">${verdictNote}</p>
        <p class="round-verdict-story anim-up s1">${gameVerdict}</p>
      </div>
      <div class="div">Cross outcomes</div>
      ${roundCrossSummaryHtml()}
      <p class="round-summary">
        Points this game: <strong class="round-pts">${gained >= 0 ? '+' : ''}${gained}</strong>
        · Lifetime: <strong>${Math.floor(Number(game.ST.points) || 0)}</strong><br/>
        Next campaign slot: <strong>${camp.label}</strong> — ${camp.desc}
      </p>
      <button type="button" class="btn btn-p btn-lg" data-action="finish-round">Return to Gene Lab · advance breed slot →</button>
    </div>`;
}