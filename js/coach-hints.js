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

  if (phase === 'select') {
    game.coachNote = {
      kind: 'neutral',
      text: `<strong>Why merge?</strong> You are the last hands on an extinction ledger. <strong>15 lab units</strong> must fund deploys across three crosses this round — spend wisely or face gambit (forecast-only) stages.`,
    };
    return;
  }

  if (phase === 'hybrid') {
    game.coachNote = {
      kind: 'good',
      text: `<strong>${name}</strong> exists because you chose hope over silence. Vitality is a living meter — wrong tools end a line, but <em>right care lets them fight back</em> even when your forecast is imperfect.`,
    };
    return;
  }

  if (phase === 'life' && !game.lifeSubStep) {
    const ev = game.EVENT;
    const stage = game.lifeStageIndex || 1;
    game.coachNote = {
      kind: 'neutral',
      text: `<strong>Playing god?</strong> Every deploy rewrites fate — reserves, vaccines, patrols. Nature still rolls the dice; you tilt the odds. Stage ${stage}/4: ${ev?.name || 'crisis'} tests whether ${name} can endure.`,
    };
    return;
  }

  if (phase === 'life-gambit') {
    game.coachNote = {
      kind: 'warn',
      text: `<strong>Lab empty — gambit mode.</strong> Pick <strong>Monitor Only</strong> (same dice path) or forecast-only gambit. ${name} survives or falls without full deploy leverage.`,
    };
    return;
  }

  if (phase === 'life-observe') {
    game.coachNote = {
      kind: 'neutral',
      text: `<strong>Monitor only.</strong> You are saving lab units — forecast how ${name} fares, then nature's dice decide. No deploy bonus; humility over hubris.`,
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
            ? `<strong>Improvised — not ideal.</strong> ✦ synergy deploys exist and you could afford one. Scrap tools still help, but the devil mark tracks wasted chances.`
            : `<strong>Best you could do.</strong> No perfect tool — or lab too tight. Improvise buys ${name} partial cover (+8) without pretending you had the right vaccine.`,
      };
      return;
    }
    if (crisisHasSynergyDeploys(ev) && res && !ok) {
      game.coachNote = {
        kind: 'warn',
        text: `<strong>The hints glowed — you ignored them.</strong> ✦ marked interventions that fit this crisis. Misaligned deploy wastes lab units and risks the devil mark this round.`,
      };
      return;
    }
    game.coachNote = {
      kind: ok ? 'good' : 'warn',
      text: ok
        ? `<strong>Stewardship aligned.</strong> ${res.emoji} ${res.name} answers this crisis — you are intervening where the wild no longer can. ${syn > 0 ? `Synergy +${syn} gives ${name} room to fight.` : ''}`
        : `<strong>Why this deploy?</strong> The cohort still depends on your choice. Compare the crisis story to each card — misaligned help wastes lab units.`,
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
      text: `<strong>Why guess?</strong> You cannot see the future — you model humility. With your deploy, outlook ≈ <strong>${bands.survive}% thrive</strong> · <strong>${bands.damage}% wounded</strong> · <strong>${bands.extinct}% collapse</strong>. Wrong forecasts still earn points if you kept them alive.`,
    };
    return;
  }

  if (phase === 'revival' && extra.resolve) {
    const lr = extra.resolve;
    game.coachNote = {
      kind: 'good',
      text: `<strong>You saw the end coming.</strong> Your forecast said <em>extinct</em> — and you were right. ${revivalHintReason(lr)}. The board rewards honest humility with <strong>+4 lab units</strong> and one revival this cross.`,
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
            ? `You watched and guessed ${lr.guessOk ? 'well' : 'wrong'} — ${name} endured without spending lab units.`
            : `Monitor-only beat: nature pressed hard. Sometimes the ethical choice is admitting limits.`
          : lr.cohortWins
            ? `Without deploys, ${name} still held — your forecast ${lr.guessOk ? 'was right' : 'missed'}, but the cohort fought on its own.`
            : `Nature won this gambit beat. No lab leverage — only humility and dice.`,
      };
      return;
    }
    if (lr.partialDeploy && !lr.gambit) {
      game.coachNote = {
        kind: lr.guessOk ? 'good' : 'warn',
        text: `Improvised care is imperfect — ${name} ${lr.rolled === 'extinct' ? 'could not hold' : 'still has a path forward'}. Partial tools beat paralysis.`,
      };
      return;
    }
    if (isRevivalEligible(lr)) {
      game.coachNote = {
        kind: 'good',
        text: `<strong>Honest forecast.</strong> You called extinction and nature agreed. Tap <em>Review revival offer</em> — the programme may restore the line if you read collapse without the resources to stop it.`,
      };
      return;
    }
    if (lr.resourceOk === false) {
      game.coachNote = {
        kind: 'warn',
        text: `<strong>Wrong deploy.</strong> The hints pointed elsewhere. Playing god poorly is worse than playing none.`,
      };
      return;
    }
    if (lr.foughtBack) {
      game.coachNote = {
        kind: 'good',
        text: `<strong>${name} refused to vanish.</strong> Your deploy held — the line took a brutal hit but vitality remains. Conservation is often damage control, not miracles.`,
      };
      return;
    }
    if (lr.resourceOk && lr.rolled !== 'extinct' && game.healthMeter > 0) {
      game.coachNote = {
        kind: lr.guessOk ? 'good' : 'warn',
        text: lr.guessOk
          ? `You read the wild correctly. ${name} marches on — the experiment earns trust one stage at a time.`
          : `Forecast missed, but <strong>care mattered more than prophecy</strong>. +${lr.pts} pts — the cohort survives your learning curve.`,
      };
      return;
    }
  }

  if (phase === 'triage') {
    game.coachNote = {
      kind: 'warn',
      text: `<strong>Vet ethics:</strong> Gene therapy spends scarce lab resources. Cure the defect and ease their path — or accept the burden and prove resilience anyway.`,
    };
    return;
  }

  if (phase === 'care') {
    game.coachNote = {
      kind: 'good',
      text: `<strong>Husbandry, not omnipotence.</strong> Pick how keepers will nurture ${name} before the next crisis — small daily choices stack into survival.`,
    };
  }
}

export function ethicalHintBlock(type) {
  const blocks = {
    deploy: `<div class="ethics-hint anim-up">
      <span class="ethics-kicker">Why intervene?</span>
      <p>Endangered lines do not heal themselves. Deploys are how humans admit complicity — and try to pay the debt. Match the ✦ synergy card when you can; otherwise <strong>Improvise</strong> or <strong>Monitor</strong>.</p>
    </div>`,
    forecast: `<div class="ethics-hint anim-up">
      <span class="ethics-kicker">Why forecast?</span>
      <p>You are not graded as a prophet. Guessing trains you to respect uncertainty — the same uncertainty wild populations face every season.</p>
    </div>`,
    vitality: `<div class="ethics-hint ethics-vitality anim-up">
      <span class="ethics-kicker">Vitality = the line fighting back</span>
      <p>Even with correct deploys, cohorts can be wounded. Vitality above zero means <strong>${game.HYBRID?.name || 'they'}</strong> still has a chance at the next stage.</p>
    </div>`,
  };
  return blocks[type] || '';
}
