# Card Balance Redesign — Design Document

**Date**: 2026-02-15
**Status**: Approved
**Scope**: Resource system, vice mechanic, clout economy, stat rebalancing, effect parser, archetype targeting

---

## 1. Resource System: Reputation, Stability, and Clout

Three player-level resources replace the single LP pool.

| Resource | Starting Value | Role | Win/Loss Condition |
|----------|:-------------:|------|-------------------|
| **Reputation** | 0 | Offensive resource. Earned through effects and combat. | **Win at 10,000** |
| **Stability** | 5,000 | Defensive resource. Depleted by self-destructive effects and opponent attacks. | **Lose at 0** (total breakdown) |
| **Clout** | 0 (ramps) | Summoning currency. Gained per turn. | Not a win condition |

### Clout Economy

- Gain clout equal to `min(turnNumber, 4)` at the start of each turn
- Clout resets each turn (use it or lose it)
- Every card has a clout cost (the existing `cost` field, rebalanced)
- Playing a card = spend its clout cost
- Multiple cards per turn if you have enough clout

### Combat Damage

- Battle damage reduces the defending player's **Stability** (not LP — there is no LP)
- Reputation is earned through card effects, not combat

### Win Conditions (3 paths)

1. **Rep Race**: First player to 10,000 Reputation
2. **Breakdown Victory**: Cause 3 Breakdowns via vice counters
3. **Stability Collapse**: Opponent's Stability hits 0 → all their monsters break down, they lose

### Lose Conditions

