# DNA Merge — Life-round flow (current engine)

## Structure

| Layer | Meaning |
|-------|---------|
| **Round** | One conservation campaign lap: **3 animal crosses** (`SUB_ROUNDS_PER_ROUND`). |
| **Cross (sub-round)** | One founder pairing → merged cohort → **4 life-stage beats**. |
| **Life stage** | `Birth → Juvenile → Adult → Old age` — each stage is **one deploy + one survival forecast**. |

## Deploy passes (9 total)

Passes are issued **per cross** using `PASSES_PER_CROSS_SEQUENCE = [4, 3, 2]` (sums to **9**). Each resolved stage consumes **one pass**. Completing **all four** stages grants **`care+mate` legacy**: **`+CARE_MATE_BONUS_PER_FULL_LIFE`** ledger points toward survival maths on later crosses **and `+2` bonus passes** applied when the **next** cross begins (`bonusPassesNextSubRound` consumed in `beginLifeStage()`).

## Outcome matrix (each stage)

Engine (see `resolveLifeCycle` in `actions.js`):

|  | Right forecast | Wrong forecast |
|--|----------------|----------------|
| **Right deploy** (matches canonical synergy choice for crisis) | **+10** pts · roll survival outcome · update health | **+7** pts · roll outcome · update health |
| **Wrong deploy** | **Extinction** · **−7** pts (forecast `extinct`) | **Extinction** · **−10** pts |

Wrong deploy forces collapse regardless of dice; forecast only adjusts penalty.

## Health meter

`healthMeter` (0–100) moves with rolled outcomes when deploy was correct (survive cushions, damage drains). **≤ 0 ends the cross.**

## Meta-progress

- **`dna_points`** stores cumulative matrix score (`game.ST.points`).
- **`finishRoundSummary`** increments **`dna_breedRound`** (slot 1–5) after a full meta-round summary.

See `js/constants.js` for tunables (`MATRIX_*`, `ROUND_RESOURCE_PASSES`, sequences).
