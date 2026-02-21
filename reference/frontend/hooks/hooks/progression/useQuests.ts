"use client";

import { handleHookError } from "@/lib/errorHandling";
import type { Quest, QuestRewardResult } from "@/types";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

interface UseQuestsReturn {
  quests: Quest[];
  activeQuests: Quest[];
  completedQuests: Quest[];
  claimedQuests: Quest[];
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  achievementQuests: Quest[];
  activeCount: number;
  completedCount: number;
  totalCount: number;
  isLoading: boolean;
  claimQuestReward: (questRecordId: Id<"userQuests">) => Promise<QuestRewardResult>;
}

/**
 * Quest system for daily, weekly, and achievement-based challenges.
 *
 * Provides quest management with automatic progress tracking. Players can
 * claim rewards once quests are completed. Quests reset daily/weekly and
 * provide gold, XP, and gem rewards.
 *
 * Features:
 * - View all quests with progress tracking
 * - Filter by type (daily, weekly, achievement)
 * - Filter by status (active, completed, claimed)
 * - Claim quest rewards
 * - Real-time progress updates
 * - Automatic quest generation (daily/weekly)
 *
 * @example
 * ```typescript
 * const {
 *   quests,
 *   activeQuests,
 *   completedQuests,
 *   dailyQuests,
 *   claimQuestReward
 * } = useQuests();
 *
 * // Show active quests
 * activeQuests.forEach(quest => {
 *   console.log(`${quest.name}: ${quest.progress}/${quest.goal}`);
 * });
 *
 * // Claim reward
 * await claimQuestReward(questRecordId);
 * // Toast shows: "Claimed rewards: 100 Gold, 50 XP"
 *
 * // Check daily quests
 * console.log(`${dailyQuests.length} daily quests available`);
 * ```
 *
 * @returns {UseQuestsReturn} Quest management interface
 *
 * @throws {Error} When user is not authenticated
 */
export function useQuests(): UseQuestsReturn {
  const { isAuthenticated } = useAuth();
  const hasEnsuredQuests = useRef(false);

  // Query for user's quests
  const quests = useQuery(api.progression.quests.getUserQuests, isAuthenticated ? {} : "skip");

  // Mutation to ensure user has quests
  const ensureQuestsMutation = useMutation(api.progression.quests.ensureUserHasQuests);

  // Mutation to claim quest rewards
  const claimRewardMutation = useMutation(api.progression.quests.claimQuestReward);

  // Auto-generate quests if user has none
  useEffect(() => {
    const ensureQuests = async () => {
      // Only run once per session, when authenticated and quests query has resolved
      if (!isAuthenticated || quests === undefined || hasEnsuredQuests.current) {
        return;
      }

      // If user has no quests, generate them
      if (quests.length === 0) {
        hasEnsuredQuests.current = true;
        try {
          const result = await ensureQuestsMutation({});
          if (result.dailyGenerated > 0 || result.weeklyGenerated > 0) {
            toast.success(
              `Generated ${result.dailyGenerated} daily and ${result.weeklyGenerated} weekly quests!`
            );
          }
        } catch (error) {
          console.error("Failed to ensure quests:", error);
        }
      } else {
        // User already has quests, mark as done
        hasEnsuredQuests.current = true;
      }
    };

    ensureQuests();
  }, [isAuthenticated, quests, ensureQuestsMutation]);

  // Action to claim quest reward
  const claimQuestReward = async (questRecordId: Id<"userQuests">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");

    try {
      const result = await claimRewardMutation({ questRecordId });
      const gemsText = result.rewards.gems ? `, ${result.rewards.gems} Gems` : "";
      toast.success(
        `Claimed rewards: ${result.rewards.gold} Gold, ${result.rewards.xp} XP${gemsText}`
      );
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to claim quest reward");
      toast.error(message);
      throw error;
    }
  };

  // Separate quests by type
  const activeQuests = quests?.filter((q: Quest) => q.status === "active") || [];
  const completedQuests = quests?.filter((q: Quest) => q.status === "completed") || [];
  const claimedQuests = quests?.filter((q: Quest) => q.status === "claimed") || [];
  const dailyQuests = quests?.filter((q: Quest) => q.questType === "daily") || [];
  const weeklyQuests = quests?.filter((q: Quest) => q.questType === "weekly") || [];
  const achievementQuests = quests?.filter((q: Quest) => q.questType === "achievement") || [];

  return {
    // Data
    quests: quests || [],
    activeQuests,
    completedQuests,
    claimedQuests,
    dailyQuests,
    weeklyQuests,
    achievementQuests,

    // Counts
    activeCount: activeQuests.length,
    completedCount: completedQuests.length,
    totalCount: quests?.length || 0,

    // Loading state
    isLoading: quests === undefined,

    // Actions
    claimQuestReward,
  };
}
