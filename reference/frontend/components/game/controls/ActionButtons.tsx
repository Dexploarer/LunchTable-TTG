"use client";

import { Button } from "@/components/ui/button";
import { Flag, Settings, Swords } from "lucide-react";

interface ActionButtonsProps {
  isPlayerTurn: boolean;
  isBattlePhase: boolean;
  canAttack: boolean;
  canEndTurn: boolean;
  onEndTurn: () => void;
  onAttack?: () => void;
  onSettings?: () => void;
}

export function ActionButtons({
  isPlayerTurn,
  isBattlePhase,
  canAttack,
  canEndTurn,
  onEndTurn,
  onAttack,
  onSettings,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Attack button - only in battle phase */}
      {isBattlePhase && canAttack && (
        <Button
          size="sm"
          variant="destructive"
          onClick={onAttack}
          className="gap-1 h-6 text-[10px] px-2"
          aria-label="Attack with a monster"
        >
          <Swords className="h-3 w-3" />
          <span className="hidden sm:inline">Attack</span>
        </Button>
      )}

      {/* End Turn button */}
      <Button
        size="sm"
        variant={isPlayerTurn ? "default" : "secondary"}
        disabled={!isPlayerTurn || !canEndTurn}
        onClick={onEndTurn}
        className="gap-1 h-6 text-[10px] px-2"
        aria-label={isPlayerTurn ? "End your turn" : "Waiting for your turn"}
      >
        <Flag className="h-3 w-3" />
        <span className="hidden sm:inline">End Turn</span>
        <span className="sm:hidden">End</span>
      </Button>

      {/* Settings button */}
      {onSettings && (
        <Button size="icon" variant="ghost" onClick={onSettings} className="h-6 w-6">
          <Settings className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
