"use client";

import { TutorialOverlay, TutorialResumePrompt } from "@/components/help";
import { useRef } from "react";
import { useTutorial } from "./hooks/useTutorial";

interface GameState {
  currentPhase: string;
  isPlayerTurn: boolean;
  turnNumber: number;
  myLifePoints: number;
  opponentLifePoints: number;
  myHand: Array<{ cardType?: string }>;
  myField: Array<{ cardType?: string }>;
}

interface TutorialManagerProps {
  /** Whether tutorial should be active (e.g., Ch1 S1) */
  enabled: boolean;
  /** Current game state to check for triggers */
  gameState: GameState | null;
  /** Optional ref to highlight element for current moment */
  highlightRefs?: Record<string, React.RefObject<HTMLElement>>;
}

/**
 * Tutorial Manager
 *
 * Manages tutorial state and displays appropriate overlays.
 * Should be rendered alongside the GameBoard in story mode Ch1 S1.
 */
export function TutorialManager({ enabled, gameState, highlightRefs = {} }: TutorialManagerProps) {
  const {
    currentMoment,
    isShowingTutorial,
    showResumePrompt,
    lastMoment,
    onMomentComplete,
    onDismiss,
    onResume,
  } = useTutorial({ enabled, gameState });

  // Get highlight ref for current moment
  const getHighlightRef = () => {
    if (!currentMoment?.highlightElement) return undefined;
    return highlightRefs[currentMoment.highlightElement];
  };

  // Show resume prompt
  if (showResumePrompt) {
    return (
      <TutorialResumePrompt onResume={onResume} onDismiss={onDismiss} lastMoment={lastMoment} />
    );
  }

  // Show tutorial overlay
  if (isShowingTutorial && currentMoment) {
    return (
      <TutorialOverlay
        momentId={currentMoment.id}
        onDismiss={onDismiss}
        onComplete={onMomentComplete}
        highlightRef={getHighlightRef()}
      />
    );
  }

  return null;
}

/**
 * Hook to create highlight refs for tutorial elements
 *
 * Returns a record of refs that can be passed to TutorialManager.
 */
export function useTutorialRefs() {
  const deckRef = useRef<HTMLElement>(null);
  const graveyardRef = useRef<HTMLElement>(null);
  const handRef = useRef<HTMLElement>(null);
  const handCreatureRef = useRef<HTMLElement>(null);
  const handSpellRef = useRef<HTMLElement>(null);
  const fieldCreatureRef = useRef<HTMLElement>(null);
  const opponentLpRef = useRef<HTMLElement>(null);
  const phaseBarRef = useRef<HTMLElement>(null);

  return {
    deck: deckRef,
    graveyard: graveyardRef,
    hand: handRef,
    hand_stereotype: handCreatureRef,
    hand_spell: handSpellRef,
    field_stereotype: fieldCreatureRef,
    opponent_lp: opponentLpRef,
    phase_indicator: phaseBarRef,
  };
}
