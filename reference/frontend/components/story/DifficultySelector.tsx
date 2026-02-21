"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Clock, Crown, Lock, Shield, Skull, Sparkles, Swords } from "lucide-react";

export type DifficultyId = "normal" | "hard" | "legendary";

export interface DifficultyLevel {
  id: DifficultyId;
  label: string;
  requiredLevel: number;
  unlocked: boolean;
  rewards: string;
  attemptsRemaining?: number;
  maxAttempts?: number;
  resetsIn?: string;
}

interface DifficultySelectorProps {
  difficulties: DifficultyLevel[];
  selected: DifficultyId;
  onSelect: (difficulty: DifficultyId) => void;
  playerLevel: number;
  className?: string;
}

const DIFFICULTY_CONFIG: Record<
  DifficultyId,
  {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
    description: string;
  }
> = {
  normal: {
    icon: Shield,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/50",
    glowColor: "shadow-[0_0_15px_rgba(34,197,94,0.3)]",
    description: "Standard challenge",
  },
  hard: {
    icon: Swords,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/50",
    glowColor: "shadow-[0_0_15px_rgba(249,115,22,0.3)]",
    description: "Increased difficulty, 2x rewards",
  },
  legendary: {
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/50",
    glowColor: "shadow-[0_0_15px_rgba(168,85,247,0.3)]",
    description: "Ultimate challenge, 3x rewards",
  },
};

function formatTimeUntilReset(resetsIn: string | undefined) {
  if (!resetsIn) return null;
  return resetsIn;
}

export function DifficultySelector({
  difficulties,
  selected,
  onSelect,
  playerLevel,
  className,
}: DifficultySelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#a89f94]">Select Difficulty</span>
        <span className="text-xs text-[#a89f94]/70">Level {playerLevel}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {difficulties.map((difficulty) => {
          const config = DIFFICULTY_CONFIG[difficulty.id];
          const isSelected = selected === difficulty.id;
          const isLocked = !difficulty.unlocked;
          const hasAttempts =
            difficulty.attemptsRemaining === undefined ||
            difficulty.attemptsRemaining === -1 ||
            difficulty.attemptsRemaining > 0;

          return (
            <motion.button
              key={difficulty.id}
              type="button"
              whileHover={!isLocked && hasAttempts ? { scale: 1.02 } : {}}
              whileTap={!isLocked && hasAttempts ? { scale: 0.98 } : {}}
              onClick={() => {
                if (!isLocked && hasAttempts) {
                  onSelect(difficulty.id);
                }
              }}
              disabled={isLocked || !hasAttempts}
              className={cn(
                "relative flex flex-col items-center gap-1 p-3 rounded-lg border transition-all duration-200",
                isLocked || !hasAttempts
                  ? "opacity-50 cursor-not-allowed border-gray-600/50 bg-gray-800/30"
                  : isSelected
                    ? cn(config.bgColor, config.borderColor, config.glowColor, "border-2")
                    : cn("border-[#3d2b1f]/50 bg-black/30 hover:border-[#3d2b1f]")
              )}
            >
              {/* Lock Overlay */}
              {isLocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg z-10">
                  <Lock className="w-4 h-4 text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-400">Lvl {difficulty.requiredLevel}</span>
                </div>
              )}

              {/* No Attempts Overlay */}
              {!isLocked && !hasAttempts && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg z-10">
                  <Clock className="w-4 h-4 text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-400 text-center px-1">
                    {formatTimeUntilReset(difficulty.resetsIn) || "Resets soon"}
                  </span>
                </div>
              )}

              {/* Icon */}
              <config.icon
                className={cn(
                  "w-5 h-5 transition-colors",
                  isSelected && !isLocked ? config.color : "text-[#a89f94]"
                )}
              />

              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isSelected && !isLocked ? config.color : "text-[#e8e0d5]"
                )}
              >
                {difficulty.label}
              </span>

              {/* Reward Multiplier */}
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px]",
                  isSelected && !isLocked ? config.color : "text-[#a89f94]/70"
                )}
              >
                <Sparkles className="w-3 h-3" />
                <span>{difficulty.rewards}</span>
              </div>

              {/* Attempts Info (for hard/legendary) */}
              {!isLocked &&
                difficulty.maxAttempts !== undefined &&
                difficulty.maxAttempts !== -1 && (
                  <div className="text-[9px] text-[#a89f94]/60 mt-0.5">
                    {difficulty.attemptsRemaining}/{difficulty.maxAttempts} left
                  </div>
                )}

              {/* Selected Indicator */}
              {isSelected && !isLocked && hasAttempts && (
                <motion.div
                  layoutId="difficulty-selector"
                  className={cn(
                    "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                    config.bgColor,
                    "border",
                    config.borderColor
                  )}
                  initial={false}
                >
                  <Skull className={cn("w-2.5 h-2.5", config.color)} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Difficulty Description */}
      <div className="text-xs text-center text-[#a89f94]/70 pt-1">
        {DIFFICULTY_CONFIG[selected].description}
      </div>
    </div>
  );
}
