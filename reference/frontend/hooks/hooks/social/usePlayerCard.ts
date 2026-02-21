"use client";

import { typedApi } from "@/lib/convexHelpers";
import { handleHookError } from "@/lib/errorHandling";
import { type WagerCurrency, formatWagerAmount } from "@/lib/wagerTiers";
import type { MatchMode } from "@/types/common";
import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

// Module-scope references to avoid TS2589
const getPlayerCardDataQuery = typedApi.social.friends.getPlayerCardData;
const sendFriendRequestMutation = typedApi.social.friends.sendFriendRequest;
const acceptFriendRequestMutation = typedApi.social.friends.acceptFriendRequest;
const cancelFriendRequestMutation = typedApi.social.friends.cancelFriendRequest;
const removeFriendMutation = typedApi.social.friends.removeFriend;
const sendChallengeMutation = typedApi.social.challenges.sendChallenge;

/**
 * Hook for player card modal functionality.
 *
 * Fetches player profile data and provides actions for social interactions
 * (friend requests, challenges) when viewing another player's card.
 *
 * @param userId - The user ID to fetch data for, or null to skip fetching
 * @returns Player data, loading state, and social action functions
 *
 * @example
 * ```typescript
 * const { playerData, isLoading, sendFriendRequest, sendChallenge } = usePlayerCard(selectedUserId);
 *
 * // Send friend request
 * await sendFriendRequest(playerData.username);
 *
 * // Send challenge
 * await sendChallenge(playerData.username, "ranked");
 * ```
 */
export function usePlayerCard(userId: Id<"users"> | null) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Query player data when userId is provided
  const playerData = useQuery(getPlayerCardDataQuery, userId ? { targetUserId: userId } : "skip");

  // Friend mutations
  const sendRequestMut = useMutation(sendFriendRequestMutation);
  const acceptRequestMut = useMutation(acceptFriendRequestMutation);
  const cancelRequestMut = useMutation(cancelFriendRequestMutation);
  const removeFriendMut = useMutation(removeFriendMutation);

  // Challenge mutation
  const sendChallengeMut = useMutation(sendChallengeMutation);

  const sendFriendRequest = async (friendUsername: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const result = await sendRequestMut({ friendUsername });
      if (result.autoAccepted) {
        toast.success(`You are now friends with ${friendUsername}!`);
      } else {
        toast.success(`Friend request sent to ${friendUsername}`);
      }
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to send friend request");
      toast.error(message);
      throw error;
    }
  };

  const acceptFriendRequest = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await acceptRequestMut({ friendId });
      toast.success("Friend request accepted!");
    } catch (error) {
      const message = handleHookError(error, "Failed to accept friend request");
      toast.error(message);
      throw error;
    }
  };

  const cancelFriendRequest = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await cancelRequestMut({ friendId });
      toast.info("Friend request cancelled");
    } catch (error) {
      const message = handleHookError(error, "Failed to cancel friend request");
      toast.error(message);
      throw error;
    }
  };

  const removeFriend = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await removeFriendMut({ friendId });
      toast.info("Friend removed");
    } catch (error) {
      const message = handleHookError(error, "Failed to remove friend");
      toast.error(message);
      throw error;
    }
  };

  const sendChallenge = async (
    opponentUsername: string,
    mode: MatchMode,
    wagerAmount?: number,
    cryptoWagerCurrency?: WagerCurrency,
    cryptoWagerTier?: number
  ) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const lobbyId = await sendChallengeMut({
        opponentUsername,
        mode,
        wagerAmount,
        cryptoWagerCurrency,
        cryptoWagerTier,
      });

      // Format toast message based on wager type
      let wagerText = "";
      if (cryptoWagerCurrency && cryptoWagerTier !== undefined) {
        const formatted = formatWagerAmount(cryptoWagerTier, cryptoWagerCurrency);
        wagerText = ` with ${formatted} wager`;
      } else if (wagerAmount) {
        wagerText = ` with ${wagerAmount.toLocaleString()} gold wager`;
      }

      toast.success(`Challenge sent${wagerText}!`, {
        description: `Redirecting to ${mode} game lobby...`,
      });
      navigate({ to: `/game/${lobbyId}` });
      return lobbyId;
    } catch (error) {
      const message = handleHookError(error, "Failed to send challenge");
      toast.error(message);
      throw error;
    }
  };

  return {
    playerData,
    isLoading: userId !== null && playerData === undefined,
    isAuthenticated,
    sendFriendRequest,
    acceptFriendRequest,
    cancelFriendRequest,
    removeFriend,
    sendChallenge,
  };
}
