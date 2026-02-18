"use client";

import type { Id } from "@convex/_generated/dataModel";
import type { CardInZone, PlayerBoard as PlayerBoardType } from "../hooks/useGameBoard";
import { FieldZone } from "./zones/FieldZone";
import { MonsterZone } from "./zones/MonsterZone";
import { PileZone } from "./zones/PileZone";
import { SpellTrapZone } from "./zones/SpellTrapZone";

interface OpponentBoardProps {
  board: PlayerBoardType;
  selectedCard?: Id<"cardDefinitions"> | null;
  targetableCards?: Set<Id<"cardDefinitions">>;
  onCardClick?: (card: CardInZone) => void;
}

export function OpponentBoard({
  board,
  selectedCard,
  targetableCards,
  onCardClick,
}: OpponentBoardProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 overflow-x-auto no-scrollbar w-full">
      {/* Right side: Field spell (mirrored position) */}
      <FieldZone
        card={board.fieldSpell}
        isOpponent
        selectedCard={selectedCard}
        onCardClick={onCardClick}
      />

      {/* Center: Main board zones (reversed order for opponent) */}
      <div className="flex-1 space-y-0.5 sm:space-y-1">
        {/* Monster Zone (Support + Frontline) */}
        <MonsterZone
          frontline={board.frontline}
          support={board.support}
          isOpponent
          selectedCard={selectedCard}
          targetableCards={targetableCards}
          onCardClick={onCardClick}
        />

        {/* Backrow (Spell/Trap) */}
        <SpellTrapZone
          cards={board.backrow}
          isOpponent
          selectedCard={selectedCard}
          onCardClick={onCardClick}
        />
      </div>

      {/* Left side: Deck & Graveyard (mirrored) */}
      <PileZone
        deckCount={board.deckCount}
        graveyardCount={board.graveyardCount}
        graveyardCards={board.graveyard}
        isOpponent
      />
    </div>
  );
}
