"use client";

import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { CardInZone } from "../../hooks/useGameBoard";

interface PileZoneProps {
  deckCount: number;
  graveyardCount: number;
  graveyardCards?: CardInZone[];
  isOpponent?: boolean;
  onGraveyardClick?: () => void;
}

export function PileZone({
  deckCount,
  graveyardCount,
  graveyardCards = [],
  isOpponent = false,
  onGraveyardClick,
}: PileZoneProps) {
  const [showGraveyard, setShowGraveyard] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      {/* Deck */}
      <div className="flex flex-col items-center">
        <DeckPile count={deckCount} />
        <span className="text-[8px] sm:text-[10px] font-medium text-slate-500 mt-0.5">Deck</span>
      </div>

      {/* Graveyard */}
      <div className="flex flex-col items-center relative">
        <GraveyardPile
          count={graveyardCount}
          topCard={graveyardCards[graveyardCards.length - 1]}
          onClick={() => {
            if (graveyardCount > 0) {
              setShowGraveyard(!showGraveyard);
              onGraveyardClick?.();
            }
          }}
        />
        <span className="text-[8px] sm:text-[10px] font-medium text-slate-500 mt-0.5">Grave</span>

        {/* Graveyard Preview */}
        <AnimatePresence>
          {showGraveyard && graveyardCards.length > 0 && (
            <GraveyardPreview
              cards={graveyardCards}
              onClose={() => setShowGraveyard(false)}
              isOpponent={isOpponent}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DeckPile({ count }: { count: number }) {
  const stackLayers = Math.min(count, 5);

  return (
    <div className="relative w-8 h-11 sm:w-10 sm:h-14">
      {Array.from({ length: stackLayers }).map((_, i) => {
        const key = `deck-layer-${i}`;
        return (
          <div
            key={key}
            className={cn(
              "absolute inset-0 rounded-md border-2",
              "bg-linear-to-br from-indigo-900 to-indigo-950",
              "border-indigo-700/50"
            )}
            style={{
              transform: `translateY(${-i * 1}px)`,
              zIndex: i,
            }}
          >
            <div className="absolute inset-0.5 rounded border border-indigo-600/30">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-indigo-500/50" />
              </div>
            </div>
          </div>
        );
      })}

      {/* Count badge */}
      <div className="absolute -bottom-1 -right-1 z-10 bg-background border rounded-full px-1 py-0.5 text-[8px] sm:text-[10px] font-medium">
        {count}
      </div>
    </div>
  );
}

function GraveyardPile({
  count,
  topCard,
  onClick,
}: {
  count: number;
  topCard?: CardInZone;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={count === 0}
      className={cn(
        "relative w-8 h-11 sm:w-10 sm:h-14 rounded-md border-2 transition-all",
        count > 0
          ? "border-gray-500/50 hover:border-gray-400 cursor-pointer"
          : "border-dashed border-gray-700/30 cursor-default"
      )}
    >
      {count > 0 ? (
        <>
          {topCard && (
            <div className="absolute inset-0 rounded overflow-hidden">
              {topCard.imageUrl ? (
                <Image
                  src={topCard.imageUrl}
                  alt={topCard.name ?? "Card"}
                  fill
                  className="object-cover opacity-60"
                  sizes="(max-width: 640px) 40px, 56px"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <span className="text-[6px] sm:text-[8px] text-gray-400 text-center px-0.5 truncate">
                    {topCard.name}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-gray-900/40 rounded" />

          <div
            className="absolute -bottom-1 -right-1 z-10 bg-background border rounded-full px-1 py-0.5 text-[8px] sm:text-[10px] font-medium"
            data-testid="graveyard-count"
          >
            {count}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] sm:text-[10px] text-gray-600">0</span>
        </div>
      )}
    </button>
  );
}

function GraveyardPreview({
  cards,
  onClose,
  isOpponent,
}: {
  cards: CardInZone[];
  onClose: () => void;
  isOpponent: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "absolute z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-2 shadow-xl",
        "min-w-[150px] max-w-[200px] max-h-[200px] overflow-y-auto",
        isOpponent ? "top-full mt-1" : "bottom-full mb-1"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium">Graveyard ({cards.length})</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>

      <div className="space-y-0.5">
        {cards
          .slice()
          .reverse()
          .map((card, index) => (
            <div
              key={card.instanceId}
              className="flex items-center gap-1 p-1 rounded bg-muted/50 text-[10px]"
            >
              <span className="text-muted-foreground w-3">{index + 1}.</span>
              <span className="flex-1 truncate">{card.name}</span>
              {card.cardType && (
                <span className="text-muted-foreground capitalize text-[8px]">{card.cardType}</span>
              )}
            </div>
          ))}
      </div>
    </motion.div>
  );
}
