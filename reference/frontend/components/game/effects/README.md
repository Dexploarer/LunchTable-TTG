# Effect Visual Feedback System

Comprehensive visual feedback system for card effect resolution in the LTCG game.

## Overview

This system provides clear visual indicators when effects trigger and resolve, helping players understand game state changes through:

1. **Toast Notifications** - Categorized toasts for every effect activation
2. **Floating Numbers** - Animated stat changes and damage indicators
3. **Card Animations** - Glow, flash, pulse, and shake effects on affected cards
4. **State Indicators** - Badges showing continuous effects and OPT/HOPT usage
5. **Effect Queue** - Widget displaying pending effects in resolution order

## Components

### 1. EffectFeedback Component

Location: `apps/web/src/components/game/effects/EffectFeedback.tsx`

Main component providing floating numbers and card animations.

#### Usage

```tsx
import { EffectFeedback, useEffectFeedback } from "./effects/EffectFeedback";

function GameBoard() {
  const effectFeedback = useEffectFeedback();

  // Show stat change
  const handleStatBoost = (cardElement: HTMLElement) => {
    effectFeedback.showStatChange("card-123", "attack", 500, cardElement);
  };

  // Show damage
  const handleDamage = (cardElement: HTMLElement) => {
    effectFeedback.showDamage("card-123", 1000, cardElement);
  };

  // Show card targeted
  effectFeedback.showCardTargeted("card-123");

  // Show card activated
  effectFeedback.showCardActivated("card-123");

  return (
    <>
      {/* Render feedback */}
      <EffectFeedback
        floatingNumbers={effectFeedback.floatingNumbers}
        animations={effectFeedback.animations}
      />
    </>
  );
}
```

#### Floating Number Types

- `attack` - Red sword icon with +/- attack change
- `defense` - Blue shield icon with +/- defense change
- `damage` - Red zap icon for damage dealt
- `heal` - Green sparkles for life point recovery
- `draw` - Purple sparkles for card draw
- `generic` - Yellow sparkles for other effects

#### Animation Types

- `glow` - Pulsing glow effect (0.8s)
- `flash` - Rapid flash effect (0.6s)
- `pulse` - Continuous pulse (configurable)
- `shake` - Shake animation (0.5s)
- `highlight` - Emphasis highlight (0.8s)

#### Animation Colors

- `green` - Positive effects (boost, protect)
- `red` - Negative effects (damage, destroy)
- `blue` - Neutral effects (draw, search)
- `purple` - Targeting
- `gold` - Activation
- `white` - Generic highlight

### 2. EffectQueueWidget Component

Location: `apps/web/src/components/game/effects/EffectQueueWidget.tsx`

Displays pending effects waiting to resolve in order.

#### Usage

```tsx
import { EffectQueueWidget, type QueuedEffect } from "./effects/EffectQueueWidget";

function GameBoard() {
  const [effectQueue, setEffectQueue] = useState<QueuedEffect[]>([
    {
      id: "effect-1",
      cardName: "Dark Magician",
      effectDescription: "Destroy 1 Spell/Trap card your opponent controls",
      cardImageUrl: "/cards/dark-magician.png",
      playerName: "Player 1",
      isPlayerEffect: true,
      chainLink: 1,
    },
  ]);

  return (
    <EffectQueueWidget
      effects={effectQueue}
      isResolving={false}
    />
  );
}
```

### 3. Enhanced Toast Notifications

Location: `apps/web/src/lib/effectToasts.ts`

Categorized toast system with icons and colors for different effect types.

#### Usage

```tsx
import {
  showEffectActivated,
  showEffectResolved,
  showCardDestroyed,
  showDamageDealt,
  showCardSummoned,
  showStatBoost,
  categorizeEffect,
} from "@/lib/effectToasts";

// Activation
showEffectActivated("Dark Magician", "Destroy 1 Spell/Trap");

// Resolution with auto-categorization
const category = categorizeEffect("Destroy 1 Spell/Trap on the field");
showEffectResolved("Dark Magician", "Destroyed Magic Cylinder", category);

// Specific effects
showCardDestroyed("Blue-Eyes White Dragon", false); // by effect
showCardDestroyed("Red-Eyes Black Dragon", true);   // by battle
showDamageDealt("Opponent", 1500);
showCardSummoned("Dark Magician Girl", true); // special summon
showStatBoost("Dark Magician", "ATK", 500);
```

#### Effect Categories

- `summon` - Normal summon (green sparkles)
- `special_summon` - Special summon (purple sparkles)
- `destroy` - Card destruction (red trash)
- `damage` - Damage dealt (orange zap)
- `heal` - Life point recovery (pink heart)
- `draw` - Card draw (blue sparkles)
- `search` - Deck/GY search (cyan target)
- `boost` - Stat increase (green arrow up)
- `debuff` - Stat decrease (red arrow down)
- `protect` - Protection effect (amber shield)
- `target` - Targeting (purple target)
- `negate` - Effect negation (red ban)
- `battle` - Battle-related (orange swords)
- `generic` - Other effects (purple sparkles)

### 4. BoardCard Enhancements

Location: `apps/web/src/components/game/board/cards/BoardCard.tsx`

Added indicators for card states:

#### New Props

```tsx
interface BoardCardProps {
  // ... existing props
  effectUsed?: boolean;           // OPT/HOPT used this turn
  hasContinuousEffect?: boolean;  // Continuous effect active
}
```

#### State Badges

- **Protection Badges** (left side, top):
  - Amber shield - Cannot be destroyed by battle
  - Emerald sparkles - Cannot be destroyed by effects
  - Purple ban - Cannot be targeted
  - Cyan zap (pulsing) - Continuous effect active

