import { game } from '../../core/state.js';
import { INTRO_STEPS, INTRO_STEP_COUNT, introStepIndex, nextGameNumber } from '../../game/game-intro.js';
import { introStepIconHtml } from './creature-visuals.js';

const AUTO_MS = 6000;
let autoTimer = null;
let lastIntroStep = -1;
let introHovered = false;
/** @type {(() => void) | null} */
let onAutoStep = null;

export function bindIntroAutoAdvance(renderFn) {
  onAutoStep = renderFn;
}

export function clearIntroAutoAdvance() {
  if (autoTimer) {
    clearTimeout(autoTimer);
    autoTimer = null;
  }
}

export function pauseIntroAutoAdvance() {
  clearIntroAutoAdvance();
}

export function scheduleIntroAutoAdvance() {
  clearIntroAutoAdvance();
  if (!game.showIntro || !onAutoStep) return;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const idx = introStepIndex();
  if (INTRO_STEPS[idx]?.isStart) return;

  autoTimer = setTimeout(() => {
    autoTimer = null;
    if (!game.showIntro) return;
    const cur = introStepIndex();
    if (cur >= INTRO_STEP_COUNT - 1 || INTRO_STEPS[cur]?.isStart) return;
    game.introAnimDir = 1;
    game.introStep = cur + 1;
    onAutoStep();
  }, AUTO_MS);
}

/**
 * Force CSS slide + icon enter animations to replay after DOM update.
 * @param {HTMLElement} root
 * @param {number} dir 1 = next, -1 = prev
 */
export function replayIntroSlideAnimation(root, dir = 1) {
  const card = root.querySelector('.intro-card');
  const icon = root.querySelector('.intro-icon-wrap');
  const copy = root.querySelector('.intro-copy');
  const dots = root.querySelectorAll('.intro-dot');

  const enterCls = dir >= 0 ? 'intro-card-enter-next' : 'intro-card-enter-prev';

  [card, icon, copy].forEach((el) => {
    if (!el) return;
    el.classList.remove('intro-card-enter-next', 'intro-card-enter-prev', 'intro-icon-enter', 'intro-copy-enter');
  });

  // Reflow so the browser treats animations as fresh.
  void root.offsetWidth;

  if (card) card.classList.add(enterCls);
  if (icon) icon.classList.add('intro-icon-enter');
  if (copy) copy.classList.add('intro-copy-enter');

  dots.forEach((dot, i) => {
    dot.classList.remove('intro-dot-pop');
    if (i === introStepIndex()) {
      void dot.offsetWidth;
      dot.classList.add('intro-dot-pop');
    }
  });
}

function introActionsHtml(step, idx, gNum) {
  if (step.isStart) {
    return `<button type="button" class="btn btn-p btn-lg intro-pulse" data-action="start-game">Yes — begin Game ${gNum}</button>
       <button type="button" class="btn btn-d" data-action="decline-start-game">Not now</button>`;
  }
  return `${idx > 0 ? '<button type="button" class="btn btn-s" data-action="intro-prev">Back</button>' : ''}
       <button type="button" class="btn btn-s" data-action="intro-skip">Skip intro</button>
       <button type="button" class="btn btn-p" data-action="intro-next">Next</button>`;
}

/**
 * @param {HTMLElement} root
 */
export function renderIntroCarousel(root) {
  if (!game.showIntro) {
    lastIntroStep = -1;
    clearIntroAutoAdvance();
    root.innerHTML = '';
    return;
  }

  const idx = introStepIndex();
  const step = INTRO_STEPS[idx];
  const gNum = nextGameNumber();
  const dir = idx === lastIntroStep ? game.introAnimDir || 1 : idx > lastIntroStep ? 1 : -1;
  lastIntroStep = idx;

  const dots = INTRO_STEPS.map(
    (_, i) => `<span class="intro-dot${i === idx ? ' on' : ''}" data-dot="${i}"></span>`,
  ).join('');

  root.innerHTML = `<div class="intro-overlay">
    <div class="intro-card intro-card-step-${idx}" data-intro-step="${idx}">
      ${introStepIconHtml(idx)}
      <div class="intro-dots" aria-hidden="true">${dots}</div>
      <div class="intro-copy">
        <div class="intro-step-lbl">Step ${idx + 1} / ${INTRO_STEP_COUNT}</div>
        <div class="intro-title">${step.title}</div>
        ${step.subtitle ? `<div class="intro-subtitle">${step.subtitle}</div>` : ''}
        <div class="intro-body">${step.body}</div>
      </div>
      <div class="intro-actions">${introActionsHtml(step, idx, gNum)}</div>
      ${!step.isStart ? `<div class="intro-auto-hint">Slides advance automatically · click Next anytime</div>` : ''}
    </div>
  </div>`;

  const card = root.querySelector('.intro-card');
  card?.addEventListener('mouseenter', () => {
    introHovered = true;
    pauseIntroAutoAdvance();
  });
  card?.addEventListener('focusin', pauseIntroAutoAdvance);
  card?.addEventListener('mouseleave', () => {
    introHovered = false;
    scheduleIntroAutoAdvance();
  });

  requestAnimationFrame(() => {
    replayIntroSlideAnimation(root, dir);
    if (!introHovered) scheduleIntroAutoAdvance();
  });
}
