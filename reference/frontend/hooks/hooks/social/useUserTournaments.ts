"use client";

import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { handleHookError } from "@/lib/errorHandling";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

// ============================================================================
// TYPES
// ============================================================================

import type { Visibility } from "@/types/common";
export type { Visibility as TournamentVisibility } from "@/types/common";
type TournamentVisibility = Visibility;
export type TournamentMode = "ranked" | "casual";
export type TournamentSize = 4 | 8 | 16 | 32;

export interface PrizeBreakdown {
  totalPool: number;
  first: number;
  second: number;
  thirdFourth: number;
  treasuryFee: number;
}

export interface UserTournamentSummary {
  _id: Id<"tournaments">;
  name: string;
  description?: string;
  maxPlayers: TournamentSize;
  registeredCount: number;
  entryFee: number;
  mode: TournamentMode;
  status: string;
  creatorUsername: string;
  slotsRemaining: number;
  prizeBreakdown: PrizeBreakdown;
  visibility?: TournamentVisibility;
  joinCode?: string;
  expiresAt?: number;
}

export interface HostedTournament extends UserTournamentSummary {
  participants: Array<{
    username: string;
    registeredAt: number;
  }>;
}

export interface RegisteredTournament {
  _id: Id<"tournaments">;
  name: string;
  maxPlayers: TournamentSize;
  registeredCount: number;
  entryFee: number;
  mode: TournamentMode;
  status: string;
  creatorUsername: string;
  isHost: boolean;
  joinCode?: string;
  registeredAt: number;
  participantStatus: string;
}

export interface TournamentPreview {
  _id: Id<"tournaments">;
  name: string;
  description?: string;
  maxPlayers: TournamentSize;
  registeredCount: number;
  entryFee: number;
  mode: TournamentMode;
  status: string;
  creatorUsername: string;
  slotsRemaining: number;
  prizeBreakdown: PrizeBreakdown;
  expiresAt?: number;
}

// ============================================================================
// HOOK: usePublicUserTournaments
// ============================================================================

interface UsePublicUserTournamentsReturn {
  tournaments: UserTournamentSummary[];
  isLoading: boolean;
}

/**
 * List public user-created tournaments available for joining
 *
 * @example
 * ```typescript
 * const { tournaments, isLoading } = usePublicUserTournaments();
 *
 * tournaments.forEach(t => {
 *   console.log(`${t.name} by ${t.creatorUsername} - ${t.slotsRemaining} slots left`);
 * });
 * ```
 */
export function usePublicUserTournaments(limit = 20): UsePublicUserTournamentsReturn {
  const tournaments = useConvexQuery(typedApi.social.userTournaments.getPublicUserTournaments, {
    limit,
  });

  return {
    tournaments: tournaments || [],
    isLoading: tournaments === undefined,
  };
}

// ============================================================================
// HOOK: useMyHostedTournament
// ============================================================================

interface UseMyHostedTournamentReturn {
  tournament: HostedTournament | null;
  isLoading: boolean;
  hasActiveTournament: boolean;
}

/**
 * Get the current user's hosted tournament (if any)
 *
 * Users can only host one active tournament at a time.
 *
 * @example
 * ```typescript
 * const { tournament, hasActiveTournament, isLoading } = useMyHostedTournament();
 *
 * if (hasActiveTournament && tournament?.joinCode) {
 *   console.log(`Share code: ${tournament.joinCode}`);
 * }
 * ```
 */
export function useMyHostedTournament(): UseMyHostedTournamentReturn {
  const { isAuthenticated } = useAuth();

  const tournament = useConvexQuery(
    typedApi.social.userTournaments.getMyHostedTournament,
    isAuthenticated ? {} : "skip"
  );

  return {
    tournament: tournament || null,
    isLoading: tournament === undefined,
    hasActiveTournament: tournament !== null && tournament !== undefined,
  };
}

// ============================================================================
// HOOK: useMyRegisteredTournaments
// ============================================================================

interface UseMyRegisteredTournamentsReturn {
  tournaments: RegisteredTournament[];
  isLoading: boolean;
}

/**
 * Get tournaments the user is registered for
 *
 * @example
 * ```typescript
 * const { tournaments, isLoading } = useMyRegisteredTournaments();
 *
 * const hosted = tournaments.filter(t => t.isHost);
 * const joined = tournaments.filter(t => !t.isHost);
 * ```
 */
export function useMyRegisteredTournaments(): UseMyRegisteredTournamentsReturn {
  const { isAuthenticated } = useAuth();

  const tournaments = useConvexQuery(
    typedApi.social.userTournaments.getMyRegisteredTournaments,
    isAuthenticated ? {} : "skip"
  );

  return {
    tournaments: tournaments || [],
    isLoading: tournaments === undefined,
  };
}

// ============================================================================
// HOOK: useTournamentByCode
// ============================================================================

interface UseTournamentByCodeReturn {
  tournament: TournamentPreview | null;
  isLoading: boolean;
  isValid: boolean;
}

/**
 * Look up a tournament by join code (for preview before joining)
 *
 * @example
 * ```typescript
 * const { tournament, isValid, isLoading } = useTournamentByCode("ABC123");
 *
 * if (isValid && tournament) {
 *   console.log(`Found: ${tournament.name} (${tournament.entryFee}g entry)`);
 * }
 * ```
 */
export function useTournamentByCode(joinCode: string): UseTournamentByCodeReturn {
  const shouldQuery = joinCode.length >= 6;

  const tournament = useConvexQuery(
    typedApi.social.userTournaments.getTournamentByCode,
    shouldQuery ? { joinCode } : "skip"
  );

  return {
    tournament: tournament || null,
    isLoading: shouldQuery && tournament === undefined,
    isValid: tournament !== null && tournament !== undefined,
  };
}

