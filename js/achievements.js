import { showToast } from './toast.js';
import { savePersisted } from './state.js';

export const ACHIEVEMENT_DEFS = [
  { id: 'first_hybrid', icon: '🧬', name: 'First splice', desc: 'Create your first hybrid cohort.' },
  { id: 'full_life', icon: '🌟', name: 'Natural arc', desc: 'Complete all four life stages on one cross.' },
  { id: 'five_hybrids', icon: '⚗️', name: 'Gene curator', desc: 'Synthesise five hybrids.' },
  { id: 'forecast_streak', icon: '🔮', name: 'Oracle', desc: 'Land three correct forecasts in a row.' },
  { id: 'cr_rescue', icon: '🛡️', name: 'CR guardian', desc: 'Establish a Hall of Fame line from a CR species.' },
  { id: 'round_clear', icon: '🏁', name: 'Campaign lap', desc: 'Finish a full three-cross round.' },
];

export function ensureAchievements(ST) {
  if (!Array.isArray(ST.achievements)) ST.achievements = [];
  return ST.achievements;
}

export function hasAchievement(ST, id) {
  return ensureAchievements(ST).includes(id);
}

export function unlockAchievement(ST, id) {
  const list = ensureAchievements(ST);
  if (list.includes(id)) return false;
  const def = ACHIEVEMENT_DEFS.find((a) => a.id === id);
  if (!def) return false;
  list.push(id);
  showToast(
    { title: `Achievement · ${def.name}`, body: def.desc, variant: 'good' },
    5200,
  );
  savePersisted();
  return true;
}

/** Evaluate persisted + session signals after key events */
export function checkAchievements(game, event) {
  const ST = game.ST;
  const unlock = (id) => unlockAchievement(ST, id);

  if (event === 'hybrid_created') {
    unlock('first_hybrid');
    if (ST.hybrids.length >= 5) unlock('five_hybrids');
  }
  if (event === 'full_life') unlock('full_life');
  if (event === 'round_end') unlock('round_clear');

  if (event === 'forecast') {
    const preds = ST.predictions || [];
    if (preds.length >= 3) {
      const last3 = preds.slice(-3);
      if (last3.every((p) => p.ok)) unlock('forecast_streak');
    }
  }

  if (event === 'fame' && game.HYBRID) {
    const cr =
      game.HYBRID.parentA?.species?.iucn === 'CR' ||
      game.HYBRID.parentB?.species?.iucn === 'CR';
    if (cr) unlock('cr_rescue');
  }
}
