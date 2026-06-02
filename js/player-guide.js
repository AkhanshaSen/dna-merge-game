import { FORECAST_WIN_ACCURACY, RESOURCE_SOFT_CAP, SUB_ROUNDS_PER_ROUND } from './constants.js';

export const INTRO_STEPS = [
  {
    title: 'Welcome, conservationist',
    subtitle: 'You are here to help endangered animals survive.',
    body: 'Pick founders, create one line, then guide that line through danger. Every choice can keep unique genetics alive.',
    icon: '🧬',
  },
  {
    title: 'Pick two parents',
    subtitle: 'Choose one compatible male and one female.',
    body: 'Use the Gene Lab to pick founder A and B. When the pair is compatible, merge them into one cohort to protect.',
    icon: '🧪',
  },
  {
    title: 'One game, three animal crosses',
    subtitle: 'Each game has three separate rescue attempts.',
    body: `You will protect <strong>${SUB_ROUNDS_PER_ROUND} animal crosses</strong>. Each cross walks four life stages: Birth, Juvenile, Adult, and Old age.`,
    icon: '🌍',
  },
  {
    title: 'Help first, then guess',
    subtitle: 'Simple rhythm every stage.',
    body: 'At each life stage, pick a help card for the crisis, then guess the outcome: survive, damaged, or extinct.',
    icon: '🛡️',
  },
  {
    title: 'Test your guessing power',
    subtitle: 'You are scored on reading nature honestly.',
    body: `Your guess-to-reality score rises when predictions match outcomes. Finish above <strong>${FORECAST_WIN_ACCURACY}%</strong> with strong care to win the game.`,
    icon: '🎯',
  },
  {
    title: 'Hints will guide you',
    subtitle: 'You do not need to memorize everything.',
    body: 'Cards with ✦ are usually your best fit. Coach tips appear as you play, and early hints appear only once to keep the flow clean.',
    icon: '💡',
  },
  {
    title: 'Ready to save a line?',
    subtitle: 'Start simple and learn while playing.',
    body: `You begin each game with <strong>${RESOURCE_SOFT_CAP} shared lab units</strong>. Help animals through crises and trust your instincts.`,
    icon: '🚀',
    isStart: true,
  },
];

export const CONTEXT_HINTS = {
  welcomeLobby: {
    icon: '👋',
    title: 'New here? Start with one simple goal',
    body: 'Pick two founders, merge them, then guide one animal through 4 stages. You do not need perfect guesses to learn fast.',
  },
  pickFounders: {
    icon: '🧬',
    title: 'Step 1: pick two founders',
    body: 'Choose one male and one female in a compatible animal group. Locked cards show pairings that cannot merge.',
  },
  firstMerge: {
    icon: '🐾',
    title: 'Step 2: your cohort is ready',
    body: 'This merged animal is your line to protect. Press Continue to enter life stages and begin decisions.',
  },
  firstLifeStage: {
    icon: '🧭',
    title: 'Life stage flow',
    body: 'Use this order every time: Pick help card -> Pick forecast -> Resolve stage.',
  },
  firstDeploy: {
    icon: '✦',
    title: 'Deploy tip',
    body: 'A glowing ✦ card usually fits the crisis best. If none fit, improvise or monitor to save lab.',
  },
  firstForecast: {
    icon: '🎯',
    title: 'Forecast tip',
    body: 'Make your best read: survive, damage, or extinct. The game rewards honest pattern reading over random guessing.',
  },
  firstReceipt: {
    icon: '📋',
    title: 'Receipt tip',
    body: 'Check what happened, points gained, and vitality left. If vitality stays above 0, the line can continue.',
  },
};

export function shouldShowHint(id, ST) {
  if (!id || !CONTEXT_HINTS[id]) return false;
  const seen = Array.isArray(ST?.hintsSeen) ? ST.hintsSeen : [];
  return !seen.includes(id);
}

export function isLearningMode(ST, liveGame = {}) {
  return shouldShowHint('firstReceipt', ST) || (liveGame.roundNumber || 0) <= 1;
}

