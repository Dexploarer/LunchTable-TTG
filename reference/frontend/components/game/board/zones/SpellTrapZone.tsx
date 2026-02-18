"use client";

import type { Id } from "@convex/_generated/dataModel";
import type { CardInZone } from "../../hooks/useGameBoard";
import { BoardCard, EmptySlot } from "../cards/BoardCard";

interface SpellTrapZoneProps {
  cards: CardInZone[];
  isOpponent?: boolean;
  selectedCard?: Id<"cardDefinitions"> | null;
  activatableCards?: Set<Id<"cardDefinitions">>;
  onCardClick?: (card: CardInZone) => void;
  onEmptySlotClick?: (index?: number) => void;
}

export function SpellTrapZone({
  cards,
  isOpponent = false,
  selectedCard,
  activatableCards,
  onCardClick,
  onEmptySlotClick,
}: SpellTrapZoneProps) {
  // Backrow has 5 slots max
  const slots = Array.from({ length: 5 }, (_, i) => cards[i] ?? null);

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider text-slate-500">
        Backrow
      </span>
      <div className="flex items-center gap-0.5">
        {slots.map((card, index) => {
          const key = `backrow-slot-${index}`;
          return card ? (
            <BoardCard
              key={key}
              card={card}
              size="xs"
              showStats={false}
              isOpponent={isOpponent}
              isSelected={selectedCard === card.instanceId}
              isActivatable={activatableCards?.has(card.instanceId) ?? false}
              onClick={() => onCardClick?.(card)}
            />
          ) : (
            <EmptySlot
              key={key}
              size="xs"
              onClick={!isOpponent ? () => onEmptySlotClick?.(index) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
