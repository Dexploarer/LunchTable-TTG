"use client";

import { useProfile } from "@/hooks";
import { typedApi } from "@/lib/convexHelpers";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function useLunchtableLogic() {
  const { profile: currentUser, isLoading: profileLoading } = useProfile();
  const selectStarterDeck = useMutation(typedApi.core.decks.selectStarterDeck);

  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  const [isClaimingDeck, setIsClaimingDeck] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    if (currentUser && !profileLoading) {
      if (!currentUser.activeDeckId) {
        setShowWelcomeGuide(true);
      } else {
        setShowWelcomeGuide(false);
      }
    }
  }, [currentUser, profileLoading]);

  const handleWelcomeComplete = useCallback(
    async (selectedDeckCode: string) => {
      if (!selectedDeckCode) {
        toast.error("Invalid starter deck selection.");
        return;
      }

      setIsClaimingDeck(true);
      try {
        const result = await selectStarterDeck({ deckCode: selectedDeckCode });
        toast.success(`${result.deckName} claimed! You received ${result.cardsReceived} cards.`);
        setShowWelcomeGuide(false);
      } catch (error: unknown) {
        console.error("Mutation error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to claim starter deck";
        toast.error(errorMessage);
      } finally {
        setIsClaimingDeck(false);
      }
    },
    [selectStarterDeck]
  );

  return {
    currentUser,
    profileLoading,
    showWelcomeGuide,
    setShowWelcomeGuide,
    isClaimingDeck,
    showDailyRewards,
    setShowDailyRewards,
    handleWelcomeComplete,
  };
}
