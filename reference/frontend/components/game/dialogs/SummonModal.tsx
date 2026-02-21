"use client";

import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Clock, Coins, Shield, Sword, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { CardInZone } from "../hooks/useGameBoard";

interface SummonModalProps {
  isOpen: boolean;
  card: CardInZone | null;
  canSummonAttack: boolean;
  canSummonDefense: boolean;
  canSet: boolean;
  canActivate?: boolean;
  availableTributes?: CardInZone[];
  tributesRequired?: number;
  onSummon: (position: "attack" | "defense", tributeIds?: Id<"cardDefinitions">[]) => void;
  onSet: () => void;
  onActivate?: () => void;
  onClose: () => void;
}

export function SummonModal({
  isOpen,
  card,
  canSummonAttack,
  canSummonDefense,
  canSet,
  canActivate = false,
  availableTributes = [],
  tributesRequired = 0,
  onSummon,
  onSet,
  onActivate,
  onClose,
}: SummonModalProps) {
  const [selectedTributes, setSelectedTributes] = useState<Set<Id<"cardDefinitions">>>(new Set());
  const [showTributeSelection, setShowTributeSelection] = useState(false);
  const [pendingSummonPosition, setPendingSummonPosition] = useState<"attack" | "defense" | null>(
    null
  );

  // Reset tribute selection state when modal opens/closes or card changes
  useEffect(() => {
    if (!isOpen || !card) {
      setSelectedTributes(new Set());
      setShowTributeSelection(false);
      setPendingSummonPosition(null);
    }
  }, [isOpen, card]);

  // Debug logging for tribute selection
  useEffect(() => {
    if (isOpen && card && tributesRequired > 0) {
      console.log("[SummonModal] Tribute summon debug:", {
        cardName: card.name,
        cardLevel: card.monsterStats?.level,
        tributesRequired,
        availableTributes: availableTributes.length,
        tributesList: availableTributes.map((t) => ({
          name: t.name,
          id: t.cardId,
          instanceId: t.instanceId,
        })),
        showTributeSelection,
        selectedTributes: Array.from(selectedTributes),
      });
    }
  }, [isOpen, card, tributesRequired, availableTributes, showTributeSelection, selectedTributes]);

  if (!card) return null;

  const hasAnyAction = canSummonAttack || canSummonDefense || canSet || canActivate;
  const needsTributes = tributesRequired > 0;
  const hasEnoughTributes = availableTributes.length >= tributesRequired;
  const canProceedWithSummon = !needsTributes || selectedTributes.size >= tributesRequired;
  const canAttemptTributeSummon = !needsTributes || hasEnoughTributes;

  const handleSummonClick = (position: "attack" | "defense") => {
    console.log("[SummonModal] handleSummonClick called:", {
      position,
      needsTributes,
      hasEnoughTributes,
      availableTributesCount: availableTributes.length,
      tributesRequired,
    });

    // Prevent summon if tributes are needed but not available
    if (needsTributes && !hasEnoughTributes) {
      console.log("[SummonModal] Cannot summon - need tributes but don't have enough");
      return;
    }

    if (needsTributes && availableTributes.length > 0) {
      // Show tribute selection screen
      console.log("[SummonModal] Showing tribute selection screen");
      setPendingSummonPosition(position);
      setShowTributeSelection(true);
    } else {
      // Summon directly (no tributes needed)
      console.log("[SummonModal] Summoning directly without tributes");
      onSummon(position, []);
    }
  };

  const handleConfirmTributes = () => {
    console.log("[SummonModal] handleConfirmTributes called:", {
      pendingSummonPosition,
      canProceedWithSummon,
      selectedTributes: Array.from(selectedTributes),
      tributesRequired,
    });

    if (pendingSummonPosition && canProceedWithSummon) {
      console.log(
        "[SummonModal] Confirming tribute summon with",
        Array.from(selectedTributes).length,
        "tributes"
      );
      onSummon(pendingSummonPosition, Array.from(selectedTributes));
    }
  };

  const toggleTribute = (cardId: Id<"cardDefinitions">) => {
    console.log("[SummonModal] toggleTribute called for cardId:", cardId);
    const newSelected = new Set(selectedTributes);
    if (newSelected.has(cardId)) {
      console.log("[SummonModal] Deselecting tribute");
      newSelected.delete(cardId);
    } else if (newSelected.size < tributesRequired) {
      console.log("[SummonModal] Selecting tribute");
      newSelected.add(cardId);
    } else {
      console.log("[SummonModal] Cannot select - already have enough tributes");
    }
    setSelectedTributes(newSelected);
    console.log("[SummonModal] New selected tributes:", Array.from(newSelected));
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
            aria-labelledby="summon-modal-title"
            aria-describedby="summon-modal-description"
          >
            <div className="bg-[#1a1614] border-2 border-[#3d2b1f] rounded-xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 id="summon-modal-title" className="font-bold text-lg text-[#e8e0d5] mb-1">
                    {card.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium capitalize">
                      {card.cardType}
                    </span>
                    {card.monsterStats && (
                      <span className="text-[#a89f94]">Lv.{card.monsterStats.level}</span>
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

              {/* Card Preview & Stats */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="w-32 h-44 rounded-lg border-2 border-[#3d2b1f] overflow-hidden shrink-0 mx-auto sm:mx-0">
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt={card.name || "Card"}
                      width={128}
                      height={176}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                      <span className="text-sm text-white/80 text-center px-2">
                        {card.name || "Unknown Card"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  {/* Monster Stats */}
                  {card.monsterStats && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/30 rounded">
                        <div className="flex items-center gap-2">
                          <Sword className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-[#a89f94]">Attack</span>
                        </div>
                        <span className="font-bold text-red-400">{card.monsterStats.attack}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/30 rounded">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-[#a89f94]">Defense</span>
                        </div>
                        <span className="font-bold text-blue-400">{card.monsterStats.defense}</span>
                      </div>
                    </div>
                  )}

                  {/* Card Type Info */}
                  {!card.monsterStats && (
                    <div className="p-3 bg-[#3d2b1f]/30 border border-[#3d2b1f] rounded text-center">
                      <p className="text-xs text-[#a89f94]">
                        {card.cardType === "spell" &&
                          "This spell card can be activated or set face-down"}
                        {card.cardType === "trap" &&
                          "This trap card must be set face-down before activation"}
                        {card.cardType === "field" &&
                          "This field spell affects the entire battlefield"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Effects */}
              {card.effects && card.effects.length > 0 && (
                <div className="mb-4 max-h-40 overflow-y-auto space-y-2 p-3 bg-[#0d0a09] border border-[#3d2b1f] rounded">
                  <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Card Effects
                  </p>
                  {card.effects.map((effect, index) => (
                    <div
                      key={`effect-${effect.name}-${index}`}
                      className="text-xs text-[#a89f94] border-l-2 border-amber-500/30 pl-2"
                    >
                      {/* Effect header with name and badges */}
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="font-medium text-[#e8e0d5]">{effect.name}</span>
                        {effect.effectType && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded capitalize">
                            {effect.effectType}
                          </span>
                        )}
                        {effect.trigger && effect.trigger !== "manual" && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                            {effect.trigger}
                          </span>
                        )}
                        {effect.spellSpeed && effect.spellSpeed > 1 && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded",
                              effect.spellSpeed === 3
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            )}
                          >
                            Speed {effect.spellSpeed}
                          </span>
                        )}
                      </div>

                      {/* Effect description */}
                      <p className="text-[11px] leading-relaxed mb-1">{effect.description}</p>

                      {/* Restrictions and costs */}
                      <div className="flex flex-wrap gap-1">
                        {/* Cost display */}
                        {effect.cost && (
                          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-300 rounded border border-amber-500/20">
                            <Coins className="w-2.5 h-2.5" />
                            {effect.cost.description}
                          </span>
                        )}

                        {/* OPT restriction */}
                        {effect.isOPT && !effect.isHOPT && (
                          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 bg-orange-500/10 text-orange-300 rounded border border-orange-500/20">
                            <Clock className="w-2.5 h-2.5" />
                            Once per turn
                          </span>
                        )}

                        {/* Hard OPT restriction */}
                        {effect.isHOPT && (
                          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-300 rounded border border-red-500/20">
                            <AlertCircle className="w-2.5 h-2.5" />
                            Hard once per turn
                          </span>
                        )}

                        {/* Continuous effect */}
                        {effect.isContinuous && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
                            Continuous
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Play Options */}
              <div className="space-y-2" aria-label="Card play options">
                <div className="flex items-center justify-between mb-3">
                  <p id="summon-modal-description" className="text-sm font-semibold text-[#e8e0d5]">
                    How would you like to play this card?
                  </p>
                </div>

                {!hasAnyAction && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-center mb-3">
                    <p className="text-sm text-red-400 font-medium mb-1">Cannot Play Right Now</p>
                    <p className="text-xs text-[#a89f94]">
                      This card cannot be played during this phase or you don't have the required
                      resources.
                    </p>
                  </div>
                )}

                {/* Activate Spell/Trap - PRIMARY ACTION */}
                {canActivate && (
                  <div className="relative">
                    <Button
                      className="w-full justify-start gap-3 h-auto py-4 bg-linear-to-r from-amber-500/30 to-yellow-500/30 hover:from-amber-500/40 hover:to-yellow-500/40 border-2 border-amber-400 hover:border-amber-300 shadow-lg shadow-amber-500/20"
                      variant="outline"
                      onClick={() => {
                        console.log("Activating card:", card.name);
                        onActivate?.();
                      }}
                    >
                      <div className="h-8 w-8 rounded-full bg-amber-500/50 flex items-center justify-center font-bold text-lg shadow-inner">
                        ✨
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-bold text-base text-amber-100 flex items-center gap-2">
                          Activate Effect
                          <span className="text-[9px] px-1.5 py-0.5 bg-green-500/80 text-white rounded-full font-semibold">
                            RECOMMENDED
                          </span>
                        </div>
                        <div className="text-xs text-amber-200/90 font-medium">
                          Play this card and trigger its effects immediately
                        </div>
                      </div>
                    </Button>
                    {/* Pulsing indicator for primary action */}
                    <div className="absolute inset-0 rounded-lg border-2 border-amber-400/50 animate-pulse pointer-events-none" />
                  </div>
                )}

                {/* Tribute Warning/Error */}
                {needsTributes && !showTributeSelection && (
                  <div
                    className={`p-3 border rounded mb-2 ${
                      hasEnoughTributes
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <p
                      className={`text-sm font-medium mb-1 ${
                        hasEnoughTributes ? "text-yellow-400" : "text-red-400"
                      }`}
                    >
                      {hasEnoughTributes ? "Tribute Required" : "Cannot Summon"}
                    </p>
                    <p className="text-xs text-[#a89f94]">
                      {hasEnoughTributes
                        ? `This Level ${card.monsterStats?.level} monster requires ${tributesRequired} tribute${tributesRequired > 1 ? "s" : ""}. Click a summon button to select monsters to tribute.`
                        : `This Level ${card.monsterStats?.level} monster requires ${tributesRequired} tribute${tributesRequired > 1 ? "s" : ""}, but you only have ${availableTributes.length} monster${availableTributes.length !== 1 ? "s" : ""} on the field. Summon more monsters first.`}
                    </p>
                  </div>
                )}

                {/* Summon Attack */}
                {canSummonAttack && !showTributeSelection && (
                  <Button
                    className="w-full justify-start gap-3 h-auto py-3 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    variant="outline"
                    onClick={() => handleSummonClick("attack")}
                    disabled={!canAttemptTributeSummon}
                  >
                    <Sword className="h-6 w-6 text-red-400" />
                    <div className="text-left flex-1">
                      <div className="font-bold text-sm text-[#e8e0d5]">Attack Position</div>
                      <div className="text-xs text-[#a89f94]">
                        Summon face-up (ATK: {card.monsterStats?.attack ?? 0})
                        {needsTributes &&
                          hasEnoughTributes &&
                          ` - Select ${tributesRequired} tribute${tributesRequired > 1 ? "s" : ""}`}
                      </div>
                    </div>
                  </Button>
                )}

                {/* Summon Defense */}
                {canSummonDefense && !showTributeSelection && (
                  <Button
                    className="w-full justify-start gap-3 h-auto py-3 bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-500/50 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    variant="outline"
                    onClick={() => handleSummonClick("defense")}
                    disabled={!canAttemptTributeSummon}
                  >
                    <Shield className="h-6 w-6 text-blue-400" />
                    <div className="text-left flex-1">
                      <div className="font-bold text-sm text-[#e8e0d5]">Defense Position</div>
                      <div className="text-xs text-[#a89f94]">
                        Summon face-up (DEF: {card.monsterStats?.defense ?? 0})
                        {needsTributes &&
                          hasEnoughTributes &&
                          ` - Select ${tributesRequired} tribute${tributesRequired > 1 ? "s" : ""}`}
                      </div>
                    </div>
                  </Button>
                )}

                {/* Set Face-Down - Secondary Option */}
                {canSet && (
                  <>
                    {canActivate && (
                      <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 h-px bg-[#3d2b1f]" />
                        <span className="text-[10px] text-[#a89f94] uppercase tracking-wider">
                          Or
                        </span>
                        <div className="flex-1 h-px bg-[#3d2b1f]" />
                      </div>
                    )}
                    <Button
                      className="w-full justify-start gap-3 h-auto py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/40"
                      variant="outline"
                      onClick={() => {
                        console.log("Setting face-down:", card.name);
                        onSet();
                      }}
                    >
                      <div className="h-5 w-5 rounded border border-dashed border-purple-400/60" />
                      <div className="text-left flex-1">
                        <div className="font-medium text-sm text-[#e8e0d5]">Set Face-Down</div>
                        <div className="text-[11px] text-[#a89f94]">
                          {card.cardType === "stereotype"
                            ? "Place in defense position (hidden)"
                            : "Save for later - hidden until you choose to activate"}
                        </div>
                      </div>
                    </Button>
                  </>
                )}

                {/* Tribute Selection UI */}
                {showTributeSelection && (
                  <>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded mb-3">
                      <p className="text-sm text-yellow-400 font-medium mb-2">
                        Select {tributesRequired} Monster{tributesRequired > 1 ? "s" : ""} to
                        Tribute
                      </p>
                      <p className="text-xs text-[#a89f94] mb-3">
                        Selected: {selectedTributes.size} / {tributesRequired}
                      </p>

                      <div
                        className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto"
                        aria-label="Available monsters to tribute"
                        aria-multiselectable="true"
                      >
                        {availableTributes.map((tribute) => {
                          const isSelected = selectedTributes.has(tribute.cardId);
                          return (
                            <button
                              key={tribute.instanceId}
                              type="button"
                              aria-selected={isSelected}
                              aria-label={`${tribute.name}, Level ${tribute.monsterStats?.level}, Attack ${tribute.monsterStats?.attack}${isSelected ? ", selected" : ""}`}
                              onClick={() => toggleTribute(tribute.cardId)}
                              className={`p-2 rounded border-2 transition-all ${
                                isSelected
                                  ? "border-yellow-500 bg-yellow-500/20"
                                  : "border-[#3d2b1f] bg-[#3d2b1f]/30 hover:bg-[#3d2b1f]/50"
                              }`}
                            >
                              <p className="text-xs font-medium text-[#e8e0d5] truncate">
                                {tribute.name}
                              </p>
                              <p className="text-[10px] text-[#a89f94]">
                                Lv.{tribute.monsterStats?.level} - ATK:
                                {tribute.monsterStats?.attack}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold mb-2"
                      onClick={handleConfirmTributes}
                      disabled={!canProceedWithSummon}
                    >
                      Confirm Tribute Summon
                    </Button>

                    <Button
                      className="w-full bg-[#3d2b1f] hover:bg-[#4d3b2f] text-[#e8e0d5] font-medium"
                      onClick={() => {
                        setShowTributeSelection(false);
                        setSelectedTributes(new Set());
                        setPendingSummonPosition(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {/* Back to Hand */}
                {!showTributeSelection && (
                  <Button
                    className="w-full mt-3 bg-[#3d2b1f] hover:bg-[#4d3b2f] text-[#e8e0d5] font-medium"
                    onClick={() => {
                      console.log("Closing card modal - back to hand");
                      onClose();
                    }}
                  >
                    Back to Hand
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
