"use client";

import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface LifePointsBarProps {
  playerName: string;
  lifePoints: number;
  maxLifePoints: number;
  isOpponent?: boolean;
  isActive?: boolean;
  isAi?: boolean;
}

export function LifePointsBar({
  playerName,
  lifePoints,
  maxLifePoints,
  isOpponent = false,
  isActive = false,
  isAi = false,
}: LifePointsBarProps) {
  const percentage = Math.max(0, Math.min(100, (lifePoints / maxLifePoints) * 100));

  const getHealthColor = () => {
    if (percentage > 50) return "bg-green-500";
    if (percentage > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border transition-all flex-1 sm:flex-none",
        isActive && "border-primary bg-primary/5",
        !isActive && "border-border bg-muted/30"
      )}
    >
      {/* Player name */}
      <div className="flex items-center gap-1 min-w-0 sm:min-w-[100px]">
        <div
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"
          )}
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "font-medium text-[10px] sm:text-xs truncate",
                isOpponent && "text-muted-foreground"
              )}
            >
              {playerName}
            </span>
            {isAi && (
              <span className="text-[8px] bg-purple-500/10 text-purple-400 px-0.5 rounded border border-purple-500/20">
                AI
              </span>
            )}
          </div>
          {isActive && isAi && (
            <span className="text-[8px] text-primary animate-pulse">Thinking...</span>
          )}
        </div>
      </div>

      {/* Life points display */}
      <div className="flex items-center gap-1 flex-1">
        <Heart
          className={cn("h-3 w-3 shrink-0", percentage <= 25 ? "text-red-500" : "text-pink-500")}
        />
        <div className="flex-1 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden min-w-[30px]">
          <div
            className={cn("h-full transition-all duration-500", getHealthColor())}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span
          data-testid={isOpponent ? "opponent-lp" : "player-lp"}
          className="text-[9px] sm:text-xs font-mono font-medium min-w-[35px] sm:min-w-[50px] text-right"
        >
          {lifePoints.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
