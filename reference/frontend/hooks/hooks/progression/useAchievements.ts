"use client";

import type { Achievement } from "@/types";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useAuth } from "../auth/useConvexAuthHook";

interface UseAchievementsReturn {
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  lockedAchievements: Achievement[];
  commonAchievements: Achievement[];
  rareAchievements: Achievement[];
  epicAchievements: Achievement[];
  legendaryAchievements: Achievement[];
  winsAchievements: Achievement[];
  gamesPlayedAchievements: Achievement[];
  collectionAchievements: Achievement[];
  socialAchievements: Achievement[];
  storyAchievements: Achievement[];
  rankedAchievements: Achievement[];
  specialAchievements: Achievement[];
  totalAchievements: number;
  unlockedCount: number;
  lockedCount: number;
  completionPercent: number;
  isLoading: boolean;
  byCategory: (category: string) => Achievement[];
  byRarity: (rarity: string) => Achievement[];
}

/**
 * Achievement tracking and progress system.
 *
 * Provides comprehensive achievement management with filtering by category,
 * rarity, and unlock status. Achievements are automatically unlocked when
 * criteria are met. Includes completion percentage tracking.
 *
 * Features:
 * - View all achievements with progress
 * - Filter by category (wins, games, collection, social, story, ranked, special)
 * - Filter by rarity (common, rare, epic, legendary)
 * - Filter by unlock status (locked/unlocked)
 * - Track completion percentage
 * - View unlock counts by category and rarity
 *
 * @example
 * ```typescript
 * const {
 *   achievements,
 *   unlockedAchievements,
 *   completionPercent,
 *   winsAchievements,
 *   legendaryAchievements,
 *   byCategory,
 *   byRarity
 * } = useAchievements();
 *
 * // Show completion
 * console.log(`${completionPercent}% complete`);
 *
 * // Filter by category
 * const socialAchievements = byCategory("social");
 *
 * // Filter by rarity
 * const rareAchievements = byRarity("rare");
 *
 * // Show unlocked count
 * console.log(`${unlockedCount}/${totalAchievements} unlocked`);
 * ```
 *
 * @returns {UseAchievementsReturn} Achievements interface with extensive filtering
 */
export function useAchievements(): UseAchievementsReturn {
  const { isAuthenticated } = useAuth();

  // Query for user's achievements
  const achievements = useQuery(
    api.progression.achievements.getUserAchievements,
    isAuthenticated ? {} : "skip"
  );

  // Separate achievements by status
  const unlockedAchievements = achievements?.filter((a: Achievement) => a.isUnlocked) || [];
  const lockedAchievements = achievements?.filter((a: Achievement) => !a.isUnlocked) || [];

  // Filter by category
  const byCategory = (category: string): Achievement[] =>
    achievements?.filter((a: Achievement) => a.category === category) || [];

  // Filter by rarity
  const byRarity = (rarity: string): Achievement[] =>
    achievements?.filter((a: Achievement) => a.rarity === rarity) || [];

  // Calculate completion percentage
  const totalAchievements = achievements?.length || 0;
  const unlockedCount = unlockedAchievements.length;
  const completionPercent =
    totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;

  // Get achievements by rarity
  const commonAchievements = byRarity("common");
  const rareAchievements = byRarity("rare");
  const epicAchievements = byRarity("epic");
  const legendaryAchievements = byRarity("legendary");

  // Get achievements by category
  const winsAchievements = byCategory("wins");
  const gamesPlayedAchievements = byCategory("games_played");
  const collectionAchievements = byCategory("collection");
  const socialAchievements = byCategory("social");
  const storyAchievements = byCategory("story");
  const rankedAchievements = byCategory("ranked");
  const specialAchievements = byCategory("special");

  return {
    // Data
    achievements: achievements || [],
    unlockedAchievements,
    lockedAchievements,

    // By rarity
    commonAchievements,
    rareAchievements,
    epicAchievements,
    legendaryAchievements,

    // By category
    winsAchievements,
    gamesPlayedAchievements,
    collectionAchievements,
    socialAchievements,
    storyAchievements,
    rankedAchievements,
    specialAchievements,

    // Stats
    totalAchievements,
    unlockedCount,
    lockedCount: lockedAchievements.length,
    completionPercent,

    // Loading state
    isLoading: achievements === undefined,

    // Helper functions
    byCategory,
    byRarity,
  };
}