export function markHintSeen(ST, id) {
  if (!id || !CONTEXT_HINTS[id]) return false;
  if (!Array.isArray(ST.hintsSeen)) ST.hintsSeen = [];
  if (ST.hintsSeen.includes(id)) return false;
  ST.hintsSeen.push(id);
  return true;
}

export function nextGoalHtml(liveGame) {
  if (!liveGame) return '';
  if (liveGame.gameAwaitingStart || !liveGame.roundActive) {
    return 'Tap Start Game, then pick two founders.';
  }
  if (liveGame.PHASE === 'select') {
    if (!liveGame.SEL_PARENT_A && !liveGame.SEL_PARENT_B) return 'Pick founder A.';
    if (liveGame.SEL_PARENT_A && !liveGame.SEL_PARENT_B) return 'Pick founder B (compatible pair).';
    if (liveGame.SEL_PARENT_A && liveGame.SEL_PARENT_B) return 'Tap Merge founders.';
  }
  if (liveGame.PHASE === 'hybrid') return 'Tap Begin life stage.';
  if (liveGame.PHASE === 'life' && liveGame.lifeSubStep === 'receipt') return 'Review result, then continue.';
  if (liveGame.PHASE === 'life' && !liveGame.lifeSubStep) {
    if (!liveGame.LIFE_RES) return 'Pick a help card (look for ✦).';
    if (!liveGame.LIFE_PRED) return 'Choose your forecast.';
    return 'Tap Resolve this life stage.';
  }
  return '';
}

export function renderGoalStrip(liveGame) {
  const txt = nextGoalHtml(liveGame);
  if (!txt) return '';
  return `<div class="goal-strip anim-up"><span class="goal-dot">●</span><strong>Your goal now:</strong> ${txt}</div>`;
}

export function renderContextHint(id) {
  const hint = CONTEXT_HINTS[id];
  if (!hint) return '';
  return `<div class="guide-tip anim-up">
    <button type="button" class="guide-tip-close" data-action="dismiss-hint" data-hint-id="${id}" aria-label="Dismiss hint">×</button>
    <div class="guide-tip-title">${hint.icon} ${hint.title}</div>
    <p class="guide-tip-body">${hint.body}</p>
  </div>`;
}

export function lifeStageStepStrip() {
  return `<div class="guide-step-strip anim-up">
    <span class="guide-step"><strong>1</strong> Pick help</span>
    <span class="guide-step"><strong>2</strong> Guess outcome</span>
    <span class="guide-step"><strong>3</strong> Resolve</span>
  </div>`;
}

export function gameLoopStripHtml() {
  return `<div class="guide-loop-strip anim-up">
    <span class="guide-loop-item">Merge founders</span>
    <span class="guide-loop-arrow">→</span>
    <span class="guide-loop-item">4 life stages × 3 crosses</span>
    <span class="guide-loop-arrow">→</span>
    <span class="guide-loop-item">Score your guesses</span>
  </div>`;
}

export function settingsGuideHtml(opts = {}) {
  const {
    subRounds = SUB_ROUNDS_PER_ROUND,
    lifeStages = 4,
    passes = 9,
    labCap = RESOURCE_SOFT_CAP,
    winPct = FORECAST_WIN_ACCURACY,
  } = opts;
  return `<div class="settings-guide-section">
    <h4>The big picture</h4>
    <p>One game has <strong>${subRounds} crosses</strong>. Each cross has <strong>${lifeStages} life stages</strong>. In every stage, pick help for the crisis, then guess the outcome.</p>
  </div>
  <div class="settings-guide-section">
    <h4>Lab and passes</h4>
    <p>You have <strong>${passes} deploy passes</strong> total and one shared lab pool (<strong>${labCap}</strong> cap). Spend carefully across all three crosses.</p>
  </div>
  <div class="settings-guide-section">
    <h4>How scoring feels</h4>
    <p>Guess-to-reality shows how often your forecasts matched. Winning usually means <strong>over ${winPct}%</strong> plus at least one strong full-life cross.</p>
  </div>
  <div class="settings-guide-section">
    <h4>Quick tips</h4>
    <p>Use ✦ cards when possible. Just Monitor can save lab. Keep vitality above zero to keep the line alive.</p>
  </div>`;
}
