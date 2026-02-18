# Vice & Breakdown System

The vice/breakdown mechanic is LunchTable TCG's signature alternate win condition. Every stereotype (monster) card carries a thematic vice -- a character flaw that can spiral into self-destruction.

---

## Core Concept

Vice counters accumulate on stereotype cards on the board. When a monster reaches the breakdown threshold, it is destroyed. Cause enough breakdowns and you win the game -- even if your opponent's LP is untouched.

**Thematic hook**: Every character in the LunchTable universe has a vice. Push them too hard and they crack.

---

## Mechanics

### Vice Counters

- Every stereotype on the board tracks `viceCounters: number` (starts at 0)
- Counters are **public information** -- both players see all vice counter totals
- Counters cannot go below 0
- Added by `add_vice` effects, removed by `remove_vice` effects or costs

### Breakdown Check Phase

The turn phases are:

```
draw -> standby -> main -> combat -> main2 -> breakdown_check -> end
```

During `breakdown_check`, the engine scans both boards. Any stereotype with `viceCounters >= breakdownThreshold` (default: **3**) is destroyed:

1. `BREAKDOWN_TRIGGERED` event fires (identifies the seat + card)
2. `CARD_DESTROYED` event fires (reason: `"breakdown"`)
3. `CARD_SENT_TO_GRAVEYARD` event fires (card moves to graveyard/hallway)

Multiple monsters can break down simultaneously in a single check.

### Alternate Win Condition

When a player has **caused 3 breakdowns** on their opponent's monsters, they win with `winReason: "breakdown"`.

- Credit goes to the **opponent** of the player whose monster broke down
- This means: if *your* monster breaks down, your *opponent* gets +1 `breakdownsCaused`
- Three breakdowns = game over, regardless of LP

### Four Win Conditions

| Win Reason | How |
|------------|-----|
| `lp_zero` | Opponent's life points reach 0 |
| `deck_out` | Opponent's deck is empty when they need to draw |
| `breakdown` | You have caused 3 breakdowns on opponent's monsters |
| `surrender` | Opponent surrenders |

---

## Configuration

From `packages/engine/src/types/config.ts`:

```typescript
breakdownThreshold: 3    // Vice counters needed to trigger breakdown
maxBreakdownsToWin: 3    // Breakdowns needed for alternate win condition
```

Both are configurable per game via `EngineConfig`.

---

## Effect Actions

### Adding Vice Counters

```typescript
{ type: "add_vice"; count: number; target: "selected" }
```

Card effects place vice counters on a target stereotype. This is the primary way vices accumulate.

### Removing Vice Counters

```typescript
{ type: "remove_vice"; count: number; target: "selected" }
```

Card effects remove vice counters. The Goodie Two-Shoes archetype specializes in this ("vice suppression").

### Vice Removal as Cost

```typescript
{ type: "remove_vice"; count?: number; amount?: number }
```

Some effects require removing vice counters from your own monsters as an activation cost -- turning a liability into a resource.

---

## Engine Events

Three dedicated events power the vice system:

| Event | Fields | When |
|-------|--------|------|
| `VICE_COUNTER_ADDED` | `cardId`, `newCount` | Vice counter placed on a monster |
| `VICE_COUNTER_REMOVED` | `cardId`, `newCount` | Vice counter removed from a monster |
| `BREAKDOWN_TRIGGERED` | `seat`, `cardId` | Monster reaches threshold, about to be destroyed |

Additionally, `CARD_DESTROYED` fires with `reason: "breakdown"` when the card is actually destroyed.

---

## The 10 Canonical Vice Types

![The Ten-Fold Curse](/Users/home/.gemini/antigravity/brain/e67c5c5b-7a39-4849-ab1d-cb7bc6e34507/vice_master_splash_landscape_1771172852490.png)

Defined in `GAME_CONFIG.VICE_TYPES`. Each vice is a character flaw that can trigger a breakdown.

### 1. Gambling ::: ![Gambling](/Users/home/Desktop/LTCG-v2/apps/web/public/lunchtable/vices/gambling.png)
**Description:** Can't stop betting -- doubles down even when losing.

