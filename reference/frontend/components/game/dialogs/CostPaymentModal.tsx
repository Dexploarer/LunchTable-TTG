"use client";

import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, Skull, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { CardInZone } from "../hooks/useGameBoard";

type CostType = "discard" | "pay_lp" | "tribute" | "banish";

interface CostPaymentModalProps {
  isOpen: boolean;
  costType: CostType;
  costValue: number;
  currentLP?: number;
  availableCards?: CardInZone[];
  cardTypeName?: string; // "monster", "card", etc.
  sourceCardName?: string; // Name of the card requiring the cost
  onConfirm: (selectedCardIds?: Id<"cardDefinitions">[]) => void;
  onCancel: () => void;
}

const COST_CONFIG: Record<
  CostType,
  {
    icon: React.ElementType;
    title: string;
    color: string;
    bgColor: string;
  }
> = {
  discard: {
    icon: Trash2,
    title: "Discard Cost",
    color: "text-orange-400",
    bgColor: "border-orange-500/50 bg-orange-500/10",
  },
  pay_lp: {
    icon: Heart,
    title: "Life Point Cost",
    color: "text-red-400",
    bgColor: "border-red-500/50 bg-red-500/10",
  },
  tribute: {
    icon: Skull,
    title: "Tribute Cost",
    color: "text-purple-400",
    bgColor: "border-purple-500/50 bg-purple-500/10",
  },
  banish: {
    icon: X,
    title: "Banish Cost",
    color: "text-yellow-400",
    bgColor: "border-yellow-500/50 bg-yellow-500/10",
  },
};

export function CostPaymentModal({
  isOpen,
  costType,
  costValue,
  currentLP,
  availableCards = [],
  cardTypeName = "card",
  sourceCardName,
  onConfirm,
  onCancel,
}: CostPaymentModalProps) {
  const [selectedCards, setSelectedCards] = useState<Set<Id<"cardDefinitions">>>(new Set());

  const config = COST_CONFIG[costType];
  const Icon = config.icon;

  const handleCardClick = (cardId: Id<"cardDefinitions">) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else if (newSelection.size < costValue) {
      newSelection.add(cardId);
    }
    setSelectedCards(newSelection);
  };

  const handleConfirm = () => {
    if (costType === "pay_lp") {
      // LP costs don't require card selection
      onConfirm();
    } else {
      onConfirm(Array.from(selectedCards));
    }
    setSelectedCards(new Set());
  };

  const handleCancel = () => {
    setSelectedCards(new Set());
    onCancel();
  };

  const canConfirm =
    costType === "pay_lp"
      ? currentLP !== undefined && currentLP >= costValue
      : selectedCards.size === costValue;

  const getCostDescription = () => {
    switch (costType) {
      case "discard":
        return `Select ${costValue} ${cardTypeName}${costValue > 1 ? "s" : ""} from your hand to discard`;
      case "pay_lp":
        return `Pay ${costValue} Life Points`;
      case "tribute":
        return `Select ${costValue} monster${costValue > 1 ? "s" : ""} from your field to tribute`;
      case "banish":
        return `Select ${costValue} ${cardTypeName}${costValue > 1 ? "s" : ""} from your graveyard to banish`;
    }
  };

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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className={cn("bg-background border-2 rounded-xl shadow-2xl p-4", config.bgColor)}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg bg-background/50", config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className={cn("font-bold text-lg", config.color)}>{config.title}</h3>
                    {sourceCardName && (
                      <p className="text-xs text-muted-foreground">To activate: {sourceCardName}</p>
                    )}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={handleCancel} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4">{getCostDescription()}</p>

              {/* LP Cost Display */}
              {costType === "pay_lp" && currentLP !== undefined && (
                <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current LP:</span>
                    <span className="font-bold text-lg">{currentLP}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-red-400">Cost:</span>
                    <span className="font-bold text-lg text-red-400">-{costValue}</span>
                  </div>
                  <div className="border-t border-slate-600 mt-2 pt-2 flex items-center justify-between">
                    <span className="text-sm">After Payment:</span>
                    <span
                      className={cn(
                        "font-bold text-lg",
                        currentLP - costValue <= 0 ? "text-red-500" : "text-green-400"
                      )}
                    >
                      {Math.max(0, currentLP - costValue)}
                    </span>
                  </div>
                  {currentLP < costValue && (
                    <p className="mt-2 text-xs text-red-400">Not enough Life Points!</p>
                  )}
                </div>
              )}

              {/* Card Selection (for discard/tribute/banish) */}
              {costType !== "pay_lp" && (
                <>
                  {/* Selection Counter */}
                  <div className="mb-3 px-3 py-2 bg-muted rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Selected: {selectedCards.size} / {costValue}
                    </span>
                    {selectedCards.size > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedCards(new Set())}
                        className="h-6 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Cards Grid */}
                  <div className="max-h-48 overflow-y-auto mb-4">
                    {availableCards.length === 0 ? (
                      <div className="flex items-center justify-center h-24">
                        <p className="text-sm text-muted-foreground">No cards available</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {availableCards.map((card) => {
                          const isSelected = selectedCards.has(card.cardId);
                          return (
                            <motion.button
                              key={card.cardId}
                              type="button"
                              onClick={() => handleCardClick(card.cardId)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "relative rounded-lg border-2 overflow-hidden transition-all",
                                "aspect-2/3 group",
                                isSelected
                                  ? "border-primary ring-2 ring-primary shadow-lg"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              {card.imageUrl ? (
                                <Image
                                  src={card.imageUrl}
                                  alt={card.name ?? "Card"}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                  <span className="text-[8px] text-center px-1">{card.name}</span>
                                </div>
                              )}

                              {/* Selection Overlay */}
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-4 h-4 text-primary-foreground" />
                                  </div>
                                </div>
                              )}

                              {/* Card Name */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-[7px] text-white text-center truncate">
                                  {card.name}
                                </p>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleConfirm} disabled={!canConfirm}>
                  {costType === "pay_lp"
                    ? `Pay ${costValue} LP`
                    : `Confirm (${selectedCards.size}/${costValue})`}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
