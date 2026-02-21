"use client";

import type { GameMode } from "@/types";
import type { BattleHistoryEntry, LeaderboardEntry } from "@/types";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useAuth } from "../auth/useConvexAuthHook";

interface UseLeaderboardReturn {
  rankings: LeaderboardEntry[];
  myRank: ReturnType<typeof useQuery<typeof api.social.leaderboards.getUserRank>> | undefined;
  battleHistory: BattleHistoryEntry[];
  lastUpdated: number | undefined;
  isLoading: boolean;
}

/**
 * Global leaderboards and rankings system with caching.
 *
 * Provides leaderboard data with filtering by game type and player segment.
 * Leaderboards are cached and updated every 5 minutes for performance.
 * Includes personal rank tracking and battle history.
 *
 * Features:
 * - View global rankings (top players)
 * - Get current user's rank
 * - View battle history
 * - Filter by type (ranked/casual/story)
 * - Filter by segment (all/humans/ai)
 * - Cached data (updated every 5 min)
 * - Last update timestamp
 *
 * @example
 * ```typescript
 * // Ranked leaderboard (humans only)
 * const {
 *   rankings,
 *   myRank,
 *   battleHistory,
 *   lastUpdated
 * } = useLeaderboard("ranked", "humans");
 *
 * // Display top 10
 * rankings.slice(0, 10).forEach((player, i) => {
 *   console.log(`${i + 1}. ${player.username} - ${player.rating}`);
 * });
 *
 * // Show own rank
 * console.log(`Your rank: #${myRank?.position}`);
 *
 * // Battle history
 * battleHistory.forEach(battle => {
 *   console.log(`vs ${battle.opponent}: ${battle.result}`);
 * });
 * ```
 *
 * @param type - Game type filter (ranked/casual/story), defaults to "ranked"
 * @param segment - Player segment filter (all/humans/ai), defaults to "all"
 *
 * @returns {UseLeaderboardReturn} Leaderboard interface
 */
export function useLeaderboard(
  type: GameMode = "ranked",
  segment: "all" | "humans" | "ai" = "all"
): UseLeaderboardReturn {
  const { isAuthenticated } = useAuth();

  // Cached leaderboard (updated every 5 min)
  const leaderboard = useQuery(api.social.leaderboards.getCachedLeaderboard, {
    type,
    segment,
  });

  // User's rank
  const myRank = useQuery(api.social.leaderboards.getUserRank, isAuthenticated ? { type } : "skip");

  // Battle history
  const battleHistory = useQuery(
    api.social.leaderboards.getBattleHistory,
    isAuthenticated ? { limit: 20, gameType: type } : "skip"
  );

  return {
    rankings: leaderboard?.rankings || [],
    myRank,
    battleHistory: battleHistory || [],
    lastUpdated: leaderboard?.lastUpdated,
    isLoading: leaderboard === undefined,
  };
}