### 2. Alcohol ::: ![Alcohol](/Users/home/.gemini/antigravity/brain/e67c5c5b-7a39-4849-ab1d-cb7bc6e34507/vice_alcohol_comic_1771172385924.png)
**Description:** Party lifestyle that spirals out of control.

### 3. Social Media ::: ![Social Media](/Users/home/.gemini/antigravity/brain/e67c5c5b-7a39-4849-ab1d-cb7bc6e34507/vice_social_media_comic_1771172400411.png)
**Description:** Addicted to likes, shares, and online validation.

### 4. Crypto ::: ![Crypto](/Users/home/.gemini/antigravity/brain/e67c5c5b-7a39-4849-ab1d-cb7bc6e34507/vice_crypto_comic_1771172423409.png)
**Description:** All-in on digital assets, blind to risk.

### 5. Validation ::: ![Validation](/Users/home/.gemini/antigravity/brain/e67c5c5b-7a39-4849-ab1d-cb7bc6e34507/vice_validation_comic_retry_1771172446648.png)
**Description:** Desperate need for approval and recognition.

### 6. Conspiracy ::: ![Conspiracy](/Users/home/Desktop/LTCG-v2/apps/web/public/lunchtable/vices/conspiracy.png)
**Description:** Lost in paranoid theories, disconnected from reality.

### 7. Narcissism ::: ![Narcissism](/Users/home/.gemini/antigravity/brain/e67c5c5b-7a39-4849-ab1d-cb7bc6e34507/vice_narcissism_comic_1771172480416.png)
**Description:** Self-obsession that alienates everyone.

### 8. Adderall ::: ![Adderall](/Users/home/.gemini/antigravity/brain/e67c5c5b-7a39-4849-ab1d-cb7bc6e34507/vice_adderall_comic_1771172503606.png)
**Description:** Stimulant dependency, burnout from hyperfocus.

### 9. MLM ::: ![MLM](/Users/home/.gemini/antigravity/brain/e67c5c5b-7a39-4849-ab1d-cb7bc6e34507/vice_mlm_comic_1771172520609.png)
**Description:** Multi-level marketing delusion, hustle culture.

### 10. Rage ::: ![Rage](/Users/home/.gemini/antigravity/brain/e67c5c5b-7a39-4849-ab1d-cb7bc6e34507/vice_rage_comic_1771172538190.png)
**Description:** Uncontrolled anger that destroys relationships.

---

## Vice Types by Archetype

Every stereotype card has a thematic `viceType` that reflects its archetype's personality. The vice type is **cosmetic metadata** -- it doesn't change mechanics, but it drives art, flavor text, and thematic cohesion.

### Dropout (Red) -- Aggro

Fast, reckless, lives on the edge.

| Card | Vice | Rep/Stab |
|------|------|----------|
| Crypto All-In Carl | crypto | 2000/1000 |
| Back Alley Bookie | gambling | 1700/1200 |
| Detention Dealer | hustle | 1800/1100 |
| Late Rent Ricky | avoidance | 1600/900 |
| Community College King | delusion | 1500/1500 |

### Prep (Blue) -- Midrange

Popular, image-obsessed, climbing social ladders.

| Card | Vice | Rep/Stab |
|------|------|----------|
| Washed Varsity Legend | validation | 2100/1400 |
| Party Queen Bri | alcohol | 1900/1200 |
| Corporate Ladder Chad | ambition | 1800/1700 |
| Influencer Couple | social_media | 1600/1500 |
| Homecoming Committee | status | 1200/2000 |

### Geek (Yellow) -- Combo

Tech-savvy, obsessive, burns bright then burns out.

| Card | Vice | Rep/Stab |
|------|------|----------|
| Indie Dev Dropout | burnout | 1800/1000 |
| Keyboard Warrior | rage | 1700/1100 |
| LAN Party Larry | isolation | 1500/1500 |
| Hackathon Hero | adderall | 1400/1600 |
| Debugging Dana | perfectionism | 1300/1800 |

### Freak (Purple) -- Chaos

Unpredictable, countercultural, lives in their own reality.

