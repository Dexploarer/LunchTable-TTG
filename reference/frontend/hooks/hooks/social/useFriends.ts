"use client";

import { handleHookError } from "@/lib/errorHandling";
import type { Friend, FriendRequest, FriendRequestResult } from "@/types";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

export interface UseFriendsReturn {
  friends: Friend[] | undefined;
  incomingRequests: FriendRequest[] | undefined;
  outgoingRequests: FriendRequest[] | undefined;
  blockedUsers: ReturnType<typeof useQuery<typeof api.social.friends.getBlockedUsers>> | undefined;
  friendCount: number;
  incomingRequestCount: number;
  outgoingRequestCount: number;
  onlineFriends: Friend[];
  onlineCount: number;
  isLoading: boolean;
  sendFriendRequest: (friendUsername: string) => Promise<FriendRequestResult>;
  acceptFriendRequest: (friendId: Id<"users">) => Promise<void>;
  declineFriendRequest: (friendId: Id<"users">) => Promise<void>;
  cancelFriendRequest: (friendId: Id<"users">) => Promise<void>;
  removeFriend: (friendId: Id<"users">) => Promise<void>;
  blockUser: (friendId: Id<"users">) => Promise<void>;
  unblockUser: (friendId: Id<"users">) => Promise<void>;
}

/**
 * Comprehensive friends management system with requests and blocking.
 *
 * Provides complete social features including friend requests, online status
 * tracking, and blocking functionality. Includes automatic friend request
 * acceptance for mutual requests. All mutations show toast notifications.
 *
 * Features:
 * - View friends with online status
 * - Send friend requests (auto-accepts if mutual)
 * - Accept/decline incoming requests
 * - Cancel outgoing requests
 * - Remove friends (unfriend)
 * - Block/unblock users
 * - Track online/offline status
 * - Separate views for incoming/outgoing requests
 *
 * @example
 * ```typescript
 * const {
 *   friends,
 *   onlineFriends,
 *   incomingRequests,
 *   sendFriendRequest,
 *   acceptFriendRequest
 * } = useFriends();
 *
 * // Send friend request
 * await sendFriendRequest("PlayerName");
 *
 * // Accept incoming request
 * await acceptFriendRequest(userId);
 *
 * // Show online friends
 * console.log(`${onlineCount} friends online`);
 * ```
 *
 * @returns {UseFriendsReturn} Friends management interface
 *
 * @throws {Error} When user is not authenticated
 */
export function useFriends(): UseFriendsReturn {
  const { isAuthenticated } = useAuth();

  // Queries
  const friends = useQuery(api.social.friends.getFriends, isAuthenticated ? {} : "skip");

  const incomingRequests = useQuery(
    api.social.friends.getIncomingRequests,
    isAuthenticated ? {} : "skip"
  );

  const outgoingRequests = useQuery(
    api.social.friends.getOutgoingRequests,
    isAuthenticated ? {} : "skip"
  );

  const blockedUsers = useQuery(api.social.friends.getBlockedUsers, isAuthenticated ? {} : "skip");

  // Mutations
  const sendRequestMutation = useMutation(api.social.friends.sendFriendRequest);
  const acceptRequestMutation = useMutation(api.social.friends.acceptFriendRequest);
  const declineRequestMutation = useMutation(api.social.friends.declineFriendRequest);
  const cancelRequestMutation = useMutation(api.social.friends.cancelFriendRequest);
  const removeFriendMutation = useMutation(api.social.friends.removeFriend);
  const blockUserMutation = useMutation(api.social.friends.blockUser);
  const unblockUserMutation = useMutation(api.social.friends.unblockUser);

  // Actions
  const sendFriendRequest = async (friendUsername: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const result = await sendRequestMutation({ friendUsername });
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
      await acceptRequestMutation({ friendId });
      toast.success("Friend request accepted!");
    } catch (error) {
      const message = handleHookError(error, "Failed to accept friend request");
      toast.error(message);
      throw error;
    }
  };

  const declineFriendRequest = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await declineRequestMutation({ friendId });
      toast.info("Friend request declined");
    } catch (error) {
      const message = handleHookError(error, "Failed to decline friend request");
      toast.error(message);
      throw error;
    }
  };

  const cancelFriendRequest = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await cancelRequestMutation({ friendId });
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
      await removeFriendMutation({ friendId });
      toast.info("Friend removed");
    } catch (error) {
      const message = handleHookError(error, "Failed to remove friend");
      toast.error(message);
      throw error;
    }
  };

  const blockUser = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await blockUserMutation({ friendId });
      toast.success("User blocked");
    } catch (error) {
      const message = handleHookError(error, "Failed to block user");
      toast.error(message);
      throw error;
    }
  };

  const unblockUser = async (friendId: Id<"users">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await unblockUserMutation({ friendId });
      toast.success("User unblocked");
    } catch (error) {
      const message = handleHookError(error, "Failed to unblock user");
      toast.error(message);
      throw error;
    }
  };

  return {
    // Data
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers,

    // Counts
    friendCount: friends?.length || 0,
    incomingRequestCount: incomingRequests?.length || 0,
    outgoingRequestCount: outgoingRequests?.length || 0,

    // Online friends
    onlineFriends: friends?.filter((f: Friend) => f.isOnline) || [],
    onlineCount: friends?.filter((f: Friend) => f.isOnline).length || 0,

    // Loading states
    isLoading: friends === undefined,

    // Actions
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
  };
}

/**
 * useSearchUsers Hook
 *
 * Separate hook for searching users.
 * Must be called at component top-level, not conditionally.
 *
 * @param query - Search query string
 * @param limit - Optional result limit
 */
export function useSearchUsers(
  query: string,
  limit?: number
): ReturnType<typeof useQuery<typeof api.social.friends.searchUsers>> | undefined {
  const { isAuthenticated } = useAuth();

  return useQuery(
    api.social.friends.searchUsers,
    isAuthenticated && query.length > 0 ? { query, limit } : "skip"
  );
}
