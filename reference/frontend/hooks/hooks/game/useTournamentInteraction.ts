"use client";

import { useCurrency } from "@/hooks/economy/useCurrency";
import type {
  TournamentHistoryEntry,
  TournamentSummary,
  UserTournamentStats,
} from "@/hooks/social/useTournament";
import { useTournament, useTournamentHistory, useTournaments } from "@/hooks/social/useTournament";
import type { HostedTournament, UserTournamentSummary } from "@/hooks/social/useUserTournaments";
import {
  useJoinUserTournament,
  useMyHostedTournament,
  usePublicUserTournaments,
} from "@/hooks/social/useUserTournaments";
import type { TournamentTab } from "@/types/tournaments";
import type { Id } from "@convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface UseTournamentInteractionReturn {
  activeTab: TournamentTab;
  setActiveTab: (tab: TournamentTab) => void;
  registeringForTournament: Id<"tournaments"> | null;
  setRegisteringForTournament: (id: Id<"tournaments"> | null) => void;
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
  showJoinCodeModal: boolean;
  setShowJoinCodeModal: (show: boolean) => void;
  gold: number;
  tournaments: TournamentSummary[];
  activeTournaments: TournamentSummary[];
  communityTournaments: UserTournamentSummary[];
  myHostedTournament: HostedTournament | null;
  history: TournamentHistoryEntry[];
  stats: UserTournamentStats | null;
  selectedTournament: TournamentSummary | undefined;
  tournamentsLoading: boolean;
  historyLoading: boolean;
  communityLoading: boolean;
  hostedLoading: boolean;
  handleRegister: () => Promise<void>;
  handleJoinCommunityTournament: (tournamentId: Id<"tournaments">) => Promise<void>;
  canCreateTournament: boolean;
}

export function useTournamentInteraction(): UseTournamentInteractionReturn {
  const [activeTab, setActiveTab] = useState<TournamentTab>("active");
  const [registeringForTournament, setRegisteringForTournament] =
    useState<Id<"tournaments"> | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);

  // Hooks
  const { tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { history, stats, isLoading: historyLoading } = useTournamentHistory();
  const { tournaments: communityTournaments, isLoading: communityLoading } =
    usePublicUserTournaments();
  const { tournament: myHostedTournament, isLoading: hostedLoading } = useMyHostedTournament();
  const { joinById } = useJoinUserTournament();
  const { gold } = useCurrency();

  // For registration modal - get the selected tournament details
  const { tournament: selectedTournament, register } = useTournament(
    registeringForTournament ?? undefined
  );

  const activeTournaments = useMemo(
    () =>
      tournaments.filter(
        (t) => t.status === "registration" || t.status === "checkin" || t.status === "active"
      ) as TournamentSummary[],
    [tournaments]
  );

  const canCreateTournament = !myHostedTournament;

  const handleRegister = async () => {
    if (!selectedTournament) return;

    try {
      const result = await register();
      toast.success(result.message);
      setRegisteringForTournament(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
      throw error;
    }
  };

  const handleJoinCommunityTournament = async (tournamentId: Id<"tournaments">) => {
    try {
      await joinById(tournamentId);
    } catch {
      // Error handled by hook
    }
  };

  return {
    // State
    activeTab,
    setActiveTab,
    registeringForTournament,
    setRegisteringForTournament,
    showCreateModal,
    setShowCreateModal,
    showJoinCodeModal,
    setShowJoinCodeModal,

    // Data
    gold,
    tournaments,
    activeTournaments,
    communityTournaments,
    myHostedTournament,
    history,
    stats,
    selectedTournament,

    // Loading states
    tournamentsLoading,
    historyLoading,
    communityLoading,
    hostedLoading,

    // Actions
    handleRegister,
    handleJoinCommunityTournament,
    canCreateTournament,
  };
}
