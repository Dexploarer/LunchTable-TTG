"use client";

import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "../auth/useConvexAuthHook";

// ============================================================================
// TYPES
// ============================================================================

import type { TournamentStatus } from "@/types/common";
export type { TournamentStatus } from "@/types/common";
export type TournamentMode = "ranked" | "casual";
export type ParticipantStatus =
  | "registered"
  | "checked_in"
  | "active"
  | "eliminated"
  | "winner"
  | "forfeit"
  | "refunded";
export type MatchStatus = "pending" | "ready" | "active" | "completed" | "forfeit";

export interface TournamentPrizePool {
  first: number;
  second: number;
  thirdFourth: number;
}

export interface TournamentSummary {
  _id: Id<"tournaments">;
  name: string;
  description?: string;
  format: "single_elimination";
  maxPlayers: 8 | 16 | 32;
  entryFee: number;
  mode: TournamentMode;
  prizePool: TournamentPrizePool;
  status: TournamentStatus;
  registrationStartsAt: number;
  registrationEndsAt: number;
  scheduledStartAt: number;
  registeredCount: number;
  checkedInCount: number;
  currentRound: number;
  totalRounds?: number;
  winnerId?: Id<"users">;
  winnerUsername?: string;
}

export interface TournamentDetails extends TournamentSummary {
  checkInStartsAt: number;
  checkInEndsAt: number;
  actualStartedAt?: number;
  completedAt?: number;
  secondPlaceId?: Id<"users">;
  secondPlaceUsername?: string;
  createdAt: number;
  // User-specific fields
  isRegistered: boolean;
  isCheckedIn: boolean;
  userParticipantId?: Id<"tournamentParticipants">;
  userStatus?: ParticipantStatus;
}

export interface TournamentParticipant {
  _id: Id<"tournamentParticipants">;
  tournamentId: Id<"tournaments">;
  userId: Id<"users">;
  username: string;
  registeredAt: number;
  seedRating: number;
  status: ParticipantStatus;
  checkedInAt?: number;
  currentRound?: number;
  bracket?: number;
  eliminatedInRound?: number;
  finalPlacement?: number;
  prizeAwarded?: number;
}

export interface TournamentMatch {
  _id: Id<"tournamentMatches">;
  tournamentId: Id<"tournaments">;
  round: number;
  matchNumber: number;
  bracketPosition: number;
  player1Id?: Id<"users">;
  player1Username?: string;
  player2Id?: Id<"users">;
  player2Username?: string;
  status: MatchStatus;
  lobbyId?: Id<"gameLobbies">;
  gameId?: string;
  winnerId?: Id<"users">;
  winnerUsername?: string;
  loserId?: Id<"users">;
  loserUsername?: string;
  winReason?: "game_win" | "opponent_forfeit" | "opponent_no_show" | "bye";
  scheduledAt?: number;
  startedAt?: number;
  completedAt?: number;
}

export interface TournamentRound {
  roundNumber: number;
  roundName: string;
  matches: TournamentMatch[];
}

export interface TournamentBracket {
  tournament: TournamentSummary;
  rounds: TournamentRound[];
  participants: TournamentParticipant[];
}

export interface TournamentHistoryEntry {
  _id: Id<"tournamentHistory">;
  tournamentId: Id<"tournaments">;
  tournamentName: string;
  maxPlayers: number;
  placement: number;
  prizeWon: number;
  matchesPlayed: number;
  matchesWon: number;
  completedAt: number;
}

export interface UserTournamentStats {
  tournamentsPlayed: number;
  tournamentsWon: number;
  totalPrizeWon: number;
  totalMatchesPlayed: number;
  totalMatchesWon: number;
  bestPlacement?: number;
  winRate: number;
}

// ============================================================================
// HOOK: useTournaments
// ============================================================================

interface UseTournamentsReturn {
  tournaments: TournamentSummary[];
  isLoading: boolean;
}

/**
 * List all active/upcoming tournaments
 *
 * Returns tournaments in registration, check-in, or active status.
 *
 * @example
 * ```typescript
 * const { tournaments, isLoading } = useTournaments();
 *
 * tournaments.forEach(t => {
 *   console.log(`${t.name} - ${t.registeredCount}/${t.maxPlayers} players`);
 * });
 * ```
 */
