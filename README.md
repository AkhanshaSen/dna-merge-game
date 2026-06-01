# 🧬 DNA Merge: Species Survival Engine

A conservation genetics game where you merge endangered species (or renew lines within a species), then steer **three animal crosses per round** through **four life stages** each (birth → old age). Every stage pairs **one conservation deploy** with **one survival forecast** against a crisis — scored by a **2×2 matrix**, tracked by a **vitality meter**, with **nine deploy passes per round** split across crosses — plus **care+mate legacy** bonuses when a line survives its full arc.

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

| Step | Action |
|------|--------|
| **Gene Lab** | Pick **two named founders** (slot A + B). Each real species has three animals with gender and personality. |
| **Classes** | Only **matching animal classes** can breed: mammals ↔ mammals, reptiles/amphibians ↔ reptiles/amphibians, birds ↔ birds. Cross-class hybrids are blocked. |
| **Realms** | **Land**, **marine**, and **freshwater** lineages cannot cross — e.g. leatherbacks or vaquitas cannot pair with terrestrial mammals; axolotls stay in freshwater-only pairings. |
| **Gender** | Merge requires **one male + one female** founder (same-species pairs included). |
| **Round structure** | One **round** = **3 crosses**. Each cross = merge → **4 life stages** (Birth · Juvenile · Adult · Old age). Complete all four on a cross for Hall of Fame + **legacy bonuses**. |
| **Deploy passes** | **9 passes per round**, allocated **4 + 3 + 2** across crosses 1→3. Each resolved stage spends **one pass**. Wrong deploy collapses that cross immediately. |
| **Matrix scoring** | **Right deploy + right forecast → +10 pts** · **Right deploy + wrong forecast → +7 pts** · **Wrong deploy → extinction**, **−7 pts** if you forecast `extinct`, **−10 pts** otherwise. |
| **Survival forecast** | One pick per stage among **survive / damage / extinct**, compared to a hidden dice outcome **when deploy was correct**. |
| **Health meter** | **Vitality %** rises or falls across stages for narrative continuity; hitting **0** ends the cross. |
| **Care+mate legacy** | Finish all four stages on a cross → **+8 %pts** toward survival maths on later crosses this round **and +2 bonus passes** when you begin the **next** cross. |
| **Round summary** | After the third cross, review points gained and return to Gene Lab → **breed slot** advances **1–5** (persisted). |
| **Genetics preview** | Valid A+B pair shows projected viability band before merge. |
| **Defect triage** | Cross-line hybrids may carry defects; spend **1.5 resources** for gene therapy or accept the burden. |
| **Trait drift** | Traits shift after each survived life stage — visible on hybrid bars. |
| **Synergy hints** | Deploy cards glow when they match the active crisis. |
| **Campaign slots** | Breed slots 1–5 change pressure; slot 5 adds cryptic resonance on old age. |

> Survival projections use additive **%pts** toward a clamped band (see `life-round-logic.js`). **`dna_resources`** power gene therapy; achievements and tutorial state persist in **`dna_achievements`** / **`dna_tutorialDone`**.

---

## 💾 LocalStorage Keys

All progress is auto-saved to your browser:

| Key | Contents |
|-----|----------|
| `dna_hybrids` | All hybrids ever created |
| `dna_extinctions` | Extinct founder pairs (`mergeKey`) plus legacy species-only rows |
| `dna_fame` | Established / Hall of Fame cohorts |
| `dna_resources` | Conservation pool (**defaults to 9**, fractional budgets OK — gene therapy spends **1.5**) |
| `dna_breedRound` | Breed campaign slot **1–5** (wraps) — advances when you finish a **round summary** |
| `dna_predictions` | Forecast history (predicted vs actual per life-stage beat) |
| `dna_points` | Lifetime **scoreboard total** from the deploy × forecast matrix |
| `dna_log` | Complete cycle event log |
| `dna_achievements` | Unlocked milestone IDs |
| `dna_tutorialDone` | First-run guide completed |

See **`docs/GAME_FLOW.md`** for round / cross / stage rules, genetics, and campaign slots.

---

## 🌍 Species & founders

Twelve flagship species — **36 named founders** total (three per species), each with gender and personality flavour text used in blending and narration.

Taxonomy bucket | Species |
|----------------|---------|
| **Mammals** | Snow Leopard, Amur Leopard, Vaquita, Javan Rhino, Sunda Tiger, Mountain Gorilla, Chinese Pangolin, Saola, Sumatran Orangutan |
| **Reptiles / amphibians** | Axolotl, Leatherback Turtle |
| **Birds** | Kakapo |

---

## 📁 File structure

```
dna-merge-game/
├── docs/
│   └── GAME_FLOW.md   ← Step-by-step cohort / beat logic
├── index.html          ← Shell + loads css + ES module entrypoint
├── css/
│   └── styles.css      ← All visuals
├── js/
│   ├── main.js         ← Bootstraps globals for UI handlers + tabs
│   ├── state.js        ← Mutable session `game` object + resets
│   ├── constants.js    ← Events, resources, trait labels, defect pool
│   ├── species.js      ← Species data + founders + taxonomy helpers
│   ├── breeding.js     ← Trait blending, merge keys, compatibility rules
│   ├── cycle-meta.js   ← Life-stage banners + timeline UI
│   ├── campaign.js     ← Breed slot 1–5 modifiers
│   ├── achievements.js ← Milestone unlocks
│   ├── life-round-logic.js ← Canonical deploy selection & survival rate helpers
│   ├── storage.js      ← localStorage helpers
│   ├── fallbacks.js    ← Built-in hybrid / narrative / defect copy
│   ├── game-logic.js   ← RNG events, survival formula, outcome dice
│   ├── render.js       ← DOM rendering
│   └── actions.js      ← User flows + persistence writes
└── README.md
```

Still **zero npm / zero build**. Serve over **http(s)** so ES modules load (`npx serve .`, GitHub Pages, or `python3 -m http.server`).

Opening `index.html` directly via `file://` may block modules in some browsers — use a tiny static server if the screen stays blank.

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
