"use client";

import { Button } from "@/components/ui/button";
import { typedApi, useConvexMutation } from "@/lib/convexHelpers";
import { cn } from "@/lib/utils";
import { FastForward, Flag, SkipForward } from "lucide-react";
import { useState } from "react";

/**
 * Game Phase Types
 *
 * LunchTable TCG has 5 phases: draw → main → combat → breakdown_check → end
 */
export type GamePhase = "draw" | "main" | "combat" | "breakdown_check" | "end";

interface PhaseSkipButtonsProps {
  lobbyId: string;
  currentPhase: GamePhase;
  isCurrentPlayerTurn: boolean;
  onPhaseChange?: (newPhase: GamePhase) => void;
}

/**
 * PhaseSkipButtons - Inline controls for skipping game phases
 *
 * Shows contextual buttons based on the current phase:
 * - During main: "Skip Combat" button (skips to end)
 * - During main or combat: "End Turn" button
 */
export function PhaseSkipButtons({
  lobbyId,
  currentPhase,
  isCurrentPlayerTurn,
  onPhaseChange,
}: PhaseSkipButtonsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Mutations for phase skipping
  const skipBattlePhase = useConvexMutation(typedApi.gameplay.phaseManager.skipBattlePhase);
  const skipToEndPhase = useConvexMutation(typedApi.gameplay.phaseManager.skipToEndPhase);
  const skipMainPhase2 = useConvexMutation(typedApi.gameplay.phaseManager.skipMainPhase2);

  const isDisabled = !isCurrentPlayerTurn || loadingAction !== null;

  // Determine which phases allow which skip actions
  const canSkipBattle = currentPhase === "main";
  const canSkipToEnd = currentPhase === "main" || currentPhase === "combat";
  const canEndTurn = currentPhase === "combat" || currentPhase === "main";

  const handleSkipBattle = async () => {
    if (isDisabled) return;
    setLoadingAction("skipBattle");
    try {
      const result = await skipBattlePhase({ lobbyId });
      if (result.success && onPhaseChange) {
        onPhaseChange(result.newPhase as GamePhase);
      }
    } catch (error) {
      console.error("Failed to skip battle phase:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSkipToEnd = async () => {
    if (isDisabled) return;
    setLoadingAction("skipToEnd");
    try {
      const result = await skipToEndPhase({ lobbyId });
      if (result.success && onPhaseChange) {
        onPhaseChange(result.newPhase as GamePhase);
      }
    } catch (error) {
      console.error("Failed to skip to end phase:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEndTurn = async () => {
    if (isDisabled) return;
    setLoadingAction("endTurn");
    try {
      const result = await skipMainPhase2({ lobbyId });
      if (result.success && onPhaseChange) {
        onPhaseChange(result.newPhase as GamePhase);
      }
    } catch (error) {
      console.error("Failed to end turn:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  // Don't render anything during non-skippable phases
  if (!canSkipBattle && !canSkipToEnd && !canEndTurn) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {/* Skip Combat button - shown during main */}
      {currentPhase === "main" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isDisabled}
          onClick={handleSkipBattle}
          className={cn(
            "gap-1 h-6 text-[10px] px-2 border-slate-600 bg-slate-800/50 hover:bg-slate-700/50",
            loadingAction === "skipBattle" && "opacity-70"
          )}
          data-testid="skip-battle-btn"
        >
          <SkipForward
            className={cn("h-3 w-3", loadingAction === "skipBattle" && "animate-pulse")}
          />
          <span className="hidden sm:inline">Skip Combat</span>
          <span className="sm:hidden">Skip</span>
        </Button>
      )}

      {/* Skip to End button - shown during main and combat */}
      {canSkipToEnd && (
        <Button
          size="sm"
          variant="outline"
          disabled={isDisabled}
          onClick={handleSkipToEnd}
          className={cn(
            "gap-1 h-6 text-[10px] px-2 border-amber-600/50 bg-amber-900/20 hover:bg-amber-800/30 text-amber-400",
            loadingAction === "skipToEnd" && "opacity-70"
          )}
          data-testid="skip-to-end-btn"
        >
          <FastForward
            className={cn("h-3 w-3", loadingAction === "skipToEnd" && "animate-pulse")}
          />
          <span className="hidden sm:inline">Skip to End</span>
          <span className="sm:hidden">End</span>
        </Button>
      )}

      {/* End Turn button - shown during main or combat */}
      {canEndTurn && (
        <Button
          size="sm"
          variant="default"
          disabled={isDisabled}
          onClick={handleEndTurn}
          className={cn(
            "gap-1 h-6 text-[10px] px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700",
            loadingAction === "endTurn" && "opacity-70"
          )}
          data-testid="end-turn-btn"
        >
          <Flag className={cn("h-3 w-3", loadingAction === "endTurn" && "animate-pulse")} />
          <span className="hidden sm:inline">End Turn</span>
          <span className="sm:hidden">End</span>
        </Button>
      )}
    </div>
  );
}
