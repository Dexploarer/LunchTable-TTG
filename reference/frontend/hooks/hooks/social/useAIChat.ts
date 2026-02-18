"use client";

import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { handleHookError, logError } from "@/lib/errorHandling";
import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

interface AIMessage {
  _id: string;
  role: "user" | "agent";
  message: string;
  createdAt: number;
}

interface UseAIChatReturn {
  messages: AIMessage[];
  isLoading: boolean;
  isAgentTyping: boolean;
  sessionId: string | null;
  sendMessage: (message: string) => Promise<void>;
  createNewSession: () => Promise<void>;
  endSession: () => Promise<void>;
}

/**
 * AI Chat hook for conversational AI with the Lunchtable Guide.
 *
 * Provides real-time chat with an ElizaOS-powered AI agent.
 * Messages are persisted in Convex for conversation history.
 *
 * Features:
 * - Send messages to AI agent
 * - Real-time message sync via Convex subscription
 * - Session management (create/end conversations)
 * - Loading states for agent responses
 *
 * @example
 * ```typescript
 * const {
 *   messages,
 *   isLoading,
 *   isAgentTyping,
 *   sendMessage,
 *   createNewSession,
 * } = useAIChat();
 *
 * // Send a message
 * await sendMessage("How do Fire decks work?");
 *
 * // Start a new conversation
 * await createNewSession();
 * ```
 */
export function useAIChat(): UseAIChatReturn {
  const { isAuthenticated } = useAuth();
  const { getAccessToken } = usePrivy();
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  // Get the current user from Convex for the userId
  const currentUser = useConvexQuery(
    typedApi.core.users.currentUser,
    isAuthenticated ? {} : "skip"
  );
  const userId = currentUser?._id;

  // Get active session
  const activeSession = useConvexQuery(typedApi.social.aiChat.getActiveSession, {});
  const sessionId = activeSession?.sessionId ?? null;

  // Get messages for current session
  const messagesData = useConvexQuery(
    typedApi.social.aiChat.getSessionMessages,
    sessionId ? { sessionId } : "skip"
  );

  // Mutations
  const sendUserMessageMutation = useConvexMutation(typedApi.social.aiChat.sendUserMessage);
  const createSessionMutation = useConvexMutation(typedApi.social.aiChat.createSession);
  const endSessionMutation = useConvexMutation(typedApi.social.aiChat.endSession);

  /**
   * Send a message to the AI agent.
   * First saves to Convex, then calls the API route for ElizaOS response.
   */
  const sendMessage = useCallback(
    async (message: string) => {
      if (!isAuthenticated || !userId) {
        throw new Error("Not authenticated");
      }
      if (message.trim().length === 0) return;

      try {
        // Save user message and get/create session
        const result = await sendUserMessageMutation({
          message: message.trim(),
          sessionId: sessionId ?? undefined,
        });

        // Show typing indicator
        setIsAgentTyping(true);

        try {
          // Get auth token for API call
          const authToken = await getAccessToken();

          // Call Next.js API route for ElizaOS response
          const response = await fetch("/api/ai-chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: message.trim(),
              sessionId: result.sessionId,
              userId,
              authToken,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to get AI response");
          }

          // Response is saved to Convex by the API route
          // Convex subscription will automatically update messages
        } catch (apiError) {
          logError("AI chat API", apiError);
          // Don't show error toast - the message was saved, just AI response failed
          // The UI will show the user message without a response
        } finally {
          setIsAgentTyping(false);
        }
      } catch (error) {
        setIsAgentTyping(false);
        const errorMessage = handleHookError(error, "Failed to send message");
        toast.error(errorMessage);
        throw error;
      }
    },
    [isAuthenticated, userId, sessionId, sendUserMessageMutation, getAccessToken]
  );

  /**
   * Create a new chat session, ending any existing one.
   */
  const createNewSession = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }

    try {
      await createSessionMutation({});
    } catch (error) {
      const errorMessage = handleHookError(error, "Failed to create session");
      toast.error(errorMessage);
      throw error;
    }
  }, [isAuthenticated, createSessionMutation]);

  /**
   * End the current chat session.
   */
  const endSession = useCallback(async () => {
    if (!isAuthenticated || !sessionId) return;

    try {
      await endSessionMutation({ sessionId });
    } catch (error) {
      logError("End session", error);
      // Silent fail - not critical
    }
  }, [isAuthenticated, sessionId, endSessionMutation]);

  // Transform messages to expected format
  const messages: AIMessage[] = (messagesData ?? []).map(
    (m: { _id: string; role: "user" | "agent"; message: string; createdAt: number }) => ({
      _id: m._id,
      role: m.role,
      message: m.message,
      createdAt: m.createdAt,
    })
  );

  return {
    messages,
    isLoading: activeSession === undefined,
    isAgentTyping,
    sessionId,
    sendMessage,
    createNewSession,
    endSession,
  };
}
