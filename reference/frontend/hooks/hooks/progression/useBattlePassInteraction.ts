"use client";

import type { BattlePassReward } from "@/types/progression";
import { useState } from "react";
import { useBattlePass } from "./useBattlePass";

interface ClaimModalState {
  isOpen: boolean;
  tier: number;
  track: "free" | "premium";
  reward: BattlePassReward | null;
}

/**
 * Hook for managing Battle Pass page interactions.
 * Consolidates modal states and complex handlers.
 */
export function useBattlePassInteraction() {
  const battlePass = useBattlePass();

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isClaimingAll, setIsClaimingAll] = useState(false);
  const [claimModalState, setClaimModalState] = useState<ClaimModalState>({
    isOpen: false,
    tier: 0,
    track: "free",
    reward: null,
  });

  // Handle reward claim from tier track
  const handleClaimFromTrack = (tier: number, track: "free" | "premium") => {
    const tierData = battlePass.tiers.find((t) => t.tier === tier);
    if (!tierData) return;

    const reward = track === "free" ? tierData.freeReward : tierData.premiumReward;
    if (!reward) return;

    setClaimModalState({
      isOpen: true,
      tier,
      track,
      reward,
    });
  };

  // Handle single reward claim
  const handleClaimReward = async () => {
    try {
      await battlePass.claimReward(claimModalState.tier, claimModalState.track);
      setClaimModalState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("Failed to claim reward:", error);
    }
  };

  // Handle claim all
  const handleClaimAll = async () => {
    if (battlePass.totalClaimableCount === 0) return;
    setIsClaimingAll(true);
    try {
      await battlePass.claimAllRewards();
    } finally {
      setIsClaimingAll(false);
    }
  };

  // Calculate unlocked premium rewards for modal
  const unlockedPremiumRewards = battlePass.tiers.filter(
    (t) => t.isUnlocked && t.premiumReward && !t.premiumRewardClaimed
  ).length;

  return {
    ...battlePass,
    showPremiumModal,
    setShowPremiumModal,
    claimModalState,
    setClaimModalState,
    isClaimingAll,
    handleClaimFromTrack,
    handleClaimReward,
    handleClaimAll,
    unlockedPremiumRewards,
  };
}
