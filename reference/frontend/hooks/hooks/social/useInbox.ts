"use client";

import { handleHookError } from "@/lib/errorHandling";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

// ============================================================================
// Types
// ============================================================================

export type InboxMessageType =
  | "reward"
  | "announcement"
  | "challenge"
  | "friend_request"
  | "guild_invite"
  | "guild_request"
  | "system"
  | "achievement";

export interface InboxMessage {
  _id: Id<"userInbox">;
  _creationTime: number;
  userId: Id<"users">;
  type: InboxMessageType;
  title: string;
  message: string;
  data?: unknown;
  senderId?: Id<"users">;
  senderUsername?: string;
  isRead: boolean;
  readAt?: number;
  claimedAt?: number;
  expiresAt?: number;
  deletedAt?: number;
  createdAt: number;
}

export interface ClaimRewardResult {
  success: boolean;
  rewards: {
    gold?: number;
    cards?: string[];
    packs?: number;
  };
}

interface UseInboxReturn {
  messages: InboxMessage[] | undefined;
  unreadCount: number;
  isLoading: boolean;
  // Filtered message lists
  rewards: InboxMessage[];
  announcements: InboxMessage[];
  challenges: InboxMessage[];
  friendRequests: InboxMessage[];
  systemMessages: InboxMessage[];
  achievements: InboxMessage[];
  // Has unclaimed rewards
  hasUnclaimedRewards: boolean;
  unclaimedRewardCount: number;
  // Actions
  markAsRead: (messageId: Id<"userInbox">) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  claimReward: (messageId: Id<"userInbox">) => Promise<ClaimRewardResult>;
  deleteMessage: (messageId: Id<"userInbox">) => Promise<void>;
  // Refresh helper (for filtering)
  getMessagesByType: (type: InboxMessageType) => InboxMessage[];
}

/**
 * Unified inbox management for all user notifications and messages.
 *
 * Provides access to rewards, announcements, challenges, friend requests,
 * and system messages. Supports filtering, marking as read, claiming rewards,
 * and deleting messages.
 *
 * Features:
 * - Real-time message updates via Convex subscriptions
 * - Unread count for badge display
 * - Filter messages by type
 * - Claim admin-granted rewards
 * - Mark messages as read (single or all)
 * - Delete messages
 *
 * @example
 * ```typescript
 * const {
 *   messages,
 *   unreadCount,
 *   rewards,
 *   hasUnclaimedRewards,
 *   markAsRead,
 *   claimReward
 * } = useInbox();
 *
 * // Display unread badge
 * if (unreadCount > 0) {
 *   console.log(`${unreadCount} new messages`);
 * }
 *
 * // Claim a reward
 * const result = await claimReward(rewardMessageId);
 * console.log(`Received ${result.rewards.gold} gold!`);
 *
 * // Mark as read
 * await markAsRead(messageId);
 * ```
 *
 * @returns {UseInboxReturn} Inbox management interface
 */
export function useInbox(): UseInboxReturn {
  const { isAuthenticated } = useAuth();

  // Check if user record exists in Convex (handles new signup race condition)
  const currentUser = useQuery(api.core.users.currentUser, isAuthenticated ? {} : "skip");

  // Only fetch inbox data if user record exists (not just authenticated)
  // This prevents errors during signup when Privy auth is valid but user record isn't created yet
  const userExists = isAuthenticated && currentUser !== undefined && currentUser !== null;

  // Queries
  const messages = useQuery(
    api.social.inbox.getInboxMessages,
    userExists ? { limit: 100 } : "skip"
  ) as InboxMessage[] | undefined;

  const unreadCountQuery = useQuery(api.social.inbox.getUnreadCount, userExists ? {} : "skip");

  // Mutations
  const markAsReadMutation = useMutation(api.social.inbox.markAsRead);
  const markAllAsReadMutation = useMutation(api.social.inbox.markAllAsRead);
  const claimRewardMutation = useMutation(api.social.inbox.claimReward);
  const deleteMessageMutation = useMutation(api.social.inbox.deleteMessage);

  // Derived data
  const unreadCount = unreadCountQuery ?? 0;

  // Filter messages by type
  const getMessagesByType = (type: InboxMessageType): InboxMessage[] => {
    if (!messages) return [];
    return messages.filter((m) => m.type === type);
  };

  const rewards = getMessagesByType("reward");
  const announcements = getMessagesByType("announcement");
  const challenges = getMessagesByType("challenge");
  const friendRequests = getMessagesByType("friend_request");
  const systemMessages = getMessagesByType("system");
  const achievements = getMessagesByType("achievement");

  // Unclaimed rewards
  const unclaimedRewards = rewards.filter((r) => !r.claimedAt);
  const hasUnclaimedRewards = unclaimedRewards.length > 0;
  const unclaimedRewardCount = unclaimedRewards.length;

  // Actions
  const markAsRead = async (messageId: Id<"userInbox">) => {
    try {
      await markAsReadMutation({ messageId });
    } catch (error) {
      const errorMessage = handleHookError(error, "Failed to mark as read");
      toast.error(errorMessage);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const result = await markAllAsReadMutation({});
      if (result.count > 0) {
        toast.success(`Marked ${result.count} messages as read`);
      }
    } catch (error) {
      const errorMessage = handleHookError(error, "Failed to mark all as read");
      toast.error(errorMessage);
      throw error;
    }
  };

  const claimReward = async (messageId: Id<"userInbox">): Promise<ClaimRewardResult> => {
    try {
      const result = await claimRewardMutation({ messageId });

      // Show toast with reward details
      const rewardParts: string[] = [];
      if (result.rewards.gold) {
        rewardParts.push(`${result.rewards.gold.toLocaleString()} gold`);
      }
      if (result.rewards.cards && result.rewards.cards.length > 0) {
        rewardParts.push(`${result.rewards.cards.length} card(s)`);
      }
      if (result.rewards.packs) {
        rewardParts.push(`${result.rewards.packs} pack(s)`);
      }

      if (rewardParts.length > 0) {
        toast.success(`Claimed: ${rewardParts.join(", ")}!`);
      } else {
        toast.success("Reward claimed!");
      }

      return result;
    } catch (error) {
      const errorMessage = handleHookError(error, "Failed to claim reward");
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteMessage = async (messageId: Id<"userInbox">) => {
    try {
      await deleteMessageMutation({ messageId });
      toast.success("Message deleted");
    } catch (error) {
      const errorMessage = handleHookError(error, "Failed to delete message");
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    // Data
    messages,
    unreadCount,
    isLoading: messages === undefined,

    // Filtered lists
    rewards,
    announcements,
    challenges,
    friendRequests,
    systemMessages,
    achievements,

    // Unclaimed rewards
    hasUnclaimedRewards,
    unclaimedRewardCount,

    // Actions
    markAsRead,
    markAllAsRead,
    claimReward,
    deleteMessage,

    // Helper
    getMessagesByType,
  };
}
