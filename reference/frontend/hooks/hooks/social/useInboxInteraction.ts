"use client";
import { type InboxMessageType, useInbox } from "@/hooks/social/useInbox";
import { useState } from "react";

export type { InboxMessage, InboxMessageType } from "@/hooks/social/useInbox";

export function useInboxInteraction() {
  const [activeFilter, setActiveFilter] = useState<InboxMessageType | "all">("all");
  const {
    messages,
    unreadCount,
    isLoading,
    hasUnclaimedRewards,
    unclaimedRewardCount,
    markAsRead,
    markAllAsRead,
    claimReward,
    deleteMessage,
    getMessagesByType,
  } = useInbox();

  // Filter messages based on active filter
  const filteredMessages = activeFilter === "all" ? messages : getMessagesByType(activeFilter);

  // Filter options with counts
  const allFilterOptions: Array<{ key: InboxMessageType | "all"; count: number }> = [
    { key: "all", count: messages?.length ?? 0 },
    { key: "reward", count: getMessagesByType("reward").length },
    { key: "announcement", count: getMessagesByType("announcement").length },
    { key: "challenge", count: getMessagesByType("challenge").length },
    { key: "friend_request", count: getMessagesByType("friend_request").length },
    { key: "guild_invite", count: getMessagesByType("guild_invite").length },
    { key: "guild_request", count: getMessagesByType("guild_request").length },
    { key: "system", count: getMessagesByType("system").length },
    { key: "achievement", count: getMessagesByType("achievement").length },
  ];

  const filterOptions = allFilterOptions.filter((opt) => opt.key === "all" || opt.count > 0);

  return {
    // State
    activeFilter,
    setActiveFilter,

    // Data
    messages,
    filteredMessages,
    filterOptions,
    unreadCount,
    isLoading,
    hasUnclaimedRewards,
    unclaimedRewardCount,

    // Actions
    markAsRead,
    markAllAsRead,
    claimReward,
    deleteMessage,
  };
}
