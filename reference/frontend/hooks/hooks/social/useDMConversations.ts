"use client";

import { handleHookError } from "@/lib/errorHandling";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

/**
 * Hook for managing DM conversations list
 *
 * @returns Conversation list data and actions
 */
export function useDMConversations() {
  const { isAuthenticated } = useAuth();

  // Get all conversations
  const conversations = useQuery(api.social.getDMConversations, isAuthenticated ? {} : "skip");

  // Get total unread count
  const unreadCount = useQuery(api.social.getDMUnreadCount, isAuthenticated ? {} : "skip");

  // Mutations
  const getOrCreateConversationMutation = useMutation(api.social.getOrCreateConversation);
  const archiveConversationMutation = useMutation(api.social.archiveConversation);

  // Actions
  const startConversation = async (friendId: Id<"users">) => {
    try {
      const result = await getOrCreateConversationMutation({ friendId });
      return result.conversationId;
    } catch (error) {
      const message = handleHookError(error, "Failed to start conversation");
      toast.error(message);
      throw error;
    }
  };

  const archiveConversation = async (conversationId: Id<"dmConversations">) => {
    try {
      await archiveConversationMutation({ conversationId });
      toast.success("Conversation archived");
    } catch (error) {
      const message = handleHookError(error, "Failed to archive conversation");
      toast.error(message);
      throw error;
    }
  };

  return {
    // Data
    conversations: conversations ?? [],
    unreadCount: unreadCount ?? 0,
    hasUnread: (unreadCount ?? 0) > 0,
    isLoading: conversations === undefined,
    // Actions
    startConversation,
    archiveConversation,
  };
}
