# Playable Game Board + Complete Engine — Design Doc

**Date**: 2026-02-15
**Status**: Approved
**Scope**: Interactive game board UI, spell/trap effects, card effect system, chain/priority, AI opponent, graveyard/banished browsers

---

## 1. Overview

Make LunchTable TCG fully playable for humans and agents. Four workstreams:

1. **Game Board UI** — Interactive frontend for humans to play matches
2. **Card Effect System** — Implement all 132 card effects in the engine
3. **Chain/Priority System** — Enable trap responses and spell chains
4. **AI Opponent** — Replace END_TURN stub with real decision logic

## 2. Architecture

### Data Flow

```
Human clicks card → ActionSheet opens → User picks action
  → useGameActions.submitCommand(command)
    → convex/game.ts:submitAction(matchId, command, seat)
      → match component: decide(state, command) → events
      → match component: evolve(state, events) → newState
      → snapshot persisted, events logged
    → AI turn scheduled (500ms delay)
      → executeAITurn: build command from heuristics
      → same decide/evolve loop
  → Frontend re-renders via Convex reactive query
```

### Key Constraint: Unified submitAction

All game actions flow through one mutation: `submitAction({ matchId, command: JSON, seat })`. Commands are engine `Command` types serialized as JSON. No granular mutations.

## 3. Game Board UI

### Layout (full viewport, no scroll)

```
┌──────────────────────────────────┐
│ [Surrender]  Turn X  Phase  [LP] │  ← Opponent info bar
├──────────────────────────────────┤
│    ☐ ☐ ☐ ☐ ☐  (face-down hand)  │  ← Opponent hand (count only)
├──────────────────────────────────┤
│  [GY] [Spell/Trap row - 5 slots] │  ← Opponent backrow
│       [Monster row - 5 slots]     │  ← Opponent field
├──── ═══ Phase Bar ═══ ───────────┤  ← Phase indicator (center)
│       [Monster row - 5 slots]     │  ← Player field
│  [GY] [Spell/Trap row - 5 slots] │  ← Player backrow
├──────────────────────────────────┤
│  ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐      │  ← Player hand (fan, interactive)
│  └─┘ └─┘ └─┘ └─┘ └─┘ └─┘      │
├──────────────────────────────────┤
│ [LP Bar]  [Next Phase] [End Turn]│  ← Player controls
└──────────────────────────────────┘
```

### Components

| Component | File | Purpose |
|-----------|------|---------|
| GameBoard | `components/game/GameBoard.tsx` | Root layout, orchestrates everything |
| useGameState | `components/game/hooks/useGameState.ts` | Query PlayerView, derive valid actions, card lookup |
| useGameActions | `components/game/hooks/useGameActions.ts` | Wrapper around submitAction for each command type |
| HandCard | `components/game/HandCard.tsx` | Fan-layout card in hand, playable glow |
| PlayerHand | `components/game/PlayerHand.tsx` | Fan container with arc/rotation math |
| BoardSlot | `components/game/BoardSlot.tsx` | Single zone slot (empty, monster, or spell/trap) |
| FieldRow | `components/game/FieldRow.tsx` | Row of 5 BoardSlots |
| PhaseBar | `components/game/PhaseBar.tsx` | Visual phase indicator |
| LPBar | `components/game/LPBar.tsx` | Life points with damage flash |
| ActionSheet | `components/game/ActionSheet.tsx` | Bottom sheet: summon/set/activate options |
| TributeSelector | `components/game/TributeSelector.tsx` | Pick tributes from field |
| AttackTargetSelector | `components/game/AttackTargetSelector.tsx` | Pick attack target |
| GraveyardBrowser | `components/game/GraveyardBrowser.tsx` | Scrollable graveyard/banished viewer |
| ChainPrompt | `components/game/ChainPrompt.tsx` | "Activate trap in response?" prompt |
| GameOverOverlay | `components/game/GameOverOverlay.tsx` | Victory/defeat with rewards |

### Interaction Flows

**Summon a monster:**
1. Click hand card (main phase, your turn)
2. ActionSheet opens: "Summon ATK" / "Summon DEF" / "Set Face-Down" / Cancel
3. If level 5-6: TributeSelector for 1 tribute. Level 7+: 2 tributes.
4. Submit SUMMON/SET_MONSTER command
5. Card moves from hand to field with animation

**Attack:**
1. Click your monster (combat phase, your turn, canAttack=true)
2. AttackTargetSelector opens: opponent monsters + "Direct Attack" if field empty
3. Shows battle prediction (ATK vs ATK/DEF, win/lose indicator)
4. Submit DECLARE_ATTACK command
5. Damage resolves, LP updates

**Activate spell/trap:**
1. Click spell in hand → ActionSheet: "Activate" / "Set Face-Down"
2. Click face-down backrow card → "Activate" (if valid timing)
3. Submit ACTIVATE_SPELL or ACTIVATE_TRAP
4. Effect resolves via card effect system

