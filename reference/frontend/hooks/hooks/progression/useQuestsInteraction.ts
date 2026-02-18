"use client";

import { useMemo, useState } from "react";
import { useProfile } from "../social/useProfile";
import { useAchievements } from "./useAchievements";
import { useQuests } from "./useQuests";

/**
 * Hook for managing Quests & Achievements page interactions.
 * Consolidates quest, achievement, and profile data with tab state.
 */
export function useQuestsInteraction() {
  const { profile, isLoading: profileLoading } = useProfile();
  const quests = useQuests();
  const achievements = useAchievements();

  const [activeTab, setActiveTab] = useState<"quests" | "achievements">("quests");

  // Type-cast profile with stats for easier access
  const profileWithStats = useMemo(() => {
    if (!profile) return null;
    return profile as unknown as {
      xp?: number;
      level?: number;
      totalWins?: number;
      totalLosses?: number;
      rankedElo?: number;
      casualRating?: number;
    };
  }, [profile]);

  // Derived XP progress
  const xpStats = useMemo(() => {
    if (!profileWithStats) return { xpInLevel: 0, xpToNext: 1000, progressPercent: 0 };

    const xpInLevel = (profileWithStats.xp ?? 0) % 1000;
    const xpToNext = 1000;
    const progressPercent = (xpInLevel / xpToNext) * 100;

    return { xpInLevel, xpToNext, progressPercent };
  }, [profileWithStats]);

  // Derived win rate
  const winRate = useMemo(() => {
    if (!profileWithStats) return 0;
    const wins = profileWithStats.totalWins || 0;
    const losses = profileWithStats.totalLosses || 0;
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  }, [profileWithStats]);

  const isLoading = profileLoading || quests.isLoading || achievements.isLoading;

  return {
    // Data
    currentUser: profileWithStats,
    quests,
    achievements,
    isLoading,

    // UI State
    activeTab,
    setActiveTab,

    // Computed Stats
    xpStats,
    winRate,

    // Actions
    claimQuestReward: quests.claimQuestReward,
  };
}
