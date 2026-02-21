"use client";

import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Ban, Check, Shield, Sparkles, Sword, Zap } from "lucide-react";
import type { CardInZone } from "../../hooks/useGameBoard";

interface BoardCardProps {
  card: CardInZone;
  onClick?: () => void;
  isSelected?: boolean;
  isTargetable?: boolean;
  isAttacking?: boolean;
  isActivatable?: boolean;
  canAttack?: boolean;
  onAttack?: () => void;
  size?: "xs" | "sm" | "md" | "lg";
  showStats?: boolean;
  isOpponent?: boolean;
  effectUsed?: boolean;
  hasContinuousEffect?: boolean;
}

const RARITY_COLORS: Record<string, string> = {
  common: "border-gray-500/50",
  uncommon: "border-green-500/50",
  rare: "border-blue-500/50",
  epic: "border-purple-500/50",
  legendary: "border-yellow-500/50",
};

const RARITY_GLOW: Record<string, string> = {
  common: "",
  uncommon: "shadow-green-500/20",
  rare: "shadow-blue-500/30",
  epic: "shadow-purple-500/40",
  legendary: "shadow-yellow-500/50",
};

export function BoardCard({
  card,
  onClick,
  isSelected = false,
  isTargetable = false,
  isAttacking = false,
  isActivatable = false,
  canAttack = false,
  onAttack,
  size = "md",
  showStats = true,
  isOpponent = false,
  effectUsed = false,
  hasContinuousEffect = false,
}: BoardCardProps) {
  const isDefensePosition = card.position === "defense" || card.position === "setDefense";
  const isFaceDown = card.isFaceDown;

  // Scaled down card sizes for full-page fit
  const sizeClasses = {
    xs: "w-7 h-10 sm:w-9 sm:h-13",
    sm: "w-8 h-11 sm:w-10 sm:h-14",
    md: "w-10 h-14 sm:w-12 sm:h-16",
    lg: "w-12 h-16 sm:w-14 sm:h-20",
  };

  const effectiveAttack = card.monsterStats
    ? (card.monsterStats.attack ?? 0) + (card.attackModifier ?? 0)
    : 0;
  const effectiveDefense = card.monsterStats
    ? (card.monsterStats.defense ?? 0) + (card.defenseModifier ?? 0)
    : 0;

  // Determine test ID based on card type and owner
  const isMonster =
    card.cardType === "monster" || card.cardType === "stereotype" || card.monsterStats;
  const testId = isMonster
    ? isOpponent
      ? "opponent-monster"
      : "player-monster"
    : isOpponent
      ? "opponent-spell-trap"
      : "player-spell-trap";

  return (
    <motion.button
      data-testid={testId}
      data-card-id={card.instanceId}
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-md border-2 transition-all duration-200",
        sizeClasses[size],
        isDefensePosition && "rotate-90",
        isFaceDown
          ? "bg-linear-to-br from-indigo-900 to-purple-900 border-indigo-500/50"
          : cn(
              "bg-linear-to-br from-slate-800 to-slate-900",
              card.rarity
                ? (RARITY_COLORS[card.rarity] ?? RARITY_COLORS.common)
                : RARITY_COLORS.common,
              card.rarity ? (RARITY_GLOW[card.rarity] ?? "") : ""
            ),
        isSelected && "ring-2 ring-yellow-400 ring-offset-1 ring-offset-slate-900",
        isTargetable && "ring-2 ring-red-500 shadow-lg shadow-red-500/50 animate-pulse",
        isAttacking && "ring-2 ring-orange-500 shadow-lg shadow-orange-500/50",
        isActivatable && "ring-2 ring-green-500 shadow-lg shadow-green-500/40 animate-pulse",
        card.hasAttacked && "opacity-60",
        onClick && "cursor-pointer hover:shadow-lg"
      )}
    >
      {isFaceDown ? (
        <div className="absolute inset-0 rounded overflow-hidden">
          <Image
            src="/card-back.png"
            alt="Card Back"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 40px, 56px"
          />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 rounded overflow-hidden">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.name || "Card"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 40px, 56px"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <span className="text-[6px] text-slate-400 text-center px-0.5 leading-tight">
                  {card.name ? card.name.substring(0, 10) : "Card"}
                </span>
              </div>
            )}
          </div>

          {card.cardType && card.cardType !== "monster" && card.cardType !== "stereotype" && (
            <div
              className={cn(
                "absolute top-0 left-0 px-0.5 rounded text-[6px] font-bold uppercase",
                card.cardType === "spell" && "bg-green-600 text-white",
                card.cardType === "trap" && "bg-purple-600 text-white",
                card.cardType === "field" && "bg-teal-600 text-white"
              )}
            >
              {card.cardType[0]}
            </div>
          )}

          {showStats && card.monsterStats && !isDefensePosition && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-0.5 py-0.5 flex justify-between text-[8px] font-bold">
              <span className="text-red-400 flex items-center gap-0.5">
                <Sword className="w-2 h-2" />
                {effectiveAttack}
              </span>
              <span className="text-blue-400 flex items-center gap-0.5">
                <Shield className="w-2 h-2" />
                {effectiveDefense}
              </span>
            </div>
          )}

          {showStats && card.monsterStats && isDefensePosition && (
            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 -rotate-90 bg-black/80 px-0.5 py-0.5 rounded text-[6px] font-bold whitespace-nowrap">
              <span className="text-blue-400">{effectiveDefense} DEF</span>
            </div>
          )}

          {card.monsterStats?.level && (
            <div className="absolute top-0 right-0 flex gap-px">
              {Array.from({ length: Math.min(card.monsterStats.level, 3) }).map((_, i) => (
                <div key={`level-star-${i}`} className="w-1 h-1 rounded-full bg-yellow-400" />
              ))}
              {card.monsterStats.level > 3 && (
                <span className="text-[6px] text-yellow-400 font-bold ml-0.5">
                  +{card.monsterStats.level - 3}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* Protection Effect Badges */}
      {!isFaceDown && (
        <div className="absolute top-1 left-1 flex flex-col gap-0.5">
          {card.cannotBeDestroyedByBattle && (
            <div
              className="w-3 h-3 rounded-full bg-amber-500/90 border border-amber-300 flex items-center justify-center shadow-sm"
              title="Cannot be destroyed by battle"
            >
              <Shield className="w-2 h-2 text-white" />
            </div>
          )}
          {card.cannotBeDestroyedByEffects && (
            <div
              className="w-3 h-3 rounded-full bg-emerald-500/90 border border-emerald-300 flex items-center justify-center shadow-sm"
              title="Cannot be destroyed by card effects"
            >
              <Sparkles className="w-2 h-2 text-white" />
            </div>
          )}
          {card.cannotBeTargeted && (
            <div
              className="w-3 h-3 rounded-full bg-purple-500/90 border border-purple-300 flex items-center justify-center shadow-sm"
              title="Cannot be targeted by card effects"
            >
              <Ban className="w-2 h-2 text-white" />
            </div>
          )}
          {hasContinuousEffect && (
            <div
              className="w-3 h-3 rounded-full bg-cyan-500/90 border border-cyan-300 flex items-center justify-center shadow-sm animate-pulse"
              title="Continuous effect active"
            >
              <Zap className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Effect Usage Indicator (OPT/HOPT) */}
      {!isFaceDown && effectUsed && (
        <div className="absolute top-1 right-1">
          <div
            className="w-3 h-3 rounded-full bg-gray-600/90 border border-gray-400 flex items-center justify-center shadow-sm"
            title="Effect used this turn"
          >
            <Check className="w-2 h-2 text-white" />
          </div>
        </div>
      )}

      {card.hasAttacked && !isFaceDown && (
        <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center">
          <span className="text-[6px] text-gray-300 font-medium">USED</span>
        </div>
      )}

      {canAttack && !card.hasAttacked && !isFaceDown && onAttack && (
        <button
          type="button"
          className="absolute inset-0 bg-linear-to-t from-red-600/90 via-red-500/80 to-transparent rounded flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onAttack();
          }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <Sword className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-pulse" />
            <span className="text-[7px] sm:text-[9px] text-white font-bold uppercase tracking-wide">
              Attack
            </span>
          </div>
        </button>
      )}
    </motion.button>
  );
}

export function EmptySlot({
  onClick,
  label,
  size = "md",
  highlighted = false,
  className,
}: {
  onClick?: () => void;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  highlighted?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    xs: "w-7 h-10 sm:w-9 sm:h-13",
    sm: "w-8 h-11 sm:w-10 sm:h-14",
    md: "w-10 h-14 sm:w-12 sm:h-16",
    lg: "w-12 h-16 sm:w-14 sm:h-20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border-2 border-dashed transition-all duration-200",
        sizeClasses[size],
        highlighted
          ? "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
          : "border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/30",
        onClick && "cursor-pointer",
        className
      )}
    >
      {label && <span className="text-[6px] text-slate-500 font-medium">{label}</span>}
    </button>
  );
}
