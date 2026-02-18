"use client";

import { handleHookError } from "@/lib/errorHandling";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, usePaginatedQuery } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

// Module-scope references to avoid TS2589
const getPaginatedMessagesQuery = api.social.guilds.chat.getPaginatedMessages;
const sendMessageMutation = api.social.guilds.chat.sendMessage;

/**
 * Hook for guild chat functionality
 *
 * @param guildId - The ID of the guild to chat in
 * @returns Chat messages and send functionality
 */
export function useGuildChat(guildId: Id<"guilds"> | null) {
  const { isAuthenticated } = useAuth();

  // Paginated messages
  const {
    results: messages,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(getPaginatedMessagesQuery, guildId ? { guildId } : "skip", {
    initialNumItems: 50,
  });

  // Send message mutation
  const sendMessageRaw = useMutation(sendMessageMutation);

  // Actions
  const sendMessage = async (message: string) => {
    if (!guildId || !isAuthenticated) return;

    const trimmed = message.trim();
    if (trimmed.length === 0) return;

    try {
      await sendMessageRaw({ guildId, message: trimmed });
    } catch (error) {
      const errorMsg = handleHookError(error, "Failed to send message");
      toast.error(errorMsg);
      throw error;
    }
  };

  // Reverse messages to show oldest first (they come in desc order for pagination)
  const sortedMessages = messages ? [...messages].reverse() : [];

  return {
    messages: sortedMessages,
    isLoading: messages === undefined,
    sendMessage,
    canLoadMore: paginationStatus === "CanLoadMore",
    loadMore: () => loadMore(25),
  };
}