// ============================================================================
// HOOK: useCreateUserTournament
// ============================================================================

interface CreateTournamentArgs {
  name: string;
  description?: string;
  maxPlayers: TournamentSize;
  buyIn: number;
  mode: TournamentMode;
  visibility: TournamentVisibility;
}

interface UseCreateUserTournamentReturn {
  createTournament: (args: CreateTournamentArgs) => Promise<{
    tournamentId: Id<"tournaments">;
    joinCode?: string;
    message: string;
  }>;
  isCreating: boolean;
}

/**
 * Create a new user-hosted tournament
 *
 * @example
 * ```typescript
 * const { createTournament, isCreating } = useCreateUserTournament();
 *
 * const result = await createTournament({
 *   name: "Friday Night Showdown",
 *   maxPlayers: 8,
 *   buyIn: 1000,
 *   mode: "ranked",
 *   visibility: "private",
 * });
 *
 * if (result.joinCode) {
 *   console.log(`Share this code: ${result.joinCode}`);
 * }
 * ```
 */
export function useCreateUserTournament(): UseCreateUserTournamentReturn {
  const [isCreating, setIsCreating] = useState(false);
  const createMutation = useConvexMutation(typedApi.social.userTournaments.createUserTournament);

  const createTournament = async (args: CreateTournamentArgs) => {
    setIsCreating(true);
    try {
      const result = await createMutation(args);
      toast.success(result.message);
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to create tournament");
      toast.error(message);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return { createTournament, isCreating };
}

// ============================================================================
// HOOK: useJoinUserTournament
// ============================================================================

interface UseJoinUserTournamentReturn {
  joinByCode: (code: string) => Promise<{ success: boolean; message: string; isFull: boolean }>;
  joinById: (
    tournamentId: Id<"tournaments">
  ) => Promise<{ success: boolean; message: string; isFull: boolean }>;
  isJoining: boolean;
}

/**
 * Join a user-created tournament by code or ID
 *
 * @example
 * ```typescript
 * const { joinByCode, joinById, isJoining } = useJoinUserTournament();
 *
 * // Join by invite code
 * await joinByCode("ABC123");
 *
 * // Join public tournament by ID
 * await joinById(tournamentId);
 * ```
 */
export function useJoinUserTournament(): UseJoinUserTournamentReturn {
  const [isJoining, setIsJoining] = useState(false);
  const joinMutation = useConvexMutation(typedApi.social.userTournaments.joinUserTournament);

  const joinByCode = async (code: string) => {
    setIsJoining(true);
    try {
      const result = await joinMutation({ joinCode: code });
      toast.success(result.message);
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to join tournament");
      toast.error(message);
      throw error;
    } finally {
      setIsJoining(false);
    }
  };

  const joinById = async (tournamentId: Id<"tournaments">) => {
    setIsJoining(true);
    try {
      const result = await joinMutation({ tournamentId });
      toast.success(result.message);
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to join tournament");
      toast.error(message);
      throw error;
    } finally {
      setIsJoining(false);
    }
  };

  return { joinByCode, joinById, isJoining };
}

// ============================================================================
// HOOK: useLeaveUserTournament
// ============================================================================

interface UseLeaveUserTournamentReturn {
  leave: (tournamentId: Id<"tournaments">) => Promise<{ success: boolean; message: string }>;
  isLeaving: boolean;
}

/**
 * Leave a user tournament before it starts
 *
 * Note: Tournament hosts cannot leave - they must cancel instead.
 *
 * @example
 * ```typescript
 * const { leave, isLeaving } = useLeaveUserTournament();
 *
 * if (!isHost) {
 *   await leave(tournamentId);
 * }
 * ```
 */
export function useLeaveUserTournament(): UseLeaveUserTournamentReturn {
  const [isLeaving, setIsLeaving] = useState(false);
  const leaveMutation = useConvexMutation(typedApi.social.userTournaments.leaveUserTournament);

  const leave = async (tournamentId: Id<"tournaments">) => {
    setIsLeaving(true);
    try {
      const result = await leaveMutation({ tournamentId });
      toast.success(result.message);
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to leave tournament");
      toast.error(message);
      throw error;
    } finally {
      setIsLeaving(false);
    }
  };

  return { leave, isLeaving };
}

// ============================================================================
// HOOK: useCancelUserTournament
// ============================================================================

interface UseCancelUserTournamentReturn {
  cancel: (tournamentId: Id<"tournaments">) => Promise<{ success: boolean; message: string }>;
  isCancelling: boolean;
}

/**
 * Cancel a user tournament (host only)
 *
 * Refunds all participants and sets status to cancelled.
 *
 * @example
 * ```typescript
 * const { cancel, isCancelling } = useCancelUserTournament();
 *
 * if (isHost && confirm("Cancel this tournament?")) {
 *   await cancel(tournamentId);
 * }
 * ```
 */
export function useCancelUserTournament(): UseCancelUserTournamentReturn {
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelMutation = useConvexMutation(typedApi.social.userTournaments.cancelUserTournament);

  const cancel = async (tournamentId: Id<"tournaments">) => {
    setIsCancelling(true);
    try {
      const result = await cancelMutation({ tournamentId });
      toast.success(result.message);
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to cancel tournament");
      toast.error(message);
      throw error;
    } finally {
      setIsCancelling(false);
    }
  };

  return { cancel, isCancelling };
}
