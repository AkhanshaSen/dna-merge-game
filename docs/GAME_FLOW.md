# DNA Merge — Life-round flow (current engine)

Authoritative reference for how a **game** (three crosses) runs in code. Player-facing summary: **`README.md`**.

---

## Structure

| Layer | Meaning | Code |
|-------|---------|------|
| **Game** | One playable lap: **3 animal crosses** | `SUB_ROUNDS_PER_ROUND`, `roundNumber`, `subRoundIndex` |
| **Round** | Same as **game** in UI (“round” = `roundActive` session) | `game.roundActive` |
| **Cross (sub-round)** | One founder pairing → merged cohort → **4 life stages** | `resetCrossSession()` between crosses |
| **Life stage** | Birth → Juvenile → Adult → Old age | `lifeStageIndex` 1–4, `LIFE_STAGES_PER_SUBROUND` |

UI header: **`Game N · Cross M`** (`round-tracker.js` → `gameProgressLabel()`).

---

## Start Game gate (`js/game-intro.js`)

Before merging founders:

1. **Intro** — 5 steps on first visit; returning players see the final step only (`dna_tutorialDone`).
2. **Start Game** — refills lab to **15/15** (`RESOURCE_START_DEFAULT`), sets `roundActive`, increments **Game N**, clears `gameAwaitingStart`.
3. **Not now** — Gene Lab browse-only; merge blocked until Start Game.

After **game summary** (3 crosses), lobby returns with Start Game again. Lab in storage defaults to **15**; gameplay pool applies only after Start Game.

`beginRoundTracking()` resets per-game cross results and forecast slice index.

---

## Dual economy: deploy passes + lab resources

| Pool | Cap | Role |
|------|-----|------|
| **Deploy passes** | 9 per game (`4+3+2` via `PASSES_PER_CROSS_SEQUENCE`) | One pass per resolved life stage |
| **Lab resources** | 15 (`RESOURCE_SOFT_CAP`) | **Single pool for entire game** (all 3 crosses) |

Each funded stage: **−1 pass** and **−deploy lab cost**. Gene therapy triage: **1.5** (`GENEFIX_COST`).

**Cross stipend:** `beginLifeStage()` → if lab &lt; **4** (`CROSS_LAB_STIPEND`), top up to 4 (still capped at 15).

**Gambit mode** (`resource-economy.js`): lab &lt; `MIN_LAB_FOR_DEPLOY` → deploy grid hidden; forecast-only or **Just Monitor** from gambit panel. `rollGambitFate()` then `applyGambitVitality()`. Points: `GAMBIT_FORECAST_PTS_OK` / `GAMBIT_FORECAST_PTS_MISS`.

### Fallback deploys (`js/deploy-match.js`)

| Card | When | Cost / effect |
|------|------|----------------|
| **Wildlife Corridor** / **Community Ranger Network** | Extra ✦ for habitat, patrol, predator, human crises | 1.2–1.5 lab |
| **Improvised Field Response** | No ✦ match, or synergy unaffordable | 0.5 lab · partial bonus (+8), softer dice |
| **Just Monitor** | Save lab; observe + fate dice | 0 lab · no deploy matrix bonus |

**Just Monitor availability:** From **Juvenile** (stage 2+) always in deploy grid. At **Birth**, only when improvise/monitor fallback path is active.

**Deploy before forecast:** Funded stages lock forecast buttons until a deploy (including Monitor) is selected. Gambit is forecast-only except when Monitor is chosen from the gambit panel.

Crisis card: **Best leverage** hints. Coach banners explain improvise/monitor ethics (`coach-hints.js`).

**Stewardship refund:** Correct deploy + correct forecast → **+0.5** lab (`STEWARD_REFUND`). **+2 lab** only on **fullLife** cross end (`FULL_LIFE_LAB_BONUS`).

---

## Cross outcome tiers (`js/cross-outcomes.js`)

End-of-cross is **not** `healthMeter > 0` alone. After stage 4 receipt (or revival completing at old age), `evaluateCrossEnd(lr)` → `routeCrossEnd()` in `actions.js`.

