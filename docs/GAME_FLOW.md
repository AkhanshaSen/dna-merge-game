# DNA Merge — Life-round flow (current engine)

## Structure

| Layer | Meaning |
|-------|---------|
| **Round** | One conservation campaign lap: **3 animal crosses** (`SUB_ROUNDS_PER_ROUND`). |
| **Cross (sub-round)** | One founder pairing → merged cohort → **4 life-stage beats**. |
| **Life stage** | `Birth → Juvenile → Adult → Old age` — each stage is **one deploy + one survival forecast**. |

## Dual economy: deploy passes + lab resources

| Pool | Cap | Role |
|------|-----|------|
| **Deploy passes** | 9 per round (`4+3+2` across crosses) | How many life stages you can resolve |
| **Lab resources** | 15 (`RESOURCE_SOFT_CAP`) | **One pool for the entire round** (all 3 crosses) — not 5 lab per cross |

Each funded stage: **−1 pass** and **−labCost** for the chosen deploy. Gene therapy triage costs **1.5** separately.

**Cross resupply:** When a cross begins (`beginLifeStage`), if lab is below **4** (`CROSS_LAB_STIPEND`), it tops up to **4** (still capped at 15). At **0 lab** you can still play **gambit** or **Monitor Only** until resupply.

**Gambit mode:** When lab cannot afford the cheapest deploy (`MIN_LAB_FOR_DEPLOY`), the standard deploy grid is hidden. Player picks **forecast only** (or **Monitor Only**); `rollGambitFate()` runs ~50/50 nature vs cohort, then branches into survive/damage/extinct. Points: `GAMBIT_FORECAST_PTS_OK` / `MISS`.

**Fallback deploys** (`js/deploy-match.js`):

| Card | When to use | Cost |
|------|-------------|------|
| **Wildlife Corridor** / **Community Ranger Network** | Extra ✦ options for habitat, patrol, predator, human crises | 1.2–1.5 lab |
| **Improvised Field Response** | No ✦ match, or synergy exists but lab too low | 0.5 lab · partial bonus (+8), softer dice |
| **Monitor Only** | Save lab; forecast + fate dice, no deploy matrix bonus | 0 lab |

Crisis card shows **Best leverage:** hints. Banners explain when improvise/monitor is the ethical path.

**Stewardship refund:** Correct deploy + correct forecast refunds **0.5** lab units. Full natural life grants **+2** lab units.

## Deploy passes (9 total)

Passes are issued **per cross** using `PASSES_PER_CROSS_SEQUENCE = [4, 3, 2]` (sums to **9**). Each resolved stage consumes **one pass** (including gambit stages). Completing **all four** stages grants **`care+mate` legacy**: **`+CARE_MATE_BONUS_PER_FULL_LIFE`** ledger points toward survival maths on later crosses **and `+2` bonus passes** applied when the **next** cross begins (`bonusPassesNextSubRound` consumed in `beginLifeStage()`).

## Devil mark (round-scoped)

If **>50%** of tracked deploys are wrong when synergy hints existed (`DEVIL_WRONG_RATIO`, min `DEVIL_MIN_STAGES` stages), a **Conservation Devil** modal appears once per round. Not persisted across rounds. Cleared on round summary.

## Outcome matrix (each stage)

Engine (see `resolveLifeCycle` in `actions.js`):

|  | Right forecast | Wrong forecast |
|--|----------------|----------------|
| **Right deploy** (any ✦ synergy match, or valid improvise when no affordable synergy) | **+10** pts · roll survival outcome · update health | **+7** pts · roll outcome · update health |
| **Wrong deploy** | **Extinction** · **−7** pts (forecast `extinct`) | **Extinction** · **−10** pts |

Wrong deploy forces collapse regardless of dice; forecast only adjusts penalty.

After each resolve, a **stage receipt** UI shows deploy/forecast/points/vitality before advancing.

**Foreseen extinction revival:** If the player forecast **extinct**, the outcome is **extinct**, and the cross would end (vitality 0 or wrong deploy), they may **revive once per cross**: **+4 lab units**, vitality **40%**, advance to the **next life stage** (or complete the cross if already at old age). Declining proceeds to normal extinction.

## Health meter

`healthMeter` (0–100) moves with rolled outcomes when deploy was correct (survive cushions, damage drains). **≤ 0 ends the cross.**

With a **correct deploy**, a raw “collapse” dice result often becomes **fight-back damage** instead of instant zero vitality (unless vitality was already critical). Wrong deploy still ends the cross immediately.

## Coach / ethics copy

`js/coach-hints.js` sets contextual banners: why merge, why deploy (stewardship), why forecast (humility), outlook bands, and receipt encouragement when forecasts miss but care succeeded.

## Genetics layer

- **Pre-merge preview** (`previewBlend` in `breeding.js`) — trait band before commit.
- **Defects** — cross-line hybrids may roll a defect; **triage** after stage 2+ spends **1.5** `dna_resources` to cure via gene therapy or accept the burden.
- **Trait drift** — `applyTraitDriftToHybrid` runs after each survived stage; bars update in UI.
- **Husbandry perk** — once per cross after stage 2, pick a small care bonus before stage 3.

## Breed campaign slots (1–5)

`js/campaign.js` — slot modifiers when events are rolled and in survival math:

| Slot | Effect |
|------|--------|
| 1 | Baseline |
| 2 | Crisis impacts 10% harsher |
| 3 | +2 synergy when deploy matches crisis |
| 4 | Higher defect roll chance |
| 5 | Cryptic resonance (`secretKey`) on final life stage |

`finishRoundSummary` increments **`dna_breedRound`** (wraps 5 → 1).

## Meta-progress

- **`dna_points`** — cumulative matrix score.
- **`dna_resources`** — lab pool (gene therapy, defaults 9).
- **`dna_achievements`** — milestone badges (see `js/achievements.js`).
- **`dna_tutorialDone`** — first-run guide dismissed.

## Persistence keys

See `js/storage.js` and README for full `dna_*` list.

Tunables: `js/constants.js` (`MATRIX_*`, `GENEFIX_COST`, `CARE_PERKS`, pass sequences).