| Card | Vice | Rep/Stab |
|------|------|----------|
| Afterparty Goblin | alcohol | 2000/900 |
| Tattooed Philosophy Major | existentialism | 1700/1400 |
| Conspiracy Kyle | paranoia | 1600/1300 |
| Basement Streamer | validation | 1500/1400 |
| Gas Station Mystic | conspiracy | 1400/1700 |

### Nerd (Green) -- Control

Calculated, rigid, cracks under self-imposed pressure.

| Card | Vice | Rep/Stab |
|------|------|----------|
| Scholarship Sniper | pressure | 1800/1600 |
| Spreadsheet Assassin | control | 1700/1700 |
| Lab Partner From Hell | micromanagement | 1600/1500 |
| Debate Team Captain | ego | 1500/1900 |
| Test Curve Tyrant | perfection | 1400/2100 |

### Goodie Two-Shoes (White) -- Attrition

Rule-followers who suppress vice but crack under the weight of their own standards.

| Card | Vice | Rep/Stab |
|------|------|----------|
| Volunteer Valedictorian | burnout | 1500/2100 |
| Student Council President | morality | 1600/2000 |
| Church Camp Survivor | repression | 1400/1900 |
| Hall Monitor Mark | authority | 1700/1800 |
| Attendance Award Annie | validation | 1300/2200 |

---

## Expanded Vice Vocabulary

The seed data uses 26 distinct vice types beyond the 10 canonical ones. These are valid `string` values (the schema uses `v.optional(v.string())`, not a constrained enum):

| Category | Vice Types |
|----------|------------|
| **Canonical 10** | gambling, alcohol, social_media, crypto, validation, conspiracy, narcissism, adderall, mlm, rage |
| **Self-Destruction** | burnout, avoidance, isolation, repression |
| **Ego/Control** | ambition, authority, control, ego, narcissism, status, validation |
| **Obsession** | perfectionism, perfection, micromanagement, pressure |
| **Ideology** | conspiracy, existentialism, paranoia, morality |
| **Hustle** | crypto, gambling, hustle, mlm, delusion |

---

## Strategic Implications

### Vice as Offense

Some archetypes weaponize vice counters:

- **Freak (Purple)** -- Chaos effects that pile vice counters on opponent monsters
- **Dropout (Red)** -- Aggressive effects that add vice as collateral damage

### Vice as Defense

Some archetypes manage or exploit their own vice:

- **Goodie Two-Shoes (White)** -- "Vice suppression" strategy: remove counters, high stability to survive
- **Nerd (Green)** -- Remove vice as activation cost, turning liability into resource

### Vice as Win Condition

The breakdown win path requires:
1. Get vice counters on 3 of your opponent's monsters (3+ counters each)
2. All 3 break down during breakdown_check phases
3. You win with `winReason: "breakdown"`

This creates a tension: do you invest in attacking LP directly, or do you invest in the slower but devastating vice route?

---

## Implementation Files

| File | What |
|------|------|
| `packages/engine/src/rules/vice.ts` | Core: addViceCounters, removeViceCounters, checkBreakdowns, evolveVice |
| `packages/engine/src/types/cards.ts` | add_vice, remove_vice actions; remove_vice cost; viceType metadata |
| `packages/engine/src/types/state.ts` | BoardCard.viceCounters, breakdownsCaused, WinReason |
| `packages/engine/src/types/events.ts` | VICE_COUNTER_ADDED, VICE_COUNTER_REMOVED, BREAKDOWN_TRIGGERED |
| `packages/engine/src/types/config.ts` | breakdownThreshold, maxBreakdownsToWin |
| `packages/engine/src/rules/phases.ts` | breakdown_check in phase order |
| `packages/engine/src/effectParser.ts` | REMOVE_COUNTERS maps to remove_vice |
| `packages/engine/src/__tests__/vice.test.ts` | 8 tests covering full vice lifecycle |
| `packages/core/src/config/gameConfig.ts` | VICE_TYPES enum, VICE constants |
| `data/lunchtable-seed-cards.json` | 60 cards with viceType assignments |