export function useTournaments(): UseTournamentsReturn {
  const tournaments = useConvexQuery(typedApi.social.tournaments.getActiveTournaments, {});

  return {
    tournaments: tournaments || [],
    isLoading: tournaments === undefined,
  };
}

// ============================================================================
// HOOK: useTournament
// ============================================================================

interface UseTournamentReturn {
  tournament: TournamentDetails | null;
  bracket: TournamentBracket | null;
  isLoading: boolean;
  register: () => Promise<{
    success: boolean;
    participantId: Id<"tournamentParticipants">;
    message: string;
  }>;
  checkIn: () => Promise<{ success: boolean; message: string }>;
  isRegistering: boolean;
  isCheckingIn: boolean;
}

/**
 * Get tournament details and bracket for a single tournament
 *
 * Includes user registration status and mutation actions.
 *
 * @example
 * ```typescript
 * const { tournament, bracket, register, checkIn, isLoading } = useTournament(tournamentId);
 *
 * if (tournament?.status === "registration" && !tournament.isRegistered) {
 *   await register();
 * }
 *
 * if (tournament?.status === "checkin" && tournament.isRegistered && !tournament.isCheckedIn) {
 *   await checkIn();
 * }
 * ```
 */
export function useTournament(tournamentId: Id<"tournaments"> | undefined): UseTournamentReturn {
  const { isAuthenticated } = useAuth();

  // Queries
  const tournament = useConvexQuery(
    typedApi.social.tournaments.getTournamentDetails,
    tournamentId ? { tournamentId } : "skip"
  );

  const bracket = useConvexQuery(
    typedApi.social.tournaments.getTournamentBracket,
    tournamentId ? { tournamentId } : "skip"
  );

  // Mutations
  const registerMutation = useConvexMutation(typedApi.social.tournaments.registerForTournament);
  const checkInMutation = useConvexMutation(typedApi.social.tournaments.checkInToTournament);

  // Action handlers
  const register = async () => {
    if (!tournamentId || !isAuthenticated) {
      throw new Error("Must be authenticated to register");
    }
    return registerMutation({ tournamentId });
  };

  const checkIn = async () => {
    if (!tournamentId || !isAuthenticated) {
      throw new Error("Must be authenticated to check in");
    }
    return checkInMutation({ tournamentId });
  };

  return {
    tournament: tournament || null,
    bracket: bracket || null,
    isLoading: tournament === undefined,
    register,
    checkIn,
    isRegistering: false, // Could track pending state if needed
    isCheckingIn: false,
  };
}

// ============================================================================
// HOOK: useTournamentHistory
// ============================================================================

interface UseTournamentHistoryReturn {
  history: TournamentHistoryEntry[];
  stats: UserTournamentStats | null;
  isLoading: boolean;
}

/**
 * Get user's tournament history and statistics
 *
 * Returns past tournament participation and aggregate stats.
 *
 * @example
 * ```typescript
 * const { history, stats, isLoading } = useTournamentHistory();
 *
 * console.log(`Played ${stats.tournamentsPlayed} tournaments`);
 * console.log(`Won ${stats.tournamentsWon} times`);
 * console.log(`Total prize: ${stats.totalPrizeWon} gold`);
 *
 * history.forEach(h => {
 *   console.log(`${h.tournamentName}: ${h.placement}${getOrdinalSuffix(h.placement)} place`);
 * });
 * ```
 */
export function useTournamentHistory(limit = 20): UseTournamentHistoryReturn {
  const { isAuthenticated } = useAuth();

  const history = useConvexQuery(
    typedApi.social.tournaments.getUserTournamentHistory,
    isAuthenticated ? { limit } : "skip"
  );

  const stats = useConvexQuery(
    typedApi.social.tournaments.getUserTournamentStats,
    isAuthenticated ? {} : "skip"
  );

  return {
    history: history || [],
    stats: stats || null,
    isLoading: history === undefined || stats === undefined,
  };
}