- **Usage Badge** (right side, top):
  - Gray checkmark - Effect used this turn (OPT/HOPT)

#### Data Attribute

All BoardCard components now have `data-card-id` attribute for animation targeting:

```tsx
<motion.button data-card-id={card.instanceId} />
```

## Integration in GameBoard

The system is integrated into `GameBoard.tsx`:

```tsx
// 1. Import components
import { EffectFeedback, useEffectFeedback } from "./effects/EffectFeedback";
import { EffectQueueWidget, type QueuedEffect } from "./effects/EffectQueueWidget";
import { categorizeEffect, showEffectActivated } from "@/lib/effectToasts";

// 2. Initialize hooks
const effectFeedback = useEffectFeedback();
const [effectQueue, setEffectQueue] = useState<QueuedEffect[]>([]);

// 3. Use in effect handlers (example)
useEffect(() => {
  if (!gameEvents || gameEvents.length === 0) return;

  gameEvents.forEach((event) => {
    const cardName = event.metadata?.cardName;
    const description = event.description || "Effect activated";

    showEffectActivated(cardName || "Card Effect", description);
  });
}, [gameEvents]);

// 4. Render components
return (
  <>
    {/* ... game board UI ... */}

    {/* Effect Feedback System */}
    <EffectFeedback
      floatingNumbers={effectFeedback.floatingNumbers}
      animations={effectFeedback.animations}
    />

    {/* Effect Queue Widget */}
    {effectQueue.length > 0 && (
      <EffectQueueWidget
        effects={effectQueue}
        isResolving={false}
      />
    )}
  </>
);
```

## Styling

### CSS Animations

Location: `apps/web/app/globals.css`

New animations added:

- `@keyframes stat-boost` - Floating number animation
- `@keyframes card-glow` - Card glow effect
- `@keyframes card-flash` - Flash effect
- `@keyframes card-shake` - Shake effect
- `@keyframes effect-pulse` - Continuous pulse

Utility classes:

- `.animate-stat-boost`
- `.animate-card-glow`
- `.animate-card-flash`
- `.animate-card-shake`
- `.animate-effect-pulse`

### Framer Motion

The system uses `framer-motion` for smooth animations:

- Floating numbers: Opacity, scale, and vertical movement
- Card animations: Overlay with position-based effects
- Effect queue: Layout animations for entering/exiting items

## Testing Guide

### Manual Testing Steps

1. **Toast Notifications**
   - Activate a spell card
   - Verify toast appears with correct icon and color
   - Test different effect types (destroy, damage, boost, etc.)

2. **Card Highlighting**
   - Target a card with an effect
   - Verify purple highlight animation appears
   - Check animation completes smoothly

3. **Stat Changes**
   - Activate an ATK/DEF boosting effect
   - Verify floating number appears above card
   - Check color (green for boost, red for reduction)

4. **State Indicators**
   - Check protection badges appear on protected cards
   - Verify OPT indicator shows after effect activation
   - Test continuous effect badge (pulsing)

5. **Effect Queue**
   - Build a chain with multiple effects
   - Verify queue widget appears on right side
   - Check effects display in correct order
   - Verify chain link numbers

6. **Damage Animation**
   - Deal damage to a monster
   - Verify shake animation and red damage number
   - Test battle damage vs effect damage

### Automated Testing

```typescript
// Example test structure
describe("Effect Feedback System", () => {
  it("should display floating number on stat change", () => {
    const { showStatChange } = useEffectFeedback();
    const mockElement = document.createElement("div");

    showStatChange("card-123", "attack", 500, mockElement);

    // Assert floating number appears with correct value
  });

  it("should categorize effects correctly", () => {
    expect(categorizeEffect("Destroy 1 card")).toBe("destroy");
    expect(categorizeEffect("Gain 500 ATK")).toBe("boost");
    expect(categorizeEffect("Draw 2 cards")).toBe("draw");
  });

  it("should show toast for effect activation", () => {
    const toastSpy = jest.spyOn(toast, "success");

    showEffectActivated("Dark Magician", "Destroy 1 Spell/Trap");

    expect(toastSpy).toHaveBeenCalled();
  });
});
```

## Performance Considerations

1. **Floating Numbers**: Auto-remove after 1.5s to prevent memory leaks
2. **Animations**: Duration-based cleanup with setTimeout
3. **Effect Queue**: Limited to visible items with virtual scrolling
4. **Toast Throttling**: Sonner handles deduplication automatically

## Future Enhancements

1. **Sound Effects**: Add audio cues for different effect types
2. **Particle Effects**: Enhanced visual effects for high-impact moves
3. **Battle Damage Calculator**: Show damage calculation breakdown
4. **Effect History Log**: Persistent log of all effects this game
5. **Customizable Animations**: Player preferences for animation speed/style
6. **Mobile Optimization**: Simplified effects for smaller screens

## Troubleshooting

### Issue: Floating numbers not appearing
- **Check**: Card has `data-card-id` attribute
- **Check**: Element is mounted before animation triggers
- **Solution**: Ensure `useEffectFeedback` is called at component level

### Issue: Animations lag or stutter
- **Check**: Too many simultaneous animations
- **Solution**: Implement animation queue or reduce concurrent effects

### Issue: Toast notifications duplicated
- **Check**: Effect handler called multiple times
- **Solution**: Add debouncing or use event timestamps

### Issue: Effect queue not updating
- **Check**: State updates are immutable
- **Solution**: Use spread operator when updating queue array

## API Reference

See inline TypeScript documentation in each component file for detailed API reference.
