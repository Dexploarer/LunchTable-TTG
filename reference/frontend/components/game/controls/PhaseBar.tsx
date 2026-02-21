"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, ChevronRight, Link2, Loader2, Sparkles, Swords } from "lucide-react";

// Only show interactive phases that players actually stop at
const PHASES = [
  { id: "main", label: "Main Phase", shortLabel: "Main", fullName: "Main Phase" },
  { id: "combat", label: "Combat", shortLabel: "Combat", fullName: "Combat Phase" },
  { id: "breakdown_check", label: "Breakdown", shortLabel: "BD", fullName: "Breakdown Check" },
] as const;

// Map all phases to display phases for highlighting
const PHASE_MAPPING: Record<string, string> = {
  draw: "main",
  main: "main",
  combat: "combat",
  breakdown_check: "breakdown_check",
  end: "breakdown_check",
};

interface PhaseBarProps {
  currentPhase: string;
  turnNumber: number;
  isPlayerTurn: boolean;
  canAdvancePhase: boolean;
  onAdvancePhase: () => void;
  onEndTurn: () => void;
  battleSubPhase?: "battle_step" | "damage_step";
  isChainResolving?: boolean;
  isOpponentResponding?: boolean;
}

export function PhaseBar({
  currentPhase,
  turnNumber,
  isPlayerTurn,
  canAdvancePhase,
  onAdvancePhase,
  onEndTurn,
  battleSubPhase,
  isChainResolving,
  isOpponentResponding,
}: PhaseBarProps) {
  // Map current phase to display phase
  const displayPhase = PHASE_MAPPING[currentPhase] || currentPhase;
  const currentPhaseIndex = PHASES.findIndex((p) => p.id === displayPhase);

  // Determine button label based on current phase
  const getAdvanceButtonLabel = () => {
    if (currentPhase === "main") return "Combat";
    if (currentPhase === "combat") return "End Turn";
    return "Next";
  };

  // Get phase hint based on current phase
  const getPhaseHint = () => {
    if (isOpponentResponding) {
      return {
        icon: Loader2,
        text: "Opponent is deciding whether to activate a card...",
        color: "text-orange-400",
      };
    }
    if (isChainResolving) {
      return {
        icon: Link2,
        text: "Chain is resolving — effects execute in reverse order",
        color: "text-cyan-400",
      };
    }
    if (!isPlayerTurn) return null;

    switch (currentPhase) {
      case "draw":
      case "main":
        return {
          icon: Sparkles,
          text: "Summon monsters, activate spells, set cards",
          color: "text-purple-400",
        };
      case "combat":
        return {
          icon: Swords,
          text:
            battleSubPhase === "battle_step"
              ? "Battle Step — Respond to attack declaration"
              : battleSubPhase === "damage_step"
                ? "Damage Step — Modify ATK/DEF before calculation"
                : "Attack with your monsters",
          color: "text-red-400",
        };
      case "breakdown_check":
        return {
          icon: AlertTriangle,
          text: "Checking for breakdown conditions",
          color: "text-amber-400",
        };
      case "end":
        return {
          icon: ChevronRight,
          text: "Ending turn...",
          color: "text-gray-400",
        };
      default:
        return null;
    }
  };

  const phaseHint = getPhaseHint();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg border">
        {/* Turn indicator */}
        <div className="flex items-center gap-1 pr-2 border-r">
          <span className="text-[8px] sm:text-[10px] text-muted-foreground">Turn</span>
          <span className="text-[10px] sm:text-xs font-bold" data-testid="turn-number">
            {turnNumber}
          </span>
        </div>

        {/* Phase indicators */}
        <div className="flex items-center gap-1">
          {PHASES.map((phase, index) => {
            const isActive = phase.id === displayPhase;
            const isPast = index < currentPhaseIndex;

            return (
              <div
                key={phase.id}
                className={cn(
                  "px-2 sm:px-3 py-1 rounded text-[9px] sm:text-[11px] font-semibold transition-all duration-200 whitespace-nowrap",
                  isActive &&
                    "bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 scale-105",
                  isPast && "text-muted-foreground/70 bg-muted/30",
                  !isActive && !isPast && "text-muted-foreground/40 bg-muted/10"
                )}
              >
                <span className="hidden sm:inline">{phase.label}</span>
                <span className="sm:hidden">{phase.shortLabel}</span>
              </div>
            );
          })}
        </div>

        {/* Advance button */}
        {isPlayerTurn && canAdvancePhase && (
          <Button
            size="sm"
            variant="default"
            onClick={currentPhase === "combat" ? onEndTurn : onAdvancePhase}
            className="ml-auto gap-1 h-7 text-[11px] px-3 font-semibold bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {getAdvanceButtonLabel()}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Turn / status indicator */}
        {isOpponentResponding ? (
          <div className="ml-auto px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[8px] sm:text-[10px] font-medium flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="hidden sm:inline">Opponent Responding...</span>
            <span className="sm:hidden">Responding...</span>
          </div>
        ) : isChainResolving ? (
          <div className="ml-auto px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[8px] sm:text-[10px] font-medium flex items-center gap-1">
            <Link2 className="h-3 w-3 animate-pulse" />
            <span className="hidden sm:inline">Chain Resolving</span>
            <span className="sm:hidden">Chain</span>
          </div>
        ) : !isPlayerTurn ? (
          <div className="ml-auto px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-600 text-[8px] sm:text-[10px] font-medium">
            <span className="hidden sm:inline">Opponent&apos;s Turn</span>
            <span className="sm:hidden">Opp Turn</span>
          </div>
        ) : null}
      </div>

      {/* Phase Hint */}
      {phaseHint && (
        <div className="px-2 py-1.5 bg-muted/30 rounded border border-muted/50 flex items-center gap-2">
          <phaseHint.icon className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", phaseHint.color)} />
          <span className={cn("text-[9px] sm:text-[11px] font-medium", phaseHint.color)}>
            {phaseHint.text}
          </span>
        </div>
      )}
    </div>
  );
}
