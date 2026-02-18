"use client";

import type { Id } from "@convex/_generated/dataModel";
import type { CardInZone } from "../hooks/useGameBoard";
import { HandCard, OpponentHandCard } from "./cards/HandCard";

interface PlayerHandProps {
  cards: CardInZone[];
  handCount: number;
  isOpponent?: boolean;
  playableCards?: Set<Id<"cardDefinitions">>;
  selectedCard?: Id<"cardDefinitions"> | null;
  onCardClick?: (card: CardInZone) => void;
}

export function PlayerHand({
  cards,
  handCount,
  isOpponent = false,
  playableCards,
  selectedCard,
  onCardClick,
}: PlayerHandProps) {
  if (isOpponent) {
    return (
      <div className="flex items-center justify-center py-1">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: handCount }).map((_, index) => (
            <OpponentHandCard key={`opponent-hand-${index}`} index={index} totalCards={handCount} />
          ))}
        </div>
        {handCount > 0 && (
          <span className="ml-2 text-[10px] text-muted-foreground">{handCount} cards</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative py-2 sm:py-10 px-0 sm:px-6 overflow-x-auto snap-x snap-mandatory no-scrollbar w-full">
      <div className="flex items-end justify-start sm:justify-center px-4 sm:px-0 min-w-max pb-4 pt-4 sm:pb-0 mx-auto">
        {cards.map((card, index) => (
          <div key={card.instanceId} className="snap-center shrink-0">
            <HandCard
              card={card}
              index={index}
              totalCards={cards.length}
              isPlayable={playableCards?.has(card.instanceId) ?? false}
              isSelected={selectedCard === card.instanceId}
              onClick={() => onCardClick?.(card)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
