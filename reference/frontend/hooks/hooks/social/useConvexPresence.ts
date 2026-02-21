"use client";

import { logError } from "@/lib/errorHandling";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/useConvexAuthHook";

/**
 * User status options for presence tracking
 */
export type PresenceStatus = "online" | "in_game" | "idle";

/**
 * Configuration options for useConvexPresence hook
 */
export interface UseConvexPresenceOptions {
  /**
   * Room identifier for presence tracking
   * Examples: "global_chat", "story:act1-ch2", "tournament:abc123"
   */
  roomId: string;

  /**
   * User status (default: "online")
   */
  status?: PresenceStatus;

  /**
   * Enable/disable presence tracking
   * Set to false when user is not authenticated or when presence should be paused
   * Default: true
   */
  enabled?: boolean;

  /**
   * Heartbeat interval in milliseconds (default: 30000 = 30 seconds)
   * How often to send heartbeat updates to the server
   */
  heartbeatInterval?: number;
}

/**
 * User presence data from the server
 */
export interface PresenceUserData {
  userId: string;
  sessionId: string;
  username: string;
  status: PresenceStatus;
  lastActiveAt: number;
}

/**
 * Return type for useConvexPresence hook
 */
export interface UseConvexPresenceReturn {
  /**
   * List of users currently present in the room
   */
  users: PresenceUserData[];

  /**
   * Number of users in the room
   */
  userCount: number;

  /**
   * Whether the current user is actively broadcasting presence
   */
  isActive: boolean;

  /**
   * Update the current user's status
   * @param status - New status to set
   */
  updateStatus: (status: PresenceStatus) => Promise<void>;

  /**
   * Manually trigger a presence heartbeat
   */
  sendHeartbeat: () => Promise<void>;
}

/**
 * Convex Presence Hook
 *
 * Real-time presence tracking using @convex-dev/presence component.
 * Manages session lifecycle, automatic heartbeats, and presence queries.
 *
 * Features:
 * - Automatic session management (generates unique session ID)
 * - Periodic heartbeats (default: every 30 seconds)
 * - Browser tab visibility handling (pauses when hidden)
 * - Graceful disconnect on unmount/page unload
 * - Token caching for efficient queries
 * - Silent error handling to avoid disrupting UX
 *
 * @example
 * ```tsx
 * // Global chat presence
 * const { users, userCount } = useConvexPresence({
 *   roomId: "global_chat"
 * });
 *
 * // Story mode with custom status
 * const presence = useConvexPresence({
 *   roomId: `story:${chapterId}`,
 *   status: "online"
 * });
 *
 * // Conditional presence (only when authenticated)
 * const presence = useConvexPresence({
 *   roomId: "lobby:browse",
 *   enabled: isAuthenticated
 * });
 * ```
 *
 * @param options - Configuration options
 * @returns Presence interface with users list and controls
 */
export function useConvexPresence(options: UseConvexPresenceOptions): UseConvexPresenceReturn {
  const {
    roomId,
    status = "online",
    enabled = true,
    heartbeatInterval = 30000, // 30 seconds
  } = options;

  const { isAuthenticated } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<PresenceStatus>(status);
  const [isActive, setIsActive] = useState(false);
  const [roomToken, setRoomToken] = useState<string | null>(null);

  // Refs for stable references across renders
  const sessionIdRef = useRef<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);

  // Convex mutations and queries
  const heartbeatMutation = useMutation(api.presence.heartbeat);
  const disconnectMutation = useMutation(api.presence.disconnect);

  // Query presence list using room token
  const presenceList = useQuery(api.presence.list, roomToken ? { roomToken } : "skip");

  // Generate session ID on first render
  useEffect(() => {
    if (!sessionIdRef.current && typeof window !== "undefined") {
      sessionIdRef.current = crypto.randomUUID();
    }
  }, []);

  /**
   * Send heartbeat to server
   */
  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated || !enabled || !sessionIdRef.current) {
      return;
    }

    try {
      const tokens = await heartbeatMutation({
        roomId,
        sessionId: sessionIdRef.current,
        interval: heartbeatInterval,
        status: currentStatus,
      });

      // Update tokens for queries and disconnection
      setRoomToken(tokens.roomToken);
      sessionTokenRef.current = tokens.sessionToken;
      setIsActive(true);
    } catch (error) {
      logError("Presence heartbeat", error);
      setIsActive(false);
    }
  }, [isAuthenticated, enabled, roomId, currentStatus, heartbeatInterval, heartbeatMutation]);

  /**
   * Disconnect from presence
   */
  const disconnect = useCallback(async () => {
    if (!sessionTokenRef.current) {
      return;
    }

    try {
      await disconnectMutation({
        sessionToken: sessionTokenRef.current,
      });
      setIsActive(false);
      setRoomToken(null);
      sessionTokenRef.current = null;
    } catch (error) {
      // Silent failure - disconnect errors are not critical
      console.error("Presence disconnect failed:", error);
    }
  }, [disconnectMutation]);

  /**
   * Update user status
   */
  const updateStatus = useCallback(
    async (newStatus: PresenceStatus) => {
      setCurrentStatus(newStatus);
      // Heartbeat will be sent on next interval with new status
      // For immediate update, send heartbeat now
      if (isActive) {
        await sendHeartbeat();
      }
    },
    [isActive, sendHeartbeat]
  );

  /**
   * Start heartbeat interval
   */
  useEffect(() => {
    if (!isAuthenticated || !enabled || !sessionIdRef.current) {
      return;
    }

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Set up periodic heartbeat
    heartbeatTimerRef.current = setInterval(() => {
      if (!isUnmountingRef.current) {
        sendHeartbeat();
      }
    }, heartbeatInterval);

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [isAuthenticated, enabled, roomId, heartbeatInterval, sendHeartbeat]);

  /**
   * Handle page visibility changes
   * Pause heartbeats when tab is hidden, resume when visible
   */
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - clear heartbeat timer
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }
      } else {
        // Tab visible - resume heartbeats
        if (isAuthenticated && enabled && !heartbeatTimerRef.current) {
          sendHeartbeat(); // Immediate heartbeat on resume
          heartbeatTimerRef.current = setInterval(sendHeartbeat, heartbeatInterval);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, enabled, heartbeatInterval, sendHeartbeat]);

  /**
   * Cleanup on unmount
   *
   * Note: On component unmount, we attempt to disconnect gracefully.
   * On page unload/tab close, the disconnect may not complete, but the server
   * will automatically remove the presence after 2.5x the heartbeat interval
   * (75 seconds with default 30s interval).
   */
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;

      // Clear heartbeat timer
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }

      // Attempt graceful disconnect (best effort)
      // May not complete on page unload, but that's OK - server will timeout
      if (sessionTokenRef.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  return {
    users: presenceList ?? [],
    userCount: presenceList?.length ?? 0,
    isActive,
    updateStatus,
    sendHeartbeat,
  };
}