**Chain response:**
1. Opponent activates something → ChainPrompt appears
2. "Activate [trap name] in response?" / "Pass"
3. Timer (5s) auto-passes if no response
4. Submit CHAIN_RESPONSE command

**Browse graveyard:**
1. Click GY icon next to backrow
2. GraveyardBrowser overlay opens
3. Scrollable list of cards with full details
4. Close to return to board

### Styling (Zine Aesthetic)

- Cards: `paper-panel` with ink borders, no rounded corners
- Playable cards: yellow `#ffcc00` pulsing border
- Selected cards: thick ink border + lift shadow
- Empty slots: dashed border, low opacity
- Phase bar: ink stripe with phase name in Special Elite font
- LP: bold Outfit font, damage flashes red, healing flashes green
- Opponent hand: face-down cards shown as small ink rectangles
- Board background: paper texture with noise overlay

## 4. Card Effect System

### Architecture: Effect Interpreter

Instead of hardcoding 132 effects, build a small interpreter that reads the `ability` field from card definitions.

```typescript
// Engine: src/effects/interpreter.ts
function executeEffect(
  state: GameState,
  card: CardDefinition,
  abilityIndex: number,
  targets: string[]
): EngineEvent[] {
  const ability = card.ability[abilityIndex];
  const events: EngineEvent[] = [];

  for (const op of ability.operations) {
    events.push(...executeOperation(state, op, card, targets));
  }

  return events;
}
```

### Operation Handlers

| Operation | Engine Events Generated |
|-----------|----------------------|
| `DESTROY: target` | CARD_DESTROYED → card moves to graveyard |
| `MODIFY_STAT: stat +/-amount` | STAT_MODIFIED → temporary boost on BoardCard |
| `DRAW: count` | CARD_DRAWN × count |
| `DAMAGE: amount` | DIRECT_DAMAGE → LP reduction |
| `HEAL: amount` | LP_HEALED → LP increase |
| `ADD_VICE: count` | VICE_COUNTER_ADDED → counter increment |
| `REMOVE_VICE: count` | VICE_COUNTER_REMOVED → counter decrement |
| `SPECIAL_SUMMON: from` | MONSTER_SPECIAL_SUMMONED → card to field from GY/hand/banished |
| `BANISH: target` | CARD_BANISHED → remove from game |
| `RETURN_TO_HAND: target` | CARD_RETURNED → bounce to hand |

### New Engine Events

Add to `types/events.ts`:
```typescript
| { type: "CARD_DESTROYED"; cardId: string; owner: Seat }
| { type: "STAT_MODIFIED"; cardId: string; stat: "attack" | "defense"; amount: number }
| { type: "DIRECT_DAMAGE"; target: Seat; amount: number; source: string }
| { type: "LP_HEALED"; target: Seat; amount: number }
| { type: "MONSTER_SPECIAL_SUMMONED"; cardId: string; from: string; position: Position; owner: Seat }
| { type: "CARD_BANISHED"; cardId: string; owner: Seat }
| { type: "CARD_RETURNED"; cardId: string; to: "hand" | "deck"; owner: Seat }
| { type: "SPELL_RESOLVED"; cardId: string }
| { type: "TRAP_RESOLVED"; cardId: string }
```

### Wiring into decide()

Update `decideActivateSpell()` and `decideActivateTrap()`:
1. Look up card definition from state.cardLookup
2. Validate trigger conditions
3. Call `executeEffect()` to generate events
4. Append SPELL_RESOLVED/TRAP_RESOLVED event
5. Return all events

### evolve() handlers

For each new event type, update state:
- CARD_DESTROYED: remove from board/zone → add to graveyard
- STAT_MODIFIED: update BoardCard.temporaryBoosts
- DIRECT_DAMAGE: reduce lifePoints
- LP_HEALED: increase lifePoints (capped at max)
- MONSTER_SPECIAL_SUMMONED: move card to board
- CARD_BANISHED: move to banished zone
- CARD_RETURNED: move to hand/deck
- SPELL_RESOLVED: move spell to graveyard (or banish if specified)
- TRAP_RESOLVED: move trap to graveyard

## 5. Chain/Priority System

### Model

Simple 2-player chain stack (no complex priority windows):

1. Player activates spell/trap → chain link 1
2. Opponent gets priority → can activate trap in response (chain link 2)
3. Priority passes back → can add chain link 3
4. Both pass → chain resolves LIFO (last-in-first-out)

### State Additions

```typescript
// In GameState
currentChain: ChainLink[]
priorityPlayer: Seat | null  // Who has priority to respond
waitingForChainResponse: boolean

// ChainLink
{ cardId: string; owner: Seat; abilityIndex: number; targets: string[] }
```

### Flow

1. `decideActivateSpell(state, command)` → pushes chain link, sets `priorityPlayer` to opponent
2. Frontend shows ChainPrompt to opponent
3. Opponent submits `CHAIN_RESPONSE { cardId, pass: false }` → adds trap to chain, priority flips
4. Or `CHAIN_RESPONSE { pass: true }` → if both passed, resolve chain
5. Chain resolves LIFO: execute each link's effect from top to bottom

