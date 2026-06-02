# 🧬 DNA Merge: Species Survival Engine

A conservation genetics game where you merge endangered species (or renew lines within a species), then steer **three animal crosses per game** through **four life stages** each (birth → old age). Every stage pairs **one conservation deploy** (or a lab-saving fallback) with **one survival forecast** against a crisis — scored by a **2×2 matrix**, tracked by a **vitality meter**, with **nine deploy passes per game** split across crosses. **Full natural life** is earned only when you finish all four stages with honest forecasts and no final collapse roll — not merely because vitality stayed above zero.

---

## 🚀 Deploy to GitHub Pages in 3 Steps

1. **Upload this folder to a new GitHub repo**
   - Go to [github.com/new](https://github.com/new)
   - Name it anything (e.g. `dna-merge-game`)
   - Push the whole folder (especially `index.html`, `css/`, `js/`)

2. **Enable GitHub Pages**
   - Go to your repo → **Settings** → **Pages**
   - Under "Source" select **Deploy from a branch**
   - Branch: `main` · Folder: `/ (root)`
   - Click **Save**

3. **Your game is live in ~60 seconds**
   - URL: `https://YOUR-USERNAME.github.io/dna-merge-game/`

---

## 🎮 How to Play

First visit now includes a **7-step welcoming intro**, and contextual tips appear during your first cross to keep learning simple while you play.
During early learning mode, the game also shows a **\"Your goal now\"** strip and hides some advanced scoring detail until you complete your first receipt.

### Gene Lab & breeding

| Step | Action |
|------|--------|
| **Start Game** | Before merging, confirm **Start Game** in the intro. This refills lab to **15/15**, starts **Game N**, and unlocks founder selection. Browse-only if you choose **Not now**. |
| **Gene Lab** | Pick **two named founders** (slot A + B). Each species has three animals with gender and personality. |
| **Classes** | Only **matching animal classes** can breed: mammals ↔ mammals, reptiles/amphibians ↔ reptiles/amphibians, birds ↔ birds. |
| **Realms** | **Land**, **marine**, and **freshwater** lineages cannot cross. |
| **Gender** | Merge requires **one male + one female** founder. |
| **Genetics preview** | Valid A+B pair shows projected viability band before merge. |
| **Defect triage** | Cross-line hybrids may carry defects; spend **1.5 lab** for gene therapy or accept the burden. |
| **Trait drift** | Traits shift after each survived life stage. |
| **Synergy hints** | Deploy cards glow when they match the active crisis. |

### Game structure

| Concept | Meaning |
|---------|---------|
| **Game** | One playable lap: **3 crosses** (UI: **Game N · Cross M**). |
| **Cross** | One merge → **4 life stages** (Birth · Juvenile · Adult · Old age). |
| **Deploy passes** | **9 per game**, split **4 + 3 + 2** across crosses. Each resolved stage spends **one pass**. |
| **Lab pool** | **15 units max**, **shared across all 3 crosses** for the whole game (not 5 per cross). **Start Game** sets you to 15. New saves default to **15** in storage. |
| **Cross resupply** | When a new cross begins, if lab is below **4**, it tops up to **4** (still capped at 15). |

### Each life stage

| Step | Action |
|------|--------|
| **Deploy** | Pick a conservation card (costs lab + 1 pass) — or a **fallback** when the field offers no good match (see below). |
| **Forecast** | Pick **survive / damage / extinct** (locked until deploy is chosen in funded stages). |
| **Matrix** | **Right deploy + right forecast → +10 pts** · **Right + wrong → +7** · **Wrong deploy → cross ends**, **−7** if you forecast `extinct`, **−10** otherwise. |
| **Vitality** | **Health %** moves with outcomes; **0** ends the cross. A correct deploy can turn a bad dice roll into **damage** instead of instant zero. |
| **Receipt** | Review deploy, forecast, points, and vitality before advancing. |

### Fallback & low-lab play

| Path | When | Notes |
|------|------|--------|
| **Synergy deploys** | Crisis matches ✦ habitat / patrol / etc. | Standard funded stages. |
| **Improvised Field Response** | No affordable synergy | **0.5 lab**, partial bonus, softer dice. |
| **Just Monitor** | Save lab; observe only | **0 lab**, gambit-style fate dice — no matrix deploy bonus. From **Juvenile** onward, always on the grid; at **Birth**, only when fallback applies. |
| **Gambit mode** | Lab below cheapest deploy | Forecast-only (or Monitor from gambit panel); ~50/50 nature vs cohort. |

**Stewardship refund:** Correct deploy + correct forecast returns **0.5 lab**.

### Cross end — four outcome tiers

Finishing **old age** does **not** automatically mean success. The engine assigns a tier:

| Tier | You get | Bonuses |
|------|---------|---------|
| **Full natural life** | All 4 stages · vitality &gt; 0 · final roll ≠ extinct · **≥3/4** forecasts correct on this cross | Hall of Fame, **+8%** care+mate on later crosses, **+2 passes** next cross, **+2 lab**, **+15** stewardship points |
| **Arc finished** | Completed 4 stages but **&lt;3/4** forecasts correct | Narrative only — no fame or legacy |
| **Collapsed at old age** | Vitality lingered but the **final roll was extinct** (e.g. Monitor at old age) | None — fixes false “full life” when nature still rolled collapse |
| **Extinct** | Vitality 0 or wrong deploy | Extinction hall |

### Foreseen extinction revival

If you forecast **extinct**, the outcome is **extinct**, and the cross would end — you may **revive once per cross**: **+4 lab**, vitality **40%**, advance one stage (or finish the cross at old age). Tier rules still apply when the cross completes (revival does not force full life).

### Game summary & winning

After cross 3, **Game N summary** shows each cross tier, thriving status, per-cross forecast accuracy, and **guess-to-reality %** for the whole game.

**Winner** = forecast accuracy **&gt;75%** **and** at least **one full natural life** cross. Otherwise **Loser**.

Then return to Gene Lab — **breed slot** advances **1–5** (persisted campaign pressure).

### History tab

The **History** view groups forecasts and life-stage logs **by Game** (newest first), with **start/completed** timestamps and **guess-to-reality %** per game plus a lifetime bar. Rows inside each cross show date/time when recorded after this update. Older untagged rows appear under **Earlier sessions** (no timestamps).

### Campaign

Breed slots **1–5** change crisis pressure; slot **5** adds cryptic resonance on old age. See **`docs/GAME_FLOW.md`** for matrix math, tier routing, revival, and module map.

> Survival projections use additive **%pts** toward a clamped band (`life-round-logic.js`). **`dna_resources`** default **15**; achievements and tutorial persist in **`dna_achievements`** / **`dna_tutorialDone`**.

---

## 💾 LocalStorage Keys

All progress is auto-saved to your browser:

| Key | Contents |
|-----|----------|
| `dna_hybrids` | All hybrids ever created |
| `dna_extinctions` | Extinct founder pairs (`mergeKey`) plus legacy species-only rows |
| `dna_fame` | **Full natural life** cohorts (Hall of Fame) |
| `dna_resources` | Conservation lab pool (**defaults to 15**, cap 15 — gene therapy **1.5**) |
| `dna_breedRound` | Breed campaign slot **1–5** (wraps) — advances after **game summary** |
| `dna_predictions` | Forecast history (predicted vs actual per life-stage beat; tagged with game # and timestamp on new rows) |
| `dna_points` | Lifetime **scoreboard total** from matrix + stewardship bonuses |
| `dna_log` | Complete cycle event log (tagged with game # and timestamp on new rows) |
| `dna_gameSessions` | Archived summaries per completed game (tiers, guess-to-reality %, cross results) |
| `dna_activeGameNumber` / `dna_activeGameStartedAt` | Current game id and start time (cleared when game summary finishes) |
| `dna_achievements` | Unlocked milestone IDs |
| `dna_tutorialDone` | First-run guide completed |

---

## 🌍 Species & founders

Twelve flagship species — **36 named founders** total (three per species), each with gender and personality flavour text used in blending and narration.

| Taxonomy bucket | Species |
|-----------------|---------|
| **Mammals** | Snow Leopard, Amur Leopard, Vaquita, Javan Rhino, Sunda Tiger, Mountain Gorilla, Chinese Pangolin, Saola, Sumatran Orangutan |
| **Reptiles / amphibians** | Axolotl, Leatherback Turtle |
| **Birds** | Kakapo |

---

## 📁 File structure

```
dna-merge-game/
├── docs/
│   └── GAME_FLOW.md      ← Engine rules, tiers, economy, module map
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── main.js              ← Boot, tabs, global UI handlers
    ├── state.js             ← Session `game` object + resets
    ├── constants.js         ← Matrix pts, caps, tier thresholds
    ├── cross-outcomes.js    ← Cross end tiers + forecast bar + winner gate
    ├── round-tracker.js     ← Game/Cross labels, cross results, game verdict
    ├── history-groups.js    ← Game-grouped history, archive on summary
    ├── game-intro.js        ← Start Game gate + intro steps
    ├── player-guide.js      ← Welcoming copy + one-time context hints
    ├── actions.js           ← User flows, life resolve, tier routing
    ├── render.js            ← DOM (tier banners, game summary)
    ├── fallbacks.js         ← Hybrid / cross-end / game-end copy
    ├── deploy-match.js      ← Synergy, improvise, monitor fallback
    ├── resource-economy.js  ← Lab cost, gambit mode, refunds, stipend
    ├── extinction-revival.js← Foreseen-extinct revival (once per cross)
    ├── life-round-logic.js  ← Canonical deploy & survival rate helpers
    ├── game-logic.js        ← Events, dice, gambit fate
    ├── breeding.js          ← Traits, merge keys, compatibility
    ├── species.js           ← Species + founders
    ├── campaign.js          ← Breed slots 1–5
    ├── cycle-meta.js        ← Life-stage banners + timeline
    ├── coach-hints.js       ← Contextual ethics / outlook copy
    ├── achievements.js
    ├── storage.js
    └── toast.js
```

Still **zero npm / zero build**. Serve over **http(s)** (`npx serve .`, GitHub Pages, or `python3 -m http.server`).

Opening `index.html` via `file://` may block ES modules — use a tiny static server if the screen stays blank.

---

## 🛠 Local development

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open the printed localhost URL.

---

MIT License · Built with 🧬
