"use client";

import { handleHookError } from "@/lib/errorHandling";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

/**
 * Hook for managing a single DM conversation chat
 *
 * @param conversationId - The conversation ID to chat in
 * @returns Chat data and actions
 */
export function useDMChat(conversationId?: Id<"dmConversations">) {
  const { isAuthenticated } = useAuth();

  // Get messages for this conversation
  const messages = useQuery(
    api.social.getConversationMessages,
    conversationId && isAuthenticated ? { conversationId } : "skip"
  );

  // Mutations
  const sendMessageMutation = useMutation(api.social.sendDirectMessage);
  const markReadMutation = useMutation(api.social.markConversationRead);

  // Mark conversation as read when viewing
  useEffect(() => {
    if (conversationId && isAuthenticated && messages !== undefined) {
      markReadMutation({ conversationId }).catch(() => {
        // Silently fail - not critical
      });
    }
  }, [conversationId, isAuthenticated, messages, markReadMutation]);

  // Actions
  const sendMessage = useCallback(
    async (message: string) => {
      if (!conversationId) {
        toast.error("No conversation selected");
        return;
      }

      const trimmedMessage = message.trim();
      if (!trimmedMessage) {
        return;
      }

      if (trimmedMessage.length > 1000) {
        toast.error("Message too long (max 1000 characters)");
        return;
      }

      try {
        await sendMessageMutation({
          conversationId,
          message: trimmedMessage,
        });
      } catch (error) {
        const errorMessage = handleHookError(error, "Failed to send message");
        toast.error(errorMessage);
        throw error;
      }
    },
    [conversationId, sendMessageMutation]
  );

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await markReadMutation({ conversationId });
    } catch (error) {
      // Silently fail - not critical
      console.error("Failed to mark conversation as read:", error);
    }
  }, [conversationId, markReadMutation]);

  return {
    // Data
    messages: messages ?? [],
    isLoading: messages === undefined,
    hasConversation: !!conversationId,
    // Actions
    sendMessage,
    markAsRead,
  };
}
