"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Timer } from "lucide-react";
import { useEffect, useState } from "react";

interface TimeoutDisplayProps {
  actionTimeRemainingMs: number;
  matchTimeRemainingMs: number;
  isWarning: boolean;
  isTimedOut: boolean;
  isMatchTimedOut: boolean;
  className?: string;
}

/**
 * Format milliseconds to M:SS display
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TimeoutDisplay({
  actionTimeRemainingMs: initialActionTime,
  matchTimeRemainingMs: initialMatchTime,
  isWarning,
  isTimedOut,
  isMatchTimedOut,
  className,
}: TimeoutDisplayProps) {
  const [actionTime, setActionTime] = useState(initialActionTime);
  const [matchTime, setMatchTime] = useState(initialMatchTime);

  // Sync with props when they change
  useEffect(() => {
    setActionTime(initialActionTime);
  }, [initialActionTime]);

  useEffect(() => {
    setMatchTime(initialMatchTime);
  }, [initialMatchTime]);

  // Client-side countdown that updates every second
  useEffect(() => {
    if (isTimedOut && isMatchTimedOut) return;

    const interval = setInterval(() => {
      if (!isTimedOut) {
        setActionTime((prev) => Math.max(0, prev - 1000));
      }
      if (!isMatchTimedOut) {
        setMatchTime((prev) => Math.max(0, prev - 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimedOut, isMatchTimedOut]);

  const actionDisplay = formatTimeRemaining(actionTime);
  const matchDisplay = formatTimeRemaining(matchTime);

  // Determine visual states
  const showActionWarning = isWarning && !isTimedOut;
  const showActionTimeout = isTimedOut;
  const showMatchTimeout = isMatchTimedOut;
  const matchLow = matchTime <= 300000 && !isMatchTimedOut; // 5 minutes warning

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg border",
        "bg-muted/50 backdrop-blur-sm",
        className
      )}
      data-testid="timeout-display"
    >
      {/* Action Timer */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded",
          "transition-all duration-200",
          showActionTimeout && "bg-red-500/20 border border-red-500/50",
          showActionWarning &&
            !showActionTimeout &&
            "bg-amber-500/20 border border-amber-500/50 animate-warning-pulse",
          !showActionWarning && !showActionTimeout && "bg-muted/30"
        )}
        data-testid="action-timer"
      >
        {showActionTimeout ? (
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
        ) : showActionWarning ? (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
        ) : (
          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <div className="flex flex-col">
          <span className="text-[8px] text-muted-foreground uppercase tracking-wide leading-none">
            Action
          </span>
          <span
            className={cn(
              "text-xs font-mono font-bold tabular-nums leading-tight",
              showActionTimeout && "text-red-500",
              showActionWarning && !showActionTimeout && "text-amber-500",
              !showActionWarning && !showActionTimeout && "text-foreground"
            )}
          >
            {showActionTimeout ? "0:00" : actionDisplay}
          </span>
        </div>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-border" />

      {/* Match Timer */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded",
          "transition-all duration-200",
          showMatchTimeout && "bg-red-500/20 border border-red-500/50",
          matchLow && !showMatchTimeout && "bg-amber-500/10",
          !matchLow && !showMatchTimeout && "bg-muted/30"
        )}
        data-testid="match-timer"
      >
        {showMatchTimeout ? (
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <Clock
            className={cn("h-3.5 w-3.5", matchLow ? "text-amber-500" : "text-muted-foreground")}
          />
        )}
        <div className="flex flex-col">
          <span className="text-[8px] text-muted-foreground uppercase tracking-wide leading-none">
            Match
          </span>
          <span
            className={cn(
              "text-xs font-mono font-bold tabular-nums leading-tight",
              showMatchTimeout && "text-red-500",
              matchLow && !showMatchTimeout && "text-amber-500/80",
              !matchLow && !showMatchTimeout && "text-muted-foreground"
            )}
          >
            {showMatchTimeout ? "0:00" : matchDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}
