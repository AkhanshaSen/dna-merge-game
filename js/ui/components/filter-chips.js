import { game } from '../../core/state.js';

const LAB_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'mammal', label: 'Mammals' },
  { id: 'reptile', label: 'Reptiles' },
  { id: 'avian', label: 'Birds' },
  { id: 'terrestrial', label: 'Land' },
  { id: 'marine', label: 'Marine' },
  { id: 'freshwater', label: 'Freshwater' },
  { id: 'compat', label: 'Match A' },
];

export function filterChipsHtml() {
  return `<div class="lab-filters">${LAB_FILTERS.map(
    (f) =>
      `<button type="button" class="fchip${game.labFilter === f.id ? ' on' : ''}" data-action="lab-filter" data-filter="${f.id}">${f.label}</button>`,
  ).join('')}</div>`;
}
