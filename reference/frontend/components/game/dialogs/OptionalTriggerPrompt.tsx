"use client";

import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { typedApi, useConvexMutation } from "@/lib/convexHelpers";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock, Sparkles, X, XCircle, Zap } from "lucide-react";
import { useCallback, useState } from "react";

// =============================================================================
// Types
// =============================================================================

export interface PendingOptionalTrigger {
  cardId: Id<"cardDefinitions">;
  cardName: string;
  effectIndex: number;
  trigger: string;
  playerId: Id<"users">;
  addedAt: number;
}

export interface CardEffectInfo {
  name: string;
  description: string;
  effectType?: string;
  trigger?: string;
  cost?: {
    type: string;
    value?: number;
    description: string;
  };
  isOPT?: boolean;
  isHOPT?: boolean;
  spellSpeed?: 1 | 2 | 3;
  isContinuous?: boolean;
  isOptional?: boolean;
}

export interface CardInfo {
  _id: Id<"cardDefinitions">;
  name: string;
  imageUrl?: string;
  cardType?: string;
  rarity?: string;
  effects?: CardEffectInfo[];
}

interface OptionalTriggerPromptProps {
  pendingTriggers: PendingOptionalTrigger[];
  lobbyId: Id<"gameLobbies">;
  currentPlayerId: Id<"users">;
  /** Card lookup function to get full card data including effects and image */
  getCardInfo?: (cardId: Id<"cardDefinitions">) => CardInfo | undefined;
  onClose: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const TRIGGER_LABELS: Record<string, string> = {
  on_summon: "When Summoned",
  on_opponent_summon: "When Opponent Summons",
  on_destroy: "When Destroyed",
  on_flip: "When Flipped",
  on_battle_damage: "When Dealing Battle Damage",
  on_battle_destroy: "When Destroying by Battle",
  on_battle_attacked: "When Attacked",
  on_combat_start: "At Combat Start",
  on_draw: "During Draw Phase",
  on_end: "During End Phase",
  manual: "Activate",
  continuous: "Continuous",
  quick: "Quick Effect",
  on_normal_summon: "When Normal Summoned",
  on_special_summon: "When Special Summoned",
  on_flip_summon: "When Flip Summoned",
  on_sent_to_gy: "When Sent to GY",
  on_banished: "When Banished",
  on_opponent_attacks: "When Opponent Attacks",
  on_turn_start: "At Turn Start",
  on_turn_end: "At Turn End",
  on_breakdown_check: "During Breakdown Check",
};

const TRIGGER_COLORS: Record<string, string> = {
  on_summon: "bg-green-500/20 text-green-400 border-green-500/30",
  on_normal_summon: "bg-green-500/20 text-green-400 border-green-500/30",
  on_special_summon: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  on_destroy: "bg-red-500/20 text-red-400 border-red-500/30",
  on_flip: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  on_battle_damage: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  on_battle_destroy: "bg-red-500/20 text-red-400 border-red-500/30",
  on_battle_attacked: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  on_opponent_summon: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  on_sent_to_gy: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  on_banished: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  on_turn_start: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  on_turn_end: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
};

const RARITY_BORDERS: Record<string, string> = {
  common: "border-gray-500/50",
  uncommon: "border-green-500/50",
  rare: "border-blue-500/50",
  epic: "border-purple-500/50",
  legendary: "border-yellow-500/50 shadow-lg shadow-yellow-500/20",
};

// =============================================================================
// Component
// =============================================================================

export function OptionalTriggerPrompt({
  pendingTriggers,
  lobbyId,
  currentPlayerId,
  getCardInfo,
  onClose,
}: OptionalTriggerPromptProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const respondToTrigger = useConvexMutation(
    typedApi.gameplay.triggerSystem.respondToOptionalTrigger
  );

  // Filter triggers for current player only
  const playerTriggers = pendingTriggers.filter((trigger) => trigger.playerId === currentPlayerId);

  const currentTrigger = playerTriggers[currentIndex];

  const handleResponse = useCallback(
    async (activate: boolean) => {
      if (!currentTrigger || isSubmitting) return;

      setIsSubmitting(true);

      try {
        await respondToTrigger({
          lobbyId,
          cardId: currentTrigger.cardId,
          effectIndex: currentTrigger.effectIndex,
          activate,
        });

        // Move to next trigger or close if done
        if (currentIndex < playerTriggers.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      } catch (error) {
        console.error("Failed to respond to optional trigger:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      currentTrigger,
      isSubmitting,
      respondToTrigger,
      lobbyId,
      currentIndex,
      playerTriggers.length,
      onClose,
    ]
  );

  // Don't render if no triggers for current player
  if (playerTriggers.length === 0 || !currentTrigger) {
    return null;
  }

  // Get card info if lookup function provided
  const cardInfo = getCardInfo?.(currentTrigger.cardId);
  const effect = cardInfo?.effects?.[currentTrigger.effectIndex];

  const triggerLabel = TRIGGER_LABELS[currentTrigger.trigger] || currentTrigger.trigger;
  const triggerColor =
    TRIGGER_COLORS[currentTrigger.trigger] || "bg-amber-500/20 text-amber-400 border-amber-500/30";

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
      >
        <div className="bg-[#1a1614] border-2 border-[#3d2b1f] rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3d2b1f] bg-gradient-to-r from-amber-500/10 to-yellow-500/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#e8e0d5]">Optional Effect Trigger</h3>
                {playerTriggers.length > 1 && (
                  <p className="text-[10px] text-[#a89f94]">
                    {currentIndex + 1} of {playerTriggers.length} triggers
                  </p>
                )}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 text-[#a89f94] hover:text-[#e8e0d5] hover:bg-[#3d2b1f]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Card Info Section */}
            <div className="flex gap-4">
              {/* Card Image */}
              <div
                className={cn(
                  "w-24 h-32 rounded-lg border-2 overflow-hidden shrink-0",
                  RARITY_BORDERS[cardInfo?.rarity ?? "common"] ?? RARITY_BORDERS["common"]
                )}
              >
                {cardInfo?.imageUrl ? (
                  <Image
                    src={cardInfo.imageUrl}
                    alt={currentTrigger.cardName}
                    width={96}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center p-2">
                    <span className="text-xs text-white/80 text-center font-medium">
                      {currentTrigger.cardName}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Details */}
              <div className="flex-1 min-w-0 space-y-2">
                <h4 className="font-bold text-lg text-[#e8e0d5] leading-tight">
                  {currentTrigger.cardName}
                </h4>

                {/* Trigger Badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium",
                    triggerColor
                  )}
                >
                  <Zap className="w-3 h-3" />
                  {triggerLabel}
                </div>

                {/* Card Type Badge */}
                {cardInfo?.cardType && (
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#3d2b1f] text-[#a89f94]">
                    {cardInfo.cardType}
                  </span>
                )}
              </div>
            </div>

            {/* Effect Details */}
            <div className="p-3 bg-[#0d0a09] border border-[#3d2b1f] rounded-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">
                  {effect?.name || "Effect"}
                </span>
                {effect?.isOptional && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                    Optional
                  </span>
                )}
              </div>

              <p className="text-sm text-[#a89f94] leading-relaxed">
                {effect?.description || "This card has an optional effect that can be activated."}
              </p>

              {/* Cost and Restrictions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {effect?.cost && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded border border-amber-500/20">
                    <Clock className="w-2.5 h-2.5" />
                    Cost: {effect.cost.description}
                  </span>
                )}
                {effect?.isOPT && !effect?.isHOPT && (
                  <span className="text-[10px] px-2 py-0.5 bg-orange-500/10 text-orange-300 rounded border border-orange-500/20">
                    Once per turn
                  </span>
                )}
                {effect?.isHOPT && (
                  <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-300 rounded border border-red-500/20">
                    Hard once per turn
                  </span>
                )}
              </div>
            </div>

            {/* Question Prompt */}
            <div className="text-center py-2">
              <p className="text-sm text-[#e8e0d5] font-medium">
                Would you like to activate this effect?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Skip Button */}
              <Button
                className="h-12 bg-[#3d2b1f]/50 hover:bg-[#3d2b1f] border-2 border-[#4d3b2f] hover:border-red-500/50 text-[#a89f94] hover:text-red-400 transition-all"
                variant="outline"
                onClick={() => handleResponse(false)}
                disabled={isSubmitting}
              >
                <XCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Skip</span>
              </Button>

              {/* Activate Button */}
              <Button
                className="h-12 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 hover:from-amber-500/40 hover:to-yellow-500/40 border-2 border-amber-400 hover:border-amber-300 text-amber-100 shadow-lg shadow-amber-500/20 transition-all"
                variant="outline"
                onClick={() => handleResponse(true)}
                disabled={isSubmitting}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span className="font-bold">Activate</span>
              </Button>
            </div>

            {/* Loading State Overlay */}
            {isSubmitting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl"
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  <span className="text-sm font-medium">Processing...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Progress Indicator for Multiple Triggers */}
          {playerTriggers.length > 1 && (
            <div className="px-4 pb-3">
              <div className="flex gap-1">
                {playerTriggers.map((trigger, idx) => (
                  <div
                    key={`trigger-progress-${trigger.cardId}-${trigger.effectIndex}`}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-colors",
                      idx < currentIndex
                        ? "bg-green-500"
                        : idx === currentIndex
                          ? "bg-amber-400"
                          : "bg-[#3d2b1f]"
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
