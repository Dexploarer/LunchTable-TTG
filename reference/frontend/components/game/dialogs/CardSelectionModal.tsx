"use client";

import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useState } from "react";
import type { CardInZone } from "../hooks/useGameBoard";

interface CardSelectionModalProps {
  isOpen: boolean;
  cards: CardInZone[];
  zone: "deck" | "graveyard" | "banished" | "board" | "hand";
  selectionMode?: "single" | "multi";
  maxSelections?: number;
  minSelections?: number;
  onConfirm: (selectedCardIds: Id<"cardDefinitions">[]) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

const ZONE_LABELS = {
  deck: "Deck",
  graveyard: "Graveyard",
  banished: "Banished Zone",
  board: "Field",
  hand: "Hand",
};

const ZONE_COLORS = {
  deck: "from-blue-600 to-blue-800",
  graveyard: "from-purple-600 to-purple-800",
  banished: "from-yellow-600 to-yellow-800",
  board: "from-green-600 to-green-800",
  hand: "from-slate-600 to-slate-800",
};

export function CardSelectionModal({
  isOpen,
  cards,
  zone,
  selectionMode = "single",
  maxSelections = 1,
  minSelections = 1,
  onConfirm,
  onCancel,
  title,
  description,
}: CardSelectionModalProps) {
  const [selectedCards, setSelectedCards] = useState<Set<Id<"cardDefinitions">>>(new Set());

  const handleCardClick = (cardId: Id<"cardDefinitions">) => {
    if (selectionMode === "single") {
      // Single selection - replace previous selection
      setSelectedCards(new Set([cardId]));
    } else {
      // Multi selection - toggle
      const newSelection = new Set(selectedCards);
      if (newSelection.has(cardId)) {
        newSelection.delete(cardId);
      } else if (newSelection.size < maxSelections) {
        newSelection.add(cardId);
      }
      setSelectedCards(newSelection);
    }
  };

  const handleConfirm = () => {
    if (selectedCards.size >= minSelections && selectedCards.size <= maxSelections) {
      onConfirm(Array.from(selectedCards));
      setSelectedCards(new Set());
    }
  };

  const handleCancel = () => {
    setSelectedCards(new Set());
    onCancel();
  };

  const canConfirm = selectedCards.size >= minSelections && selectedCards.size <= maxSelections;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40"
            onClick={handleCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            <div className="bg-background border rounded-xl shadow-2xl p-4 flex flex-col max-h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">
                    {title || `Select from ${ZONE_LABELS[zone]}`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {description ||
                      (selectionMode === "multi"
                        ? `Select ${minSelections === maxSelections ? maxSelections : `${minSelections}-${maxSelections}`} card${maxSelections > 1 ? "s" : ""}`
                        : "Select 1 card")}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={handleCancel} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Selection Counter */}
              {selectionMode === "multi" && (
                <div className="mb-3 px-3 py-2 bg-muted rounded-lg flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Selected: {selectedCards.size} / {maxSelections}
                  </span>
                  {selectedCards.size > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedCards(new Set())}
                      className="h-6 text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              )}

              {/* Cards Grid */}
              <div className="flex-1 overflow-y-auto mb-4">
                {cards.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-sm text-muted-foreground">No cards available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {cards.map((card) => {
                      const isSelected = selectedCards.has(card.cardId);
                      return (
                        <motion.button
                          key={card.cardId}
                          type="button"
                          onClick={() => handleCardClick(card.cardId)}
                          whileHover={{ scale: 1.05, y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "relative rounded-lg border-2 overflow-hidden transition-all",
                            "aspect-2/3 group",
                            isSelected
                              ? "border-primary ring-2 ring-primary shadow-lg shadow-primary/50"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {/* Card Image */}
                          {card.imageUrl ? (
                            <Image
                              src={card.imageUrl}
                              alt={card.name ?? "Card"}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 25vw, 15vw"
                            />
                          ) : (
                            <div
                              className={cn(
                                "w-full h-full flex items-center justify-center text-center p-2",
                                "bg-linear-to-br",
                                ZONE_COLORS[zone]
                              )}
                            >
                              <span className="text-[10px] text-white/90 font-medium leading-tight">
                                {card.name}
                              </span>
                            </div>
                          )}

                          {/* Selection Overlay */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-5 h-5 text-primary-foreground" />
                              </div>
                            </div>
                          )}

                          {/* Card Name Tooltip */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[9px] text-white text-center truncate">
                              {card.name}
                            </p>
                          </div>

                          {/* Monster Stats */}
                          {card.monsterStats && (
                            <div className="absolute top-1 right-1 flex flex-col gap-0.5">
                              <div className="text-[8px] bg-red-500/90 text-white px-1 rounded font-bold">
                                {card.monsterStats.attack}
                              </div>
                              <div className="text-[8px] bg-blue-500/90 text-white px-1 rounded font-bold">
                                {card.monsterStats.defense}
                              </div>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleConfirm} disabled={!canConfirm}>
                  Confirm {selectedCards.size > 0 && `(${selectedCards.size})`}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
