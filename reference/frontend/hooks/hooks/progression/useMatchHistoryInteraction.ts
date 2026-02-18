"use client";

import type { MatchHistoryEntry, MatchHistoryMode, MatchHistoryStats } from "@/types/progression";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { useAuth } from "../auth/useConvexAuthHook";
import { useProfile } from "../social/useProfile";

const MATCHES_PER_PAGE = 10;

/**
 * Hook for managing Match History page interactions.
 * Consolidates data fetching, filtering, and statistics calculation.
 */
export function useMatchHistoryInteraction() {
  const { profile: currentUser, isLoading: profileLoading } = useProfile();
  const { isAuthenticated } = useAuth();

  const [filter, setFilter] = useState<MatchHistoryMode | "all">("all");
  const [displayLimit, setDisplayLimit] = useState(MATCHES_PER_PAGE);

  // Fetch real match history from Convex
  const matchHistoryQuery = useQuery(
    api.progression.matchHistory.getMatchHistory,
    isAuthenticated ? { limit: 50 } : "skip"
  );

  const isLoading = profileLoading || matchHistoryQuery === undefined;

  // Process matches and apply filters
  const { matches, allFilteredMatches, filteredMatches, hasMoreMatches } = useMemo(() => {
    const rawMatches = (matchHistoryQuery as unknown[] | undefined) ?? [];

    // Map raw backend data to unified MatchHistoryEntry if needed
    const mappedMatches: MatchHistoryEntry[] = rawMatches.map((m) => ({
      id: m.id || m._id,
      mode: m.mode,
      result: m.result,
      opponent: m.opponent,
      xpGained: m.xpGained || m.xpAwarded || 0,
      ratingChange: m.ratingChange,
      timestamp: m.timestamp || m.completedAt || Date.now(),
    }));

    const allFiltered =
      filter === "all" ? mappedMatches : mappedMatches.filter((m) => m.mode === filter);

    return {
      matches: mappedMatches,
      allFilteredMatches: allFiltered,
      filteredMatches: allFiltered.slice(0, displayLimit),
      hasMoreMatches: displayLimit < allFiltered.length,
    };
  }, [matchHistoryQuery, filter, displayLimit]);

  // Calculate statistics
  const stats = useMemo<MatchHistoryStats>(() => {
    const total = matches.length;
    const wins = matches.filter((m) => m.result === "victory" || m.result === "win").length;
    const losses = matches.filter((m) => m.result === "defeat" || m.result === "loss").length;

    return {
      total,
      wins,
      losses,
      draws: 0,
      winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    };
  }, [matches]);

  const loadMore = () => {
    setDisplayLimit((prev) => prev + MATCHES_PER_PAGE);
  };

  return {
    currentUser,
    isLoading,
    filter,
    setFilter,
    filteredMatches,
    allFilteredCount: allFilteredMatches.length,
    displayLimit,
    hasMoreMatches,
    stats,
    loadMore,
  };
}