| Tier | ID | Conditions | Bonuses |
|------|-----|------------|---------|
| **Full natural life** | `fullLife` | Stage 4 complete · `healthMeter > 0` · `lr.rolled !== 'extinct'` · **≥3/4** cross forecasts correct (`CROSS_FORECAST_MIN_CORRECT`) | Fame, +8% care+mate (`CARE_MATE_BONUS_PER_FULL_LIFE`), +2 passes next cross, +2 lab, +15 pts (`CROSS_STEWARDSHIP_BONUS_PTS`), achievements |
| **Arc finished** | `partialArc` | Stage 4 · health &gt; 0 · roll ≠ extinct · &lt;3/4 forecasts | None |
| **Collapsed at old age** | `woundedEnd` | Stage 4 · health &gt; 0 · **`lr.rolled === 'extinct'`** | None |
| **Extinct** | `extinct` | `health <= 0` or `!lr.resourceOk` (wrong deploy) | Extinction hall |

**Critical:** Final-stage `rolled === 'extinct'` **never** grants full-life bonuses, even if vitality remains (e.g. Just Monitor old age).

### Decision flow

```
Stage receipt dismissed (proceedAfterReceiptCore)
  → !resourceOk? → extinct
  → health <= 0? → extinct
  → lifeStageIndex < 4? → next stage (drift, triage, care, etc.)
  → lifeStageIndex >= 4?
       → rolled === extinct? → woundedEnd
       → forecasts >= 3/4 on this cross? → fullLife
       → else → partialArc
```

Early stages: `rolled === 'extinct'` with health &gt; 0 does **not** end the cross unless vitality hits 0 (or wrong deploy).

### Forecast counting

Predictions stored in `game.ST.predictions` with:

`cycle = subRoundIndex * 10 + lifeStageIndex` (stages 1–4 for current cross).

`crossForecastStats(crossIndex)` — correct count vs `CROSS_FORECAST_MIN_CORRECT` and `total >= 4` for `meetsBar`.

`recordCrossOutcome(tier, meta)` in `round-tracker.js` snapshots tier, forecasts, thriving label (vitality + viability).

### UI copy

- Cross end banner: `game.crossEndTier` + `fbCrossEndUi()` / `fbCrossEndNarr()` (`fallbacks.js`, `renderSubRoundEnd()`).
- Game summary narrative: `gameEndVerdictMessage()` → `fbGameEndVerdict()`.
- Cross cards: `roundCrossSummaryHtml()` — pills for full life / imperfect / extinct.

---

## Deploy passes (9 total)

`PASSES_PER_CROSS_SEQUENCE = [4, 3, 2]`. Each resolve consumes one pass.

**fullLife** only: `bonusPassesNextSubRound += 2`, consumed in `beginLifeStage()` for the next cross.

---

## Per-stage outcome matrix

`resolveLifeCycle` / `resolveObserveLifeCycle` in `actions.js`:

|  | Right forecast | Wrong forecast |
|--|----------------|----------------|
| **Right deploy** (✦ synergy, or valid improvise) | +10 pts · roll outcome · update health | +7 pts · roll · update health |
| **Wrong deploy** | Extinction · −7 pts (forecast `extinct`) | Extinction · −10 pts |

Wrong deploy ends cross immediately; forecast adjusts penalty only.

**Stage receipt** → dismiss → optional **revival** → `proceedAfterReceiptCore()`.

---

## Foreseen extinction revival (`js/extinction-revival.js`)

Eligible when: player forecast **extinct**, outcome **extinct**, cross would end (`health <= 0` or wrong deploy), **once per cross** (`revivalUsedThisCross`).

- **Accept:** +4 lab (`REVIVAL_LAB_BONUS`), vitality **40%** (`REVIVAL_VITALITY`), advance stage — or if already at old age, complete cross via **`routeCrossEnd(lr)`** (same tier rules).
- **Decline:** normal `proceedAfterReceiptCore()`.

---

## Game end summary (`round-tracker.js`)

After cross 3: `PHASE === 'roundEnd'`.

| Metric | Source |
|--------|--------|
| Per-cross tier + thriving | `game.roundCrossResults` |
| Guess-to-reality % | Forecasts since `roundPredictionsStartIndex` |
| Winner / Loser | `gameWinnerEligible(pct, fullLifeCount)` — **pct > 75%** (`FORECAST_WIN_ACCURACY`) **and ≥1 fullLife** |

Narrative: `gameEndVerdictMessage()`.

`finishRoundSummary` advances **`dna_breedRound`** (1–5, wraps).

---

## Health meter

`healthMeter` 0–100. Correct deploy: survive/damage/extinct rolls adjust vitality; collapse dice may downgrade to damage if vitality was healthy. **≤ 0** → extinct tier (unless revival offered and taken).

---

## Devil mark (game-scoped)

