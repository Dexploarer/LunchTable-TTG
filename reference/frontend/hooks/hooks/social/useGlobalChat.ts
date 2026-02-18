"use client";

import { handleHookError } from "@/lib/errorHandling";
import * as generatedApi from "@convex/_generated/api";
// biome-ignore lint/suspicious/noExplicitAny: TS2589 workaround for deep type instantiation
const apiAny = (generatedApi as any).api;
import { useMutation, usePaginatedQuery } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";
import { useConvexPresence } from "./useConvexPresence";

interface UseGlobalChatReturn {
  // biome-ignore lint/suspicious/noExplicitAny: Avoids TS2589 from deeply nested usePaginatedQuery generic
  messages: any[];
  onlineUsers: ReturnType<typeof useConvexPresence>["users"];
  onlineCount: number;
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  canLoadMore: boolean;
  loadMore: () => void;
}

/**
 * Global chat messaging system with automatic presence tracking.
 *
 * Provides a real-time global chat room with message pagination and online
 * user tracking using @convex-dev/presence. Automatically maintains user
 * presence with a 30-second heartbeat. Uses infinite scroll pagination for
 * message history.
 *
 * Features:
 * - Send messages to global chat
 * - View paginated message history (initially 50 messages)
 * - Load more messages on scroll (25 at a time)
 * - Track online users with @convex-dev/presence
 * - Automatic presence heartbeat every 30 seconds
 * - Browser tab visibility handling (pauses when hidden)
 * - Graceful disconnect on unmount
 *
 * @example
 * ```typescript
 * const {
 *   messages,
 *   onlineUsers,
 *   onlineCount,
 *   isLoading,
 *   canLoadMore,
 *   sendMessage,
 *   loadMore
 * } = useGlobalChat();
 *
 * // Send a message
 * await sendMessage("Hello everyone!");
 *
 * // Load more messages
 * if (canLoadMore) {
 *   loadMore(); // Loads 25 more messages
 * }
 *
 * // Display online users
 * console.log(`${onlineCount} users online`);
 * onlineUsers.forEach(user => {
 *   console.log(`${user.username} is ${user.status}`);
 * });
 * ```
 *
 * @returns {UseGlobalChatReturn} Chat interface
 *
 * @throws {Error} When user is not authenticated
 */
export function useGlobalChat(): UseGlobalChatReturn {
  const { isAuthenticated } = useAuth();

  // Paginated messages query (initially load 50 messages)
  const {
    results: messages,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(apiAny.social.globalChat.getPaginatedMessages, {}, { initialNumItems: 50 });

  // Use new presence system with automatic heartbeat
  const { users: onlineUsers, userCount: onlineCount } = useConvexPresence({
    roomId: "global_chat",
    status: "online",
    enabled: isAuthenticated,
  });

  // Mutations
  const sendMessageMutation = useMutation(apiAny.social.globalChat.sendMessage);

  // Actions
  const sendMessage = async (message: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    if (message.trim().length === 0) return;

    try {
      await sendMessageMutation({ content: message.trim() });
    } catch (error) {
      const message = handleHookError(error, "Failed to send message");
      toast.error(message);
      throw error;
    }
  };

  return {
    messages,
    onlineUsers,
    onlineCount,
    isLoading: messages === undefined,
    sendMessage,
    // Pagination controls
    canLoadMore: paginationStatus === "CanLoadMore",
    loadMore: () => loadMore(25), // Load 25 more messages at a time
  };
}
