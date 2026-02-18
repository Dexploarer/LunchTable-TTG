"use client";

import type { Id } from "@convex/_generated/dataModel";
import type { CardInZone, PlayerBoard as PlayerBoardType } from "../hooks/useGameBoard";
import { FieldZone } from "./zones/FieldZone";
import { MonsterZone } from "./zones/MonsterZone";
import { PileZone } from "./zones/PileZone";
import { SpellTrapZone } from "./zones/SpellTrapZone";

interface PlayerBoardProps {
  board: PlayerBoardType;
  selectedCard?: Id<"cardDefinitions"> | null;
  attackingCard?: Id<"cardDefinitions"> | null;
  targetableCards?: Set<Id<"cardDefinitions">>;
  activatableBackrowCards?: Set<Id<"cardDefinitions">>;
  attackableCards?: Set<Id<"cardDefinitions">>;
  onCardClick: (card: CardInZone) => void;
  onCardAttack?: (card: CardInZone) => void;
  onEmptyMonsterSlotClick?: (zone: "frontline" | "support", index?: number) => void;
  onEmptyBackrowClick?: (index?: number) => void;
  onBackrowCardClick?: (card: CardInZone) => void;
  onFieldClick?: () => void;
}

export function PlayerBoard({
  board,
  selectedCard,
  attackingCard,
  targetableCards,
  activatableBackrowCards,
  attackableCards,
  onCardClick,
  onCardAttack,
  onEmptyMonsterSlotClick,
  onEmptyBackrowClick,
  onBackrowCardClick,
  onFieldClick,
}: PlayerBoardProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 overflow-x-auto no-scrollbar w-full">
      {/* Left side: Deck & Graveyard */}
      <PileZone
        deckCount={board.deckCount}
        graveyardCount={board.graveyardCount}
        graveyardCards={board.graveyard}
      />

      {/* Center: Main board zones */}
      <div className="flex-1 space-y-0.5 sm:space-y-1">
        {/* Backrow (Spell/Trap) */}
        <SpellTrapZone
          cards={board.backrow}
          selectedCard={selectedCard}
          activatableCards={activatableBackrowCards}
          onCardClick={onBackrowCardClick ?? onCardClick}
          onEmptySlotClick={onEmptyBackrowClick}
        />

        {/* Monster Zone (Support + Frontline) */}
        <MonsterZone
          frontline={board.frontline}
          support={board.support}
          selectedCard={selectedCard}
          attackingCard={attackingCard}
          targetableCards={targetableCards}
          attackableCards={attackableCards}
          onCardClick={onCardClick}
          onCardAttack={onCardAttack}
          onEmptySlotClick={onEmptyMonsterSlotClick}
        />
      </div>

      {/* Right side: Field spell */}
      <FieldZone
        card={board.fieldSpell}
        selectedCard={selectedCard}
        onCardClick={onCardClick}
        onEmptySlotClick={onFieldClick}
      />
    </div>
  );
}
