# Architecture

Browser-only conservation game. **Game logic never imports UI.** UI reads `game` state and calls `actions.js`.

## Folder map

```
js/
  core/           Rules, data, persistence (no DOM)
  game/           Session actions, round tracking, game intro
  content/        Copy, hints, achievements, history, toast
  ui/
    app.js        Entry point (boot + event delegation)
    render/       DOM orchestration
    visuals/      WebGL + SVG portraits + intro carousel
    components/   Reusable HTML fragments
  main.js         Shim → ui/app.js
```

## Import rules

| From | May import |
|------|------------|
| `core/*` | `core/*` only |
| `game/*` | `core/*`, `content/*`, `ui/render`, `ui/visuals` |
| `content/*` | `core/*`, `game/*` (sparingly), other `content/*` |
| `ui/*` | `core/*`, `game/*`, `content/*`, `ui/*` |

## Render flow

```
actions.js  →  game (state.js)  →  render/index.js (~40 lines)
                                      ├─ shell.js (sidebar, mission, stats rail)
                                      ├─ views/lab.js, hybrid.js, life.js, round.js
                                      ├─ views/records.js, history.js, settings.js
                                      ├─ views/loading.js
                                      ├─ modals/intro.js, devil.js
                                      ├─ helpers.js + components/*
                                      └─ syncScene(game) → scene3d.js
```

## CSS

`css/main.css` imports tokens, layout, shell, components, view sheets (`views/lab.css`, `life.css`, `records.css`, `history.css`), intro, and `legacy.css` (remaining shared rules).

## Event delegation

- `#main` — all `data-action` gameplay buttons
- `#sidebar` — `data-v` view switches
- `#mission-band` — start game CTA
- `#tutorial-root` — intro carousel

Logic handlers live in `game/actions.js` unchanged.
