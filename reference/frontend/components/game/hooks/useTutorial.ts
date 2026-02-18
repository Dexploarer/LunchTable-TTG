"use client";

import { typedApi, useConvexQuery } from "@/lib/convexHelpers";
import { type TutorialMoment, getTutorialMoment } from "@/lib/game-rules";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface GameState {
  currentPhase: string;
  isPlayerTurn: boolean;
  turnNumber: number;
  myLifePoints: number;
  opponentLifePoints: number;
  myHand: Array<{ cardType?: string }>;
  myField: Array<{ cardType?: string }>;
}

interface UseTutorialOptions {
  enabled: boolean;
  gameState: GameState | null;
}

interface UseTutorialReturn {
  currentMoment: TutorialMoment | null;
  isShowingTutorial: boolean;
  showResumePrompt: boolean;
  lastMoment: number;
  onMomentComplete: () => void;
  onDismiss: () => void;
  onResume: () => void;
}

/**
 * Hook to manage tutorial state during gameplay
 *
 * Tracks game state and triggers appropriate tutorial moments.
 */
export function useTutorial({ enabled, gameState }: UseTutorialOptions): UseTutorialReturn {
  const [activeMomentId, setActiveMomentId] = useState<number | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [triggeredMoments, setTriggeredMoments] = useState<Set<number>>(new Set());

  // Get tutorial status from database
  const tutorialStatus = useConvexQuery(typedApi.tutorial.getTutorialStatus, enabled ? {} : "skip");

  // Mutations
  const updateProgress = useMutation(typedApi.tutorial.updateTutorialProgress);
  const completeTutorial = useMutation(typedApi.tutorial.completeTutorial);
  const dismissTutorial = useMutation(typedApi.tutorial.dismissTutorial);

  // Determine if tutorial should be active
  const shouldShowTutorial = useMemo(() => {
    if (!enabled) return false;
    if (!tutorialStatus) return false;
    if (tutorialStatus.completed) return false;
    if (tutorialStatus.dismissCount >= 3) return false;
    return tutorialStatus.needsTutorial;
  }, [enabled, tutorialStatus]);

  // Initialize tutorial state from database
  useEffect(() => {
    if (!shouldShowTutorial || hasInitialized || !tutorialStatus) return;

    const lastMoment = tutorialStatus.lastMoment;

    // Show resume prompt if they have progress
    if (tutorialStatus.shouldShowResumePrompt && lastMoment > 0) {
      setShowResumePrompt(true);
    } else if (lastMoment === 0) {
      // Fresh start - will trigger moment 1 when conditions are met
      setHasInitialized(true);
    }
  }, [shouldShowTutorial, hasInitialized, tutorialStatus]);

  // Check for tutorial triggers based on game state
  useEffect(() => {
    if (!shouldShowTutorial || !hasInitialized || !gameState) return;
    if (activeMomentId !== null) return; // Already showing a moment

    const lastMoment = tutorialStatus?.lastMoment ?? 0;

    // Find next moment to show
    const checkMoment = (momentId: number): boolean => {
      if (momentId <= lastMoment) return false;
      if (triggeredMoments.has(momentId)) return false;

      const moment = getTutorialMoment(momentId);
      if (!moment) return false;

      // Check trigger conditions
      switch (moment.trigger) {
        case "turn_start":
          // Moment 1: Show on first turn, draw phase
          return (
            gameState.turnNumber === 1 &&
            gameState.isPlayerTurn &&
            (gameState.currentPhase === "draw" || gameState.currentPhase === "main")
          );

        case "creature_in_hand":
          // Moment 2: Has stereotype in hand during main phase
          return (
            gameState.currentPhase === "main" &&
            gameState.isPlayerTurn &&
            gameState.myHand.some((c) => c.cardType === "stereotype" || c.cardType === "monster")
          );

        case "creature_on_field":
          // Moment 3: Has stereotype on field during combat phase
          return (
            gameState.currentPhase === "combat" &&
            gameState.isPlayerTurn &&
            gameState.myField.some((c) => c.cardType === "stereotype" || c.cardType === "monster")
          );

        case "spell_in_hand":
          // Moment 4: Has spell in hand during main phase
          return (
            gameState.currentPhase === "main" &&
            gameState.isPlayerTurn &&
            gameState.myHand.some((c) => c.cardType === "spell")
          );

        case "opponent_lp_zero":
          // Moment 5: Victory!
          return gameState.opponentLifePoints <= 0;

        default:
          return false;
      }
    };

    // Check moments in order
    for (let i = 1; i <= 5; i++) {
      if (checkMoment(i)) {
        setActiveMomentId(i);
        setTriggeredMoments((prev) => new Set(prev).add(i));
        break;
      }
    }
  }, [
    shouldShowTutorial,
    hasInitialized,
    gameState,
    activeMomentId,
    tutorialStatus,
    triggeredMoments,
  ]);

  // Get current moment data
  const currentMoment = useMemo(() => {
    if (activeMomentId === null) return null;
    return getTutorialMoment(activeMomentId) ?? null;
  }, [activeMomentId]);

  // Handle completing a moment
  const onMomentComplete = useCallback(async () => {
    if (activeMomentId === null) return;

    // Update progress in database
    await updateProgress({ moment: activeMomentId });

    // Check if this was the final moment
    if (activeMomentId === 5) {
      await completeTutorial({});
    }

    // Clear active moment
    setActiveMomentId(null);
  }, [activeMomentId, updateProgress, completeTutorial]);

  // Handle dismissing the tutorial
  const onDismiss = useCallback(async () => {
    await dismissTutorial({});
    setActiveMomentId(null);
    setShowResumePrompt(false);
    setHasInitialized(false); // Prevent further triggers
  }, [dismissTutorial]);

  // Handle resuming the tutorial
  const onResume = useCallback(() => {
    setShowResumePrompt(false);
    setHasInitialized(true);
  }, []);

  return {
    currentMoment,
    isShowingTutorial: activeMomentId !== null,
    showResumePrompt,
    lastMoment: tutorialStatus?.lastMoment ?? 0,
    onMomentComplete,
    onDismiss,
    onResume,
  };
}
