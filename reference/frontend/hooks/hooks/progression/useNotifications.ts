"use client";

import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { handleHookError, logError } from "@/lib/errorHandling";
import type { Notification } from "@/types";
import type { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

interface UseNotificationsReturn {
  unreadNotifications: Notification[];
  allNotifications: Notification[];
  achievementNotifications: Notification[];
  levelUpNotifications: Notification[];
  questNotifications: Notification[];
  badgeNotifications: Notification[];
  unreadCount: number;
  achievementCount: number;
  levelUpCount: number;
  questCount: number;
  badgeCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: Id<"playerNotifications">) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

/**
 * Player notification system for achievements, level ups, and quests.
 *
 * Provides real-time notifications via Convex subscriptions. Automatically
 * tracks unread status and allows marking notifications as read. Filters
 * notifications by type for targeted displays.
 *
 * Features:
 * - View unread notifications
 * - View all notifications (limit 50)
 * - Mark individual notification as read
 * - Mark all notifications as read
 * - Filter by type (achievement, level_up, quest, badge)
 * - Real-time updates via Convex
 * - Unread count tracking
 *
 * @example
 * ```typescript
 * const {
 *   unreadNotifications,
 *   achievementNotifications,
 *   levelUpNotifications,
 *   unreadCount,
 *   markAsRead,
 *   markAllAsRead
 * } = useNotifications();
 *
 * // Show unread count
 * console.log(`${unreadCount} unread notifications`);
 *
 * // Display notifications
 * unreadNotifications.forEach(notif => {
 *   console.log(`${notif.type}: ${notif.message}`);
 * });
 *
 * // Mark one as read (silent)
 * await markAsRead(notificationId);
 *
 * // Mark all as read
 * await markAllAsRead();
 * // Toast shows: "Marked 5 notifications as read"
 * ```
 *
 * @returns {UseNotificationsReturn} Notification interface with type filtering
 *
 * @throws {Error} When user is not authenticated
 */
export function useNotifications(): UseNotificationsReturn {
  const { isAuthenticated } = useAuth();

  // Queries
  const unreadNotifications = useConvexQuery(
    typedApi.progression.notifications.getUnreadNotifications,
    isAuthenticated ? {} : "skip"
  );

  const allNotifications = useConvexQuery(
    typedApi.progression.notifications.getAllNotifications,
    isAuthenticated ? { limit: 50 } : "skip"
  );

  // Mutations
  const markAsReadMutation = useConvexMutation(
    typedApi.progression.notifications.markNotificationAsRead
  );
  const markAllAsReadMutation = useConvexMutation(typedApi.progression.notifications.markAllAsRead);

  // Actions
  const markAsRead = async (notificationId: Id<"playerNotifications">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await markAsReadMutation({ notificationId });
    } catch (error) {
      logError("mark notification read", error);
    }
  };

  const markAllAsRead = async () => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const result = await markAllAsReadMutation({});
      if (result.count > 0) {
        toast.success(`Marked ${result.count} notifications as read`);
      }
    } catch (error) {
      const message = handleHookError(error, "Failed to mark all as read");
      toast.error(message);
    }
  };

  // Separate notifications by type
  const achievementNotifications =
    unreadNotifications?.filter((n: Notification) => n.type === "achievement_unlocked") || [];
  const levelUpNotifications =
    unreadNotifications?.filter((n: Notification) => n.type === "level_up") || [];
  const questNotifications =
    unreadNotifications?.filter((n: Notification) => n.type === "quest_completed") || [];
  const badgeNotifications =
    unreadNotifications?.filter((n: Notification) => n.type === "badge_earned") || [];

  return {
    // Data
    unreadNotifications: unreadNotifications || [],
    allNotifications: allNotifications || [],
    achievementNotifications,
    levelUpNotifications,
    questNotifications,
    badgeNotifications,

    // Counts
    unreadCount: unreadNotifications?.length || 0,
    achievementCount: achievementNotifications.length,
    levelUpCount: levelUpNotifications.length,
    questCount: questNotifications.length,
    badgeCount: badgeNotifications.length,

    // Loading state
    isLoading: unreadNotifications === undefined,

    // Actions
    markAsRead,
    markAllAsRead,
  };
}
