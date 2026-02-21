"use client";

import { handleHookError } from "@/lib/errorHandling";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";
import { toast } from "sonner";

interface UseMatchmakingReturn {
  isInQueue: boolean;
  queueStatus: ReturnType<typeof useQuery<typeof api.social.matchmaking.getMyStatus>> | undefined;
  elapsedSeconds: number;
  currentRatingWindow: number | undefined;
  joinQueue: (mode: "ranked" | "casual") => Promise<{ success: boolean; error?: string }>;
  leaveQueue: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * Automated matchmaking queue for ranked and casual games.
 *
 * Provides queue functionality with automatic opponent matching based on rating
 * (for ranked) or random pairing (for casual). Shows real-time queue status
 * including elapsed time and current rating window. All operations show toasts.
 *
 * Features:
 * - Join ranked or casual queue
 * - Leave queue
 * - Real-time queue status updates
 * - Elapsed time tracking
 * - Rating window display (ranked only)
 * - Automatic match creation when opponent found
 *
 * @example
 * ```typescript
 * const {
 *   isInQueue,
 *   queueStatus,
 *   elapsedSeconds,
 *   currentRatingWindow,
 *   joinQueue,
 *   leaveQueue
 * } = useMatchmaking();
 *
 * // Join ranked queue
 * await joinQueue("ranked");
 *
 * // Display queue status
 * if (isInQueue) {
 *   console.log(`Searching for ${elapsedSeconds}s...`);
 *   console.log(`Rating window: ±${currentRatingWindow}`);
 * }
 *
 * // Leave queue
 * await leaveQueue();
 * ```
 *
 * @returns {UseMatchmakingReturn} Matchmaking interface
 */
export function useMatchmaking(): UseMatchmakingReturn {
  // Get current matchmaking status
  const status = useQuery(api.social.matchmaking.getMyStatus);

  // Mutations
  const joinQueueMutation = useMutation(api.social.matchmaking.joinQueue);
  const leaveQueueMutation = useMutation(api.social.matchmaking.leaveQueue);

  const joinQueue = useCallback(
    async (mode: "ranked" | "casual") => {
      try {
        await joinQueueMutation({ mode });
        toast.success(`Joined ${mode} queue`);
        return { success: true };
      } catch (error) {
        const message = handleHookError(error, "Failed to join queue");
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [joinQueueMutation]
  );

  const leaveQueue = useCallback(async () => {
    try {
      await leaveQueueMutation({});
      toast.info("Left matchmaking queue");
      return { success: true };
    } catch (error) {
      const message = handleHookError(error, "Failed to leave queue");
      toast.error(message);
      return { success: false, error: message };
    }
  }, [leaveQueueMutation]);

  return {
    isInQueue: status?.status === "searching",
    queueStatus: status,
    elapsedSeconds: status?.elapsedSeconds ?? 0,
    currentRatingWindow: status?.currentRatingWindow,
    joinQueue,
    leaveQueue,
  };
}
