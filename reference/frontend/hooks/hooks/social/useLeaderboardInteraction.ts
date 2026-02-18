"use client";

import type { BattleHistoryEntry, LeaderboardEntry } from "@/types";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useLeaderboard } from "./useLeaderboard";
import { useProfile } from "./useProfile";

export type LeaderboardType = "ranked" | "casual" | "story";
export type PlayerSegment = "all" | "humans" | "ai";

export interface SelectedPlayer {
  userId: Id<"users">;
  username: string;
  rating: number;
  rank: number;
  wins: number;
  losses: number;
  winRate: number;
  level: number;
  isAiAgent?: boolean;
}

interface UseLeaderboardInteractionReturn {
  currentUser: ReturnType<typeof useProfile>["profile"];
  profileLoading: boolean;
  activeType: LeaderboardType;
  setActiveType: (type: LeaderboardType) => void;
  activeSegment: PlayerSegment;
  setActiveSegment: (segment: PlayerSegment) => void;
  selectedPlayer: SelectedPlayer | null;
  rankings: LeaderboardEntry[];
  userRank: LeaderboardEntry | null | undefined;
  battleHistory: BattleHistoryEntry[];
  lastUpdated: number | undefined;
  userInTop100: boolean;
  handlePlayerClick: (player: LeaderboardEntry) => void;
  handleOpponentClick: (match: BattleHistoryEntry) => void;
  closePlayerModal: () => void;
}

export function useLeaderboardInteraction(): UseLeaderboardInteractionReturn {
  const { profile: currentUser, isLoading: profileLoading } = useProfile();

  const [activeType, setActiveType] = useState<LeaderboardType>("ranked");
  const [activeSegment, setActiveSegment] = useState<PlayerSegment>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);

  // Use leaderboard hook with filters
  const leaderboardData = useLeaderboard(activeType, activeSegment);
  const {
    rankings = [],
    myRank: userRank,
    battleHistory = [],
    lastUpdated,
  } = leaderboardData || {};

  const handlePlayerClick = (player: LeaderboardEntry) => {
    if (player.userId === currentUser?._id) return; // Don't open modal for self
    setSelectedPlayer({
      userId: player.userId,
      username: player.username || "Unknown",
      rating: player.rating,
      rank: player.rank,
      wins: player.wins,
      losses: player.losses,
      winRate: player.winRate,
      level: player.level || 1,
      isAiAgent: player.isAiAgent,
    });
  };

  const handleOpponentClick = (match: BattleHistoryEntry) => {
    if (match.opponentId === currentUser?._id) return; // Don't open modal for self
    setSelectedPlayer({
      userId: match.opponentId,
      username: match.opponentUsername,
      rating: match.ratingAfter || 0, // Use their rating from the match
      rank: 0, // Unknown from battle history
      wins: 0, // Unknown from battle history
      losses: 0,
      winRate: 0,
      level: 1, // Unknown from battle history - will be fetched by modal
    });
  };

  const closePlayerModal = () => setSelectedPlayer(null);

  // Check if current user is in top 100
  const userInTop100 = rankings.some((p: LeaderboardEntry) => p.userId === currentUser?._id);

  return {
    currentUser,
    profileLoading,

    // State
    activeType,
    setActiveType,
    activeSegment,
    setActiveSegment,
    selectedPlayer,

    // Data
    rankings: rankings as LeaderboardEntry[],
    userRank: userRank as LeaderboardEntry | undefined | null,
    battleHistory: battleHistory as BattleHistoryEntry[],
    lastUpdated,
    userInTop100,

    // Actions
    handlePlayerClick,
    handleOpponentClick,
    closePlayerModal,
  };
}