### Speed System (from card data)

- Speed 1: Normal spells, monster effects → can only start a chain
- Speed 2: Traps, quick-play spells → can respond to chain links

### Frontend

ChainPrompt component:
- Shows "Opponent activated [card]! Respond?"
- Lists activatable traps/quick-play spells
- 5-second auto-pass timer
- Pass button

## 6. AI Opponent

### Replace executeAITurn stub

```typescript
// convex/game.ts: executeAITurn
async function executeAITurn(ctx, { matchId }) {
  const view = getPlayerView(matchId, "away");
  const allCards = getAllCards();

  // Phase loop: advance through phases, take actions
  while (view.currentTurnPlayer === "away" && !view.gameOver) {
    const command = pickAICommand(view, allCards);
    if (!command) break;
    await submitAction(matchId, command, "away");
    // Re-query view after action
    view = getPlayerView(matchId, "away");
  }
}
```

### Decision Heuristics (pickAICommand)

**Main phase:**
1. Summon strongest monster from hand (ATK position)
2. Set spell/trap if backrow has space
3. Activate face-up spells if applicable
4. Advance to combat

**Combat phase:**
1. For each monster that canAttack (sorted by ATK desc):
   - If opponent has no monsters: direct attack
   - If opponent has weaker monster: attack it
   - Skip if all targets are stronger
2. Advance to main2

**Main2:**
1. Set any remaining spell/traps
2. End turn

**Chain response:**
1. If have activatable trap and chain would hurt: activate
2. Otherwise pass

### legalMoves() completion

Implement `legalMoves(state, seat)` in engine to return all valid commands:
- Check phase, turn player, hand contents, board state
- Return concrete Command objects (with specific cardIds)
- Used by AI to enumerate options and by frontend to highlight playable cards

## 7. Graveyard/Banished Browsers

### GraveyardBrowser component

- Triggered by clicking GY/Banished pile icon
- Full-screen overlay (z-50)
- Scrollable grid of cards
- Each card shows: name, type, ATK/DEF, archetype color
- Close button returns to board
- Works for both player and opponent graveyards
- Opponent's is always visible (public zone)

## 8. File Changes Summary

### New Files

```
apps/web/src/components/game/
  GameBoard.tsx           # Root board layout
  PlayerHand.tsx          # Fan hand container
  HandCard.tsx            # Individual hand card
  FieldRow.tsx            # 5-slot zone row
  BoardSlot.tsx           # Single board slot
  PhaseBar.tsx            # Phase indicator
  LPBar.tsx               # Life point bar
  ActionSheet.tsx         # Bottom sheet for actions
  TributeSelector.tsx     # Tribute picker
  AttackTargetSelector.tsx # Attack target picker
  GraveyardBrowser.tsx    # GY/banished viewer
  ChainPrompt.tsx         # Chain response prompt
  GameOverOverlay.tsx     # Win/lose overlay
  hooks/
    useGameState.ts       # PlayerView query + derived state
    useGameActions.ts     # Command submission wrappers

packages/engine/src/
  effects/
    interpreter.ts        # Card effect interpreter
    operations.ts         # Operation handlers (DESTROY, DRAW, etc.)
  rules/
    chain.ts              # Chain/priority logic
```

### Modified Files

```
packages/engine/src/
  engine.ts               # Wire effects into decide(), complete legalMoves()
  types/events.ts         # Add new event types
  types/state.ts          # Add chain state fields
  rules/spellsTraps.ts    # Implement activation logic
  rules/combat.ts         # Wire in effect triggers (OnDestroy, etc.)

convex/
  game.ts                 # Replace AI stub with heuristic logic

apps/web/src/
  pages/Play.tsx          # Replace skeleton with GameBoard
```

## 9. Implementation Order

1. **Engine: legalMoves()** — foundation for UI + AI
2. **Engine: card effect interpreter** — DESTROY, DRAW, DAMAGE, HEAL, MODIFY_STAT, etc.
3. **Engine: spell/trap activation** — wire effects into decideActivateSpell/Trap
4. **Engine: chain system** — ChainLink state, priority, LIFO resolution
5. **Engine: new events + evolve handlers** — CARD_DESTROYED, STAT_MODIFIED, etc.
6. **Frontend: GameBoard + hooks** — layout, useGameState, useGameActions
7. **Frontend: hand + field components** — HandCard, PlayerHand, FieldRow, BoardSlot
8. **Frontend: action flows** — ActionSheet, TributeSelector, AttackTargetSelector
9. **Frontend: chain + browsers** — ChainPrompt, GraveyardBrowser
10. **Frontend: polish** — PhaseBar, LPBar, GameOverOverlay, animations
11. **Backend: AI opponent** — Replace stub with heuristic decision engine
12. **Integration testing** — Full match flow human vs AI
