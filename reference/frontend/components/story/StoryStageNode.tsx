"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Crown, Gift, Lock, Shield, Star, Swords, Trophy } from "lucide-react";

interface StoryStageNodeProps {
  stage: {
    stageNumber: number;
    name: string;
    aiDifficulty: string;
    status: string;
    firstClearClaimed: boolean;
    rewardGold: number;
  };
  onClick?: () => void;
  className?: string;
}

interface DifficultyConfig {
  color: string;
  borderColor: string;
  glowColor: string;
  icon: React.ElementType;
}

const DEFAULT_CONFIG: DifficultyConfig = {
  color: "text-green-400",
  borderColor: "border-green-500/50",
  glowColor: "group-hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]",
  icon: Shield,
};

const DIFFICULTY_CONFIG: Record<string, DifficultyConfig> = {
  easy: DEFAULT_CONFIG,
  medium: {
    color: "text-yellow-400",
    borderColor: "border-yellow-500/50",
    glowColor: "group-hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]",
    icon: Swords,
  },
  hard: {
    color: "text-orange-400",
    borderColor: "border-orange-500/50",
    glowColor: "group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]",
    icon: Swords,
  },
  boss: {
    color: "text-red-400",
    borderColor: "border-red-500/50",
    glowColor: "group-hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    icon: Crown,
  },
};

export function StoryStageNode({ stage, onClick, className }: StoryStageNodeProps) {
  const config = DIFFICULTY_CONFIG[stage.aiDifficulty] ?? DEFAULT_CONFIG;
  const isLocked = stage.status === "locked";
  const isCompleted = stage.status === "completed" || stage.status === "starred";
  const isStarred = stage.status === "starred";
  const canClaimFirstClear = isCompleted && !stage.firstClearClaimed;

  return (
    <motion.button
      data-testid="story-stage"
      whileHover={!isLocked ? { scale: 1.1, y: -5 } : {}}
      whileTap={!isLocked ? { scale: 0.95 } : {}}
      onClick={!isLocked ? onClick : undefined}
      className={cn(
        "relative group flex flex-col items-center justify-center z-10",
        isLocked && "opacity-50 cursor-not-allowed grayscale",
        className
      )}
    >
      {/* Node Container */}
      <div className={cn("w-20 h-20 relative transition-all duration-300", config.glowColor)}>
        <div
          className={cn(
            "w-full h-full flex items-center justify-center rounded-sm zine-border bg-card",
            !isLocked && config.borderColor,
            stage.aiDifficulty === "boss" &&
              !isLocked &&
              "border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
          )}
        >
          {/* Inner Content */}
          <div className="flex flex-col items-center gap-1">
            {isLocked ? (
              <Lock className="w-6 h-6 text-gray-500" />
            ) : (
              <div className={cn("text-2xl font-bold font-serif", config.color)}>
                {stage.stageNumber}
              </div>
            )}

            {!isLocked && <config.icon className={cn("w-4 h-4", config.color, "opacity-80")} />}
          </div>
        </div>

        {/* Status Indicators */}
        {!isLocked && (
          <>
            {isStarred && (
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-black/80 rounded-full border border-yellow-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(234,179,8,0.5)] z-20">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
            )}

            {isCompleted && !isStarred && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-black/80 rounded-full border border-green-500/50 flex items-center justify-center z-20">
                <Trophy className="w-3 h-3 text-green-400" />
              </div>
            )}

            {canClaimFirstClear && (
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                className="absolute -bottom-3 -right-2 w-8 h-8 bg-purple-600 rounded-full border border-purple-400 flex items-center justify-center shadow-lg z-20"
              >
                <Gift className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Label */}
      <div
        className={cn(
          "absolute -bottom-8 left-1/2 -translate-x-1/2 w-max px-3 py-1 rounded-full bg-black/80 border border-white/20 text-xs text-white opacity-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-30",
          "group-hover:opacity-100 group-hover:-bottom-10"
        )}
      >
        {stage.name}
      </div>
    </motion.button>
  );
}
