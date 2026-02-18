"use client";

import { ArchetypeIcon } from "@/components/ui/ArchetypeIcon";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Clock,
  Coins,
  Shield,
  ShieldAlert,
  Sparkles,
  Star,
  Sword,
  X,
  Zap,
} from "lucide-react";
import type { CardInZone } from "../hooks/useGameBoard";

interface CardInspectorModalProps {
  isOpen: boolean;
  card: CardInZone | null;
  isOpponentCard?: boolean;
  onClose: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-400",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-yellow-400",
};

const RARITY_BORDERS: Record<string, string> = {
  common: "border-gray-500/50",
  uncommon: "border-green-500/50",
  rare: "border-blue-500/50",
  epic: "border-purple-500/50",
  legendary: "border-yellow-500/50 shadow-lg shadow-yellow-500/20",
};

const CARD_TYPE_COLORS: Record<string, string> = {
  stereotype: "bg-amber-600",
  spell: "bg-green-600",
  trap: "bg-purple-600",
  class: "bg-cyan-600",
  field: "bg-teal-600",
};

export function CardInspectorModal({
  isOpen,
  card,
  isOpponentCard = false,
  onClose,
}: CardInspectorModalProps) {
  if (!card) return null;

  const hasModifiers = (card.attackModifier ?? 0) !== 0 || (card.defenseModifier ?? 0) !== 0;
  const effectiveAttack = card.monsterStats
    ? (card.monsterStats.attack ?? 0) + (card.attackModifier ?? 0)
    : 0;
  const effectiveDefense = card.monsterStats
    ? (card.monsterStats.defense ?? 0) + (card.defenseModifier ?? 0)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-sm max-h-[90vh] overflow-hidden"
          >
            <div className="bg-background border rounded-xl shadow-2xl overflow-hidden">
              {/* Header with close button */}
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                <div className="flex items-center gap-1.5">
                  {card.cardType && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-white",
                        CARD_TYPE_COLORS[card.cardType] ?? "bg-slate-600"
                      )}
                    >
                      {card.cardType}
                    </span>
                  )}
                  {isOpponentCard && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">
                      Opponent
                    </span>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto max-h-[calc(90vh-50px)] p-3 sm:p-4">
                {/* Card image and basic info */}
                <div className="flex gap-2 sm:gap-3 mb-3">
                  {/* Card image */}
                  <div
                    className={cn(
                      "w-16 h-24 sm:w-20 sm:h-28 rounded-lg border-2 overflow-hidden shrink-0",
                      RARITY_BORDERS[card.rarity ?? "common"] ?? RARITY_BORDERS.common
                    )}
                  >
                    {card.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt={card.name ?? "Card"}
                        width={80}
                        height={112}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center p-1">
                        <span className="text-[10px] text-slate-400 text-center">{card.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Basic info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-xs sm:text-sm leading-tight mb-1 wrap-break-word">
                      {card.name}
                    </h2>

                    {/* Rarity */}
                    <div className="flex items-center gap-1 mb-1">
                      <Star className={cn("w-2.5 h-2.5", RARITY_COLORS[card.rarity ?? "common"])} />
                      <span
                        className={cn("text-xs capitalize", RARITY_COLORS[card.rarity ?? "common"])}
                      >
                        {card.rarity}
                      </span>
                    </div>

                    {/* Monster stats */}
                    {card.monsterStats && (
                      <div className="space-y-0.5">
                        {/* Level */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Level</span>
                          <span className="font-bold text-yellow-400">
                            {card.monsterStats.level}
                          </span>
                          <div className="flex gap-px ml-0.5">
                            {Array.from({ length: Math.min(card.monsterStats.level, 6) }).map(
                              (_, i) => (
                                <div
                                  key={`level-indicator-${i}`}
                                  className="w-1.5 h-1.5 rounded-full bg-yellow-400"
                                />
                              )
                            )}
                          </div>
                        </div>

                        {/* ATK/DEF */}
                        <div className="flex gap-3 pt-1">
                          <div className="flex items-center gap-1">
                            <Sword className="w-3 h-3 text-red-400" />
                            <span className="text-sm font-bold text-red-400">
                              {effectiveAttack}
                            </span>
                            {(card.attackModifier ?? 0) !== 0 && (
                              <span
                                className={cn(
                                  "text-[10px]",
                                  (card.attackModifier ?? 0) > 0 ? "text-green-400" : "text-red-500"
                                )}
                              >
                                ({(card.attackModifier ?? 0) > 0 ? "+" : ""}
                                {card.attackModifier})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-blue-400" />
                            <span className="text-sm font-bold text-blue-400">
                              {effectiveDefense}
                            </span>
                            {(card.defenseModifier ?? 0) !== 0 && (
                              <span
                                className={cn(
                                  "text-[10px]",
                                  (card.defenseModifier ?? 0) > 0
                                    ? "text-green-400"
                                    : "text-red-500"
                                )}
                              >
                                ({(card.defenseModifier ?? 0) > 0 ? "+" : ""}
                                {card.defenseModifier})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current status */}
                {(card.position || card.hasAttacked) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {card.position && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          card.position === "attack"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        )}
                      >
                        {card.position === "attack" ? "Attack Position" : "Defense Position"}
                      </span>
                    )}
                    {card.hasAttacked && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500/20 text-gray-400">
                        Already Attacked
                      </span>
                    )}
                  </div>
                )}

                {/* Active Buffs/Debuffs */}
                {hasModifiers && (
                  <div className="mb-3">
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Active Modifiers
                    </h3>
                    <div className="space-y-0.5">
                      {(card.attackModifier ?? 0) !== 0 && (
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs",
                            (card.attackModifier ?? 0) > 0
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          )}
                        >
                          {(card.attackModifier ?? 0) > 0 ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          <span>
                            ATK {(card.attackModifier ?? 0) > 0 ? "+" : ""}
                            {card.attackModifier}
                          </span>
                        </div>
                      )}
                      {(card.defenseModifier ?? 0) !== 0 && (
                        <div
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs",
                            (card.defenseModifier ?? 0) > 0
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          )}
                        >
                          {(card.defenseModifier ?? 0) > 0 ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          <span>
                            DEF {(card.defenseModifier ?? 0) > 0 ? "+" : ""}
                            {card.defenseModifier}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Effects/Abilities */}
                {card.effects && card.effects.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Abilities
                    </h3>
                    <div className="space-y-1.5">
                      {card.effects.map((effect, index) => (
                        <div
                          key={`ability-${effect.name}-${index}`}
                          className="p-2 border rounded-lg bg-muted/20"
                        >
                          {/* Effect header with name and type badges */}
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="font-medium text-xs">{effect.name}</span>
                            {effect.effectType && (
                              <span className="text-[10px] px-1 py-0.5 bg-primary/10 text-primary rounded capitalize">
                                {effect.effectType}
                              </span>
                            )}
                            {effect.trigger && effect.trigger !== "manual" && (
                              <span className="text-[10px] px-1 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                                {effect.trigger}
                              </span>
                            )}
                            {effect.spellSpeed && effect.spellSpeed > 1 && (
                              <span
                                className={cn(
                                  "text-[10px] px-1 py-0.5 rounded",
                                  effect.spellSpeed === 3
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-yellow-500/10 text-yellow-400"
                                )}
                              >
                                Speed {effect.spellSpeed}
                              </span>
                            )}
                          </div>

                          {/* Effect description */}
                          <p className="text-[10px] text-muted-foreground mb-1">
                            {effect.description}
                          </p>

                          {/* Restrictions and costs */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {/* Cost display */}
                            {effect.cost && (
                              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20">
                                <Coins className="w-2.5 h-2.5" />
                                {effect.cost.description}
                              </span>
                            )}

                            {/* OPT restriction */}
                            {effect.isOPT && !effect.isHOPT && (
                              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded border border-orange-500/20">
                                <Clock className="w-2.5 h-2.5" />
                                Once per turn
                              </span>
                            )}

                            {/* Hard OPT restriction */}
                            {effect.isHOPT && (
                              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20">
                                <AlertCircle className="w-2.5 h-2.5" />
                                Hard once per turn
                              </span>
                            )}

                            {/* Continuous effect */}
                            {effect.isContinuous && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20">
                                Continuous
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Protection Flags */}
                {(card.cannotBeDestroyedByBattle ||
                  card.cannotBeDestroyedByEffects ||
                  card.cannotBeTargeted) && (
                  <div className="mb-3">
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Protection
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {card.cannotBeDestroyedByBattle && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                          Battle Immune
                        </span>
                      )}
                      {card.cannotBeDestroyedByEffects && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
                          Effect Immune
                        </span>
                      )}
                      {card.cannotBeTargeted && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">
                          Cannot be Targeted
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Archetype */}
                {card.archetype && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">Archetype:</span>
                    <ArchetypeIcon archetype={card.archetype} size="sm" />
                    <span className="text-primary">{card.archetype}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
