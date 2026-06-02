import { survivalRateLifeStage } from './life-round-logic.js';
import { synergyBonus } from './game-logic.js';
import {
  isDeployCorrectForCrisis,
  crisisHasSynergyDeploys,
  canAffordAnySynergyDeploy,
  isImproviseDeploy,
  isObserveDeploy,
} from './deploy-match.js';
import { revivalHintReason, isRevivalEligible } from './extinction-revival.js';
import { RESOURCE_SOFT_CAP, SUB_ROUNDS_PER_ROUND } from './constants.js';
import { game } from './state.js';

/** Approximate outcome bands from survival index (for player hints only) */
export function outlookBands(rate) {
  const r = Math.max(12, Math.min(94, Math.round(rate)));
  const survive = Math.round(r * 0.76);
  const damage = Math.round(r * 0.95) - survive;
  const extinct = Math.max(0, 100 - survive - damage);
  return { survive, damage, extinct, rate: r };
}

export function setCoachForPhase(phase, extra = {}) {
  const h = game.HYBRID;
  const name = h?.name || 'this cohort';

  if (phase === 'lobby') {
    game.coachNote = {
      kind: 'neutral',
      text: `<strong>Welcome.</strong> Tap <strong>Start Game</strong>, pick two founders, and merge. You get <strong>${RESOURCE_SOFT_CAP}</strong> shared lab units for ${SUB_ROUNDS_PER_ROUND} crosses.`,
    };
    return;
  }

  if (phase === 'game-active') {
    game.coachNote = {
      kind: 'good',
      text: `<strong>Game ${game.roundNumber} started.</strong> Pick two founders, merge, then guide each cross through 4 life stages.`,
    };
    return;
  }

  if (phase === 'select') {
    game.coachNote = {
      kind: 'neutral',
      text: '<strong>Step 1:</strong> Pick one compatible male and one female founder. Locked cards show pairings that cannot merge.',
    };
    return;
  }

  if (phase === 'hybrid') {
    game.coachNote = {
      kind: 'good',
      text: `<strong>${name}</strong> is ready. Next, help this line survive 4 life stages by choosing support and making your best forecasts.`,
    };
    return;
  }

  if (phase === 'life' && !game.lifeSubStep) {
    const ev = game.EVENT;
    const stage = game.lifeStageIndex || 1;
    game.coachNote = {
      kind: 'neutral',
      text: `Stage ${stage}/4. Pick the best help card for ${ev?.name || 'this crisis'}, then guess survive, damage, or extinct.`,
    };
    return;
  }

  if (phase === 'life-gambit') {
    game.coachNote = {
      kind: 'warn',
      text: `<strong>Low lab.</strong> You can choose Just Monitor or play forecast-only. Outcomes are riskier without full intervention.`,
    };
    return;
  }

  if (phase === 'life-observe') {
    const stage = game.lifeStageIndex || 1;
    const juvenile = stage >= 2;
    game.coachNote = {
      kind: 'neutral',
      text: juvenile
        ? `<strong>Just Monitor selected.</strong> You save lab for later. Now forecast what happens; this beat has no deploy bonus.`
        : `<strong>Just Monitor selected.</strong> You save lab this stage. Forecast the outcome, then nature decides the result.`,
    };
    return;
  }

  if (phase === 'life-deploy') {
    const ev = game.EVENT;
    const res = game.LIFE_RES;
    const syn = res ? synergyBonus(ev, res) : 0;
    const ok = ev && res ? isDeployCorrectForCrisis(ev, res, game.ST.resources) : false;
    if (isObserveDeploy(res)) return;
    if (isImproviseDeploy(res)) {
      const hasSyn = crisisHasSynergyDeploys(ev);
      const afford = canAffordAnySynergyDeploy(ev, game.ST.resources);
      game.coachNote = {
        kind: hasSyn && afford ? 'warn' : 'neutral',
        text:
          hasSyn && afford
            ? '<strong>You chose Improvise.</strong> A ✦ card was available and affordable, so this is a weaker option.'
            : '<strong>Good fallback.</strong> No ideal card was available (or affordable), so improvise keeps the line moving.',
      };
      return;
    }
    if (crisisHasSynergyDeploys(ev) && res && !ok) {
      game.coachNote = {
        kind: 'warn',
        text: '<strong>That card does not match the crisis.</strong> ✦ cards are usually safer picks and reduce collapse risk.',
      };
      return;
    }
    game.coachNote = {
      kind: ok ? 'good' : 'warn',
      text: ok
        ? `${res.emoji} <strong>${res.name}</strong> fits this crisis.${syn > 0 ? ` Synergy +${syn} improves survival odds.` : ''}`
        : '<strong>Careful:</strong> this help may be a poor match for the crisis.',
    };
    return;
  }

  if (phase === 'life-forecast') {
    const ev = game.EVENT;
    const res = game.LIFE_RES;
    const idx = (game.lifeStageIndex || 1) - 1;
    const rate = res && h ? survivalRateLifeStage(ev, res, h, idx, game.careMateLedgerPct, 0) : 50;
    const bands = outlookBands(rate);
    game.coachNote = {
      kind: 'neutral',
      text: `Make your best read. Current outlook is roughly <strong>${bands.survive}% survive</strong>, <strong>${bands.damage}% damaged</strong>, <strong>${bands.extinct}% extinct</strong>.`,
    };
    return;
  }

  if (phase === 'revival' && extra.resolve) {
    const lr = extra.resolve;
    game.coachNote = {
      kind: 'good',
      text: `<strong>You read collapse correctly.</strong> ${revivalHintReason(lr)}. You now have one revival option for this cross.`,
    };
    return;
  }

  if (phase === 'receipt' && extra.resolve) {
    const lr = extra.resolve;
    if (lr.gambit) {
      game.coachNote = {
        kind: lr.cohortWins ? 'good' : 'warn',
        text: lr.observe
          ? lr.cohortWins
            ? `Monitor-only result: ${name} held on. Your guess was ${lr.guessOk ? 'correct' : 'off'}, and no lab was spent.`
            : 'Monitor-only result: nature hit hard this stage.'
          : lr.cohortWins
            ? `${name} held in gambit mode. Your forecast was ${lr.guessOk ? 'correct' : 'off'}.`
            : 'Gambit result: the line lost this stage without full support.',
      };
      return;
    }
    if (lr.partialDeploy && !lr.gambit) {
      game.coachNote = {
        kind: lr.guessOk ? 'good' : 'warn',
        text: `Improvise was partial support. ${name} ${lr.rolled === 'extinct' ? 'could not hold this stage.' : 'is still in the game.'}`,
      };
      return;
    }
    if (isRevivalEligible(lr)) {
      game.coachNote = {
        kind: 'good',
        text: '<strong>Great read.</strong> You predicted extinction correctly. Review the revival offer if you want one rescue chance.',
      };
      return;
    }
    if (lr.resourceOk === false) {
      game.coachNote = {
        kind: 'warn',
        text: '<strong>Wrong deploy.</strong> The help did not match the crisis, so this line collapsed.',
      };
      return;
    }
    if (lr.foughtBack) {
      game.coachNote = {
        kind: 'good',
        text: `<strong>${name} survived a heavy hit.</strong> Vitality dropped, but the line can continue.`,
      };
      return;
    }
    if (lr.resourceOk && lr.rolled !== 'extinct' && game.healthMeter > 0) {
      game.coachNote = {
        kind: lr.guessOk ? 'good' : 'warn',
        text: lr.guessOk
          ? `Nice read. ${name} keeps going to the next stage.`
          : `Forecast missed, but your care choice still helped the line survive.`,
      };
      return;
    }
  }

  if (phase === 'triage') {
    game.coachNote = {
      kind: 'warn',
      text: 'Gene therapy can remove this defect, but it costs lab. Choose cure now or save resources for later stages.',
    };
    return;
  }

  if (phase === 'care') {
    game.coachNote = {
      kind: 'good',
      text: `Pick a care style for ${name}. Small care choices now can improve later survival odds.`,
    };
  }
}

export function ethicalHintBlock(type) {
  const blocks = {
    deploy: `<div class="ethics-hint anim-up">
      <span class="ethics-kicker">Deploy tip</span>
      <p>Pick the card that fits the crisis. Glowing ✦ cards are usually the best match.</p>
    </div>`,
    forecast: `<div class="ethics-hint anim-up">
      <span class="ethics-kicker">Forecast tip</span>
      <p>Guess what happens next. You are scored on reading nature, not on being psychic.</p>
    </div>`,
    vitality: `<div class="ethics-hint ethics-vitality anim-up">
      <span class="ethics-kicker">Vitality</span>
      <p>Health above zero means <strong>${game.HYBRID?.name || 'the line'}</strong> can keep going.</p>
    </div>`,
  };
  return blocks[type] || '';
}