`DEVIL_WRONG_RATIO` + `DEVIL_MIN_STAGES`: &gt;50% wrong deploys when synergy existed → Conservation Devil modal once per game. Cleared on game summary.

---

## Genetics layer

- **Pre-merge preview** — `previewBlend` (`breeding.js`).
- **Defects** — cross-line roll; triage after stage 2+ costs **1.5** lab.
- **Trait drift** — `applyTraitDriftToHybrid` after each survived stage.
- **Care perk** — once per cross after stage 2 (`CARE_PERKS`).

---

## Breed campaign slots (`js/campaign.js`)

| Slot | Effect |
|------|--------|
| 1 | Baseline |
| 2 | Crisis impacts ~10% harsher |
| 3 | +2 synergy when deploy matches crisis |
| 4 | Higher defect roll chance |
| 5 | Cryptic resonance (`secretKey`) on final life stage |

---

## Module map

| Module | Responsibility |
|--------|----------------|
| `game-intro.js` | Start Game, intro steps, `beginRoundTracking` |
| `actions.js` | Merge, life resolve, receipts, `routeCrossEnd`, persistence |
| `cross-outcomes.js` | Tier evaluation, forecast stats, winner eligibility |
| `round-tracker.js` | Game/Cross labels, `recordCrossOutcome`, summary HTML |
| `deploy-match.js` | Synergy, improvise, monitor, crisis hints |
| `resource-economy.js` | Lab deduct, gambit sync, refund, stipend |
| `extinction-revival.js` | Revival eligibility + apply |
| `life-round-logic.js` | Canonical deploy + survival %pts |
| `game-logic.js` | Events, dice, gambit fate |
| `fallbacks.js` | Hybrid names, cross/game end copy |
| `render.js` | All phases including tier banners |
| `coach-hints.js` | Ethics / outlook coach lines |
| `constants.js` | Tunables: `MATRIX_*`, tiers, caps |
| `history-groups.js` | History grouping, timestamps, `archiveCompletedGame()` |

---

## History tab & game archives

On **Start Game**, `activeGameNumber` and `activeGameStartedAt` are stored in `game.ST`.

Each forecast (`pushPredictionRow`) and life log row (`logLifeBeat`) tags: `gameNumber`, `crossIndex`, `stage`, `ts` (ms).

On **game summary** (`finishRoundSummary`), `archiveCompletedGame()` appends to `dna_gameSessions` (cap 50): game number, start/end times, guess-to-reality stats, winner flag, tier counts, and `crossResults` snapshot.

**History UI** (`renderHistory`): lifetime guess-to-reality bar; per-game cards with cross 1–3 sub-blocks; **Earlier sessions** for legacy rows without `gameNumber`.

---

## Meta-progress & persistence

| Key | Role |
|-----|------|
| `dna_points` | Lifetime matrix + stewardship bonuses |
| `dna_resources` | Lab pool (default **15**, cap 15) |
| `dna_predictions` | All forecast rows (`cycle` encodes cross + stage) |
| `dna_fame` | fullLife cohorts only |
| `dna_extinctions` | Failed crosses / pairs |
| `dna_breedRound` | Campaign slot 1–5 |
| `dna_achievements` | Milestones |
| `dna_tutorialDone` | Intro completed |
| `dna_gameSessions` | Completed game archives for History |
| `dna_activeGameNumber` / `dna_activeGameStartedAt` | Active game metadata |

Loader: `js/storage.js`. Session resets: `resetCrossSession()` clears per-cross state but **retains** `roundCrossResults` for the active game summary.

---

## Key constants (`js/constants.js`)

| Constant | Value | Notes |
|----------|-------|-------|
| `RESOURCE_SOFT_CAP` | 15 | Shared lab cap |
| `RESOURCE_START_DEFAULT` | 15 | Storage default + Start Game refill |
| `CROSS_LAB_STIPEND` | 4 | Per-cross floor |
| `CROSS_FORECAST_MIN_CORRECT` | 3 | Of 4 stages for fullLife |
| `CROSS_STEWARDSHIP_BONUS_PTS` | 15 | fullLife only |
| `FORECAST_WIN_ACCURACY` | 75 | Game winner threshold (with ≥1 fullLife) |
| `FULL_LIFE_LAB_BONUS` | 2 | fullLife only |
| `REVIVAL_LAB_BONUS` | 4 | Once per cross |
| `REVIVAL_VITALITY` | 40 | After revival |
| `MATRIX_RR_RG` / `RR_WG` / `WR_*` | 10 / 7 / −7 / −10 | Per-stage matrix |
