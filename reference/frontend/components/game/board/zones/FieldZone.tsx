"use client";

import type { CardInZone } from "../../hooks/useGameBoard";
import { BoardCard, EmptySlot } from "../cards/BoardCard";

interface FieldZoneProps {
  card: CardInZone | null;
  isOpponent?: boolean;
  selectedCard?: string | null;
  onCardClick?: (card: CardInZone) => void;
  onEmptySlotClick?: () => void;
}

export function FieldZone({
  card,
  isOpponent = false,
  selectedCard,
  onCardClick,
  onEmptySlotClick,
}: FieldZoneProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[8px] sm:text-[10px] font-medium uppercase tracking-wider text-slate-500">
        Field
      </span>
      {card ? (
        <BoardCard
          card={card}
          size="xs"
          showStats={false}
          isSelected={selectedCard === card.instanceId}
          onClick={() => onCardClick?.(card)}
        />
      ) : (
        <EmptySlot
          size="xs"
          onClick={!isOpponent ? onEmptySlotClick : undefined}
          className="border-dashed border-purple-500/30"
        />
      )}
    </div>
  );
}