- Stability hits 0
- Opponent reaches 10,000 Reputation
- Opponent causes 3 of your monsters to break down
- Deck out (can't draw)
- Surrender

### Engine Changes Required

**GameState additions:**
```typescript
// Replace hostLifePoints/awayLifePoints with:
hostReputation: number;    // starts 0, win at 10,000
awayReputation: number;
hostStability: number;     // starts 5,000, lose at 0
awayStability: number;
hostClout: number;         // current turn clout available
awayClout: number;
hostMaxClout: number;      // clout cap for this turn (min(turn, 4))
awayMaxClout: number;
```

**EngineConfig additions:**
```typescript
startingReputation: 0,
reputationToWin: 10000,
startingStability: 5000,
maxCloutPerTurn: 4,
```

**WinReason additions:**
```typescript
type WinReason = "reputation_max" | "stability_zero" | "breakdown" | "deck_out" | "surrender";
```

---

## 2. Vice Counter System

Vice counters accumulate on Stereotypes (monsters). At 3 counters → **Breakdown** (destroyed, credited to opponent). 3 breakdowns caused = win.

### Per-Archetype Vice Interactions

| Archetype | Vice Role | Mechanic |
|-----------|-----------|----------|
| **Dropouts** | Self-inflict as cost | Powerful effects add vice to OWN monsters. High risk/reward. |
| **Freaks** | Opponent aggressor | Add vice to OPPONENT monsters. Corrupting influence. |
| **Preps** | Redistribute | Move vice counters between monsters. Social manipulation. |
| **Geeks** | Convert to resources | Remove own vice and gain draw/boosts. Process problems into solutions. |
| **Nerds** | Exploit presence | Trigger bonus effects when vice counters exist on any monster. |
| **Goodies** | Remove (cleanse) | Remove vice from any monster. Intervention. Already designed. |

### Example Card Changes

**Dropouts (self-vice as cost):**
- `Crypto All-In Carl`: "Gain +500 Reputation. Add 1 vice counter to this card."
- `All-In Gamble`: "Gain +1000 Reputation. Add 2 vice counters to target Stereotype you control."

**Freaks (opponent vice aggression):**
- `Conspiracy Kyle`: "Add 1 vice counter to target opponent Stereotype."
- `Sudden Epiphany`: "Add 1 vice counter to each opponent Stereotype."

**Preps (redistribute):**
- `Networking Event`: "Move up to 2 vice counters from Stereotypes you control to opponent Stereotypes."
- `Screenshots Leaked`: "Move all vice counters from 1 Stereotype to another."

**Geeks (convert to resources):**
- `Debugging Dana`: "Remove 1 vice counter from a Stereotype you control. Draw 1 card."
- `Code Refactor`: "Remove all vice counters from target Stereotype. Draw cards equal to counters removed."

**Nerds (exploit presence):**
- `Spreadsheet Assassin`: "If target has vice counters, destroy it."
- `Logical Fallacy`: "Gain +200 Reputation for each vice counter on the field."

**Goodies (cleanse) — unchanged:**
- `Student Council President`: "Remove 1 vice counter from any Stereotype each Main Phase."
- `Meditation Session`: "Remove all vice counters from Stereotypes you control."

### Vice Flow

```
Dropouts pile vice on own monsters for power →
  risk Breakdown if they can't manage it
Freaks pile vice on opponent monsters →
  threaten Breakdown win condition
Preps redirect vice away from themselves →
  dump problems on opponents
Geeks convert vice into card advantage →
  turn problems into fuel
Nerds exploit vice as a condition →
  punish anyone with counters
Goodies cleanse vice →
  deny the entire mechanic
```

### Balance Levers

- `breakdownThreshold`: 3 (vice counters to trigger breakdown)
- `maxBreakdownsToWin`: 3 (breakdowns to win)
- Total: 9 vice counters across 3 monsters to win via breakdown

---

## 3. Clout Cost Curve and Stat Rebalancing

### Clout Costs Replace Tributes

No monster sacrificing. The `cost` field = clout cost to play.

| Cost | Power Level | Available From | Use Case |
|:----:|------------|:--------------:|----------|
| **1** | Weak bodies, utility effects | Turn 1 | Low-ATK stereotypes, basic spells, most traps |
| **2** | Mid-range, solid effects | Turn 2 | Core stereotypes, strong spells, field spells |
| **3** | Heavy hitters, powerful effects | Turn 3 | Boss monsters, game-changing spells |
| **4** | Finishers, build-around | Turn 4+ | 1 per archetype — signature card |

### Per-Archetype Cost Distribution (5 monsters each)

Each archetype: 2 at cost 1, 2 at cost 2, 1 at cost 3 or 4.

### Spell/Trap Costs

- Basic spells: cost 1
- Strong spells: cost 2
- Field spells: cost 2
- Traps: cost 1-2 (set face-down at cost, activate free)

### Stat Rebalancing (compress 22% gap to ~10%)

| Archetype | Current Total | Target Total | Delta |
|-----------|:------------:|:------------:|:-----:|
| Dropouts | 2860 | 2950 | +90 |
| Geeks | 2940 | 2980 | +40 |
| Freaks | 3000 | 3020 | +20 |
| Preps | 3280 | 3150 | -130 |
| Nerds | 3360 | 3200 | -160 |
| Goodies | 3500 | 3250 | -250 |

New range: 2950 – 3250 (~10% gap).

### Flagship Card Cost Assignments

| Card | Old Cost | New Cost | Rationale |
|------|:--------:|:--------:|-----------|
| Crypto All-In Carl (Dropout) | 1 | 3 | ATK 2000 + self-vice effects |
| Washed Varsity Legend (Prep) | 2 | 4 | ATK 2100, highest ATK in game |
| Afterparty Goblin (Freak) | 2 | 3 | ATK 2000, opponent vice aggression |
| Test Curve Tyrant (Nerd) | 2 | 3 | DEF 2100, vice exploitation |
| Attendance Award Annie (Goodie) | 1 | 3 | DEF 2200, near-unkillable wall |
| Indie Dev Dropout (Geek) | 1 | 3 | ATK 1800, combo enabler |

### Engine Changes Required

**Remove tribute system** from `summoning.ts`. Replace with clout cost check:
```typescript
// Old: level >= 7 requires tribute
// New: check clout cost
const cardDef = state.cardLookup[command.cardId];
const cost = cardDef.cost ?? 1;
const availableClout = getSeatClout(state, seat);
if (cost > availableClout) return []; // Can't afford
```

**Add clout tracking** to phase transitions:
- On `TURN_STARTED`: set clout = min(turnNumber, maxCloutPerTurn)
- On card play: deduct cost from clout

---

## 4. Effect Parser — Implementing Dropped Operations

### New EffectAction Types

| New Action | Maps From | Behavior |
|------------|-----------|----------|
| `modify_cost` | `MODIFY_COST:` | Temporarily change clout costs for a card type |
| `scry` | `VIEW_TOP_CARDS:` | Look at top N cards of deck, reorder |
| `reveal_hand` | `REVEAL_HAND` | Reveal opponent hand until end of turn |
| `redirect_attack` | Mood Swing | Change attack target |
| `copy_effect` | `ACTIVATE_TRAPS_TWICE` | Repeat a triggered effect |
| `negate_and_reverse` | `REVERSE_EFFECT` | Negate effect, apply to caster |
| `modify_reputation` | `MODIFY_STAT: reputation` | Add/subtract player Reputation |
| `modify_stability` | `MODIFY_STAT: stability` | Add/subtract player Stability |
| `random_discard` | `DISCARD: N random` | Discard N random cards from target hand |

### Scaling Operations Fix

Add `scaling` field to EffectAction:
```typescript
scaling?: {
  per: "controlled_archetype" | "graveyard_cards" | "hand_size" | "vice_counters" | "spells_in_graveyard";
  archetype?: string;
  multiplier: number;
}
```

`"+200 per Dropout you control"` becomes:
```typescript
{
  type: "modify_reputation",
  amount: 200,
  scaling: { per: "controlled_archetype", archetype: "dropout", multiplier: 200 }
}
```

Engine resolves scaling at execution by counting the quantity and multiplying.

### Reputation/Stability Mapping Fix

| Card Text | Old Output | New Output |
|-----------|-----------|------------|
| `reputation +500` | `boost_attack: 500` | `modify_reputation: +500` (player resource) |
| `reputation -300 to opponent` | `damage: 300` | `modify_reputation: -300, target: opponent` |
| `stability +400` | `boost_defense: 400` | `modify_stability: +400` (player resource) |
| `stability -500 to self` | `damage: 500` | `modify_stability: -500, target: self` |

**ATK/DEF boosts remain separate** — "this card gains +300 ATK" is still `boost_attack` on the monster.

### Power Outlier Fixes

| Card | Problem | Fix |
|------|---------|-----|
| College Campus (Preps field) | "All spells cost 0" = free spells | "Spells cost 1 less clout (minimum 1)" |
| Party Queen Bri (Preps) | "+300 rep to ALL stereotypes" | "Your Prep Stereotypes gain +300 Reputation" |
| Gas Station Mystic (Freaks) | "Opponent discards ALL cards" | "Opponent discards 2 random cards" |
| Street Art Alley (Freaks field) | "Freaks immune to traps" | "Freaks can't be targeted by opponent Normal Traps" |

---

## 5. Archetype Targeting Rebalance

Each archetype is targeted by exactly 2 others (symmetric hate web).

### Hate Web

| Archetype | Field Spells Punish | Punished By |
|-----------|-------------------|-------------|
| **Dropouts** | Preps, Freaks | Goodies, Nerds |
| **Preps** | Dropouts, Goodies | Dropouts, Freaks |
| **Geeks** | Nerds, Freaks | Goodies, Preps |
| **Freaks** | Preps, Nerds | Dropouts, Geeks |
| **Nerds** | Goodies, Dropouts | Geeks, Freaks |
| **Goodies** | Dropouts, Geeks | Preps, Nerds |

### Field Spell Changes

| Field Spell | Current Target | New Target | Reason |
|-------------|---------------|------------|--------|
| Back Alley Poker Night (Dropout) | Neutral | Anti-Freaks | Dropouts need 2nd hate target |
| Unpaid Internship (Dropout) | Anti-Preps | Anti-Preps | Stays |
| Class Reunion (Prep) | Anti-Dropouts | Anti-Dropouts | Stays |
| College Campus (Prep) | Neutral | Anti-Goodies | Preps need 2nd hate target |
| LAN Arena (Geek) | Neutral | Anti-Nerds | Geeks gain hate target |
| Hackathon (Geek) | Neutral | Anti-Freaks | Geeks gain 2nd hate target |
| Underground Club (Freak) | Anti-Preps | Anti-Preps | Stays |
| Street Art Alley (Freak) | Neutral | Anti-Nerds | Freaks gain 2nd hate target |
| Debate Hall (Nerd) | Anti-Preps | Anti-Goodies | Redirect |
| Campus Lab (Nerd) | Neutral | Anti-Dropouts | Nerds gain hate target |
| Soup Kitchen (Goodie) | Anti-Dropouts | Anti-Dropouts | Stays |
| Community Center (Goodie) | Anti-Freaks | Anti-Geeks | Redirect |

### Thematic Justifications

- Dropouts hate Freaks: "Freaks are too weird even for us"
- Preps hate Goodies: "Teacher's pets make us look bad"
- Geeks hate Nerds: "We build things; they just study"
- Geeks hate Freaks: "Chaos breaks our systems"
- Freaks hate Nerds: "Rules are for losers"
- Nerds hate Dropouts: "They waste their potential"
- Goodies hate Geeks: "Stop hacking the school WiFi"

---

## 6. Attribute Type Alignment

The engine defines `Attribute` as `"fire" | "water" | "earth" | "wind" | "dark" | "light" | "neutral"` but card data uses thematic strings (`"Crypto"`, `"Gambling"`, `"Status"`, etc.).

**Resolution**: Keep the thematic attribute strings. Update the engine's `Attribute` type to match:
```typescript
export type Attribute = string; // Thematic vice attributes (e.g., "Crypto", "Gambling", "Status")
```

Attributes are display/flavor only — no gameplay mechanics reference them. The type just needs to not reject valid data.

---

## 7. Summary of All Engine File Changes

| File | Changes |
|------|---------|
| `types/state.ts` | Replace LP with reputation/stability/clout fields. Add new WinReason values. |
| `types/config.ts` | Add startingReputation, reputationToWin, startingStability, maxCloutPerTurn. |
| `types/cards.ts` | Add scaling to EffectAction. Add new action types. Widen Attribute type. |
| `types/events.ts` | Add REPUTATION_CHANGED, STABILITY_CHANGED, CLOUT_SPENT, CLOUT_GAINED events. |
| `engine.ts` | Update createInitialState, evolve (new events), decide (clout checks). Remove LP checks. |
| `rules/summoning.ts` | Replace tribute system with clout cost check. |
| `rules/combat.ts` | Battle damage reduces Stability instead of LP. |
| `rules/vice.ts` | Stability collapse triggers mass breakdown. |
| `rules/stateBasedActions.ts` | Check reputation win, stability loss, in addition to breakdown/deckout. |
| `effectParser.ts` | Implement all dropped operations. Fix reputation/stability mapping. Add scaling. |
| `convex/cardData.ts` | Rebalance costs, stats, effects, field spell targets, vice counter operations. |
| `convex/game.ts` | Update AI turn logic, match creation, player view. |
