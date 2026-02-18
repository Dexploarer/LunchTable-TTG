"use client";

import type { Id } from "@convex/_generated/dataModel";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDMConversations } from "./useDMConversations";
import { useFriends } from "./useFriends";

export type TabType = "friends" | "requests" | "blocked";

import type { UseFriendsReturn } from "./useFriends";

export interface UseFriendsInteractionReturn extends UseFriendsReturn {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addFriendUsername: string;
  setAddFriendUsername: (username: string) => void;
  isAdding: boolean;
  showAddFriend: boolean;
  setShowAddFriend: (show: boolean) => void;
  confirmRemove: string | null;
  setConfirmRemove: (id: string | null) => void;
  tabs: { id: TabType; label: string; count: number }[];
  filteredFriends: UseFriendsReturn["friends"];
  offlineFriends: UseFriendsReturn["friends"];
  filteredOnline: UseFriendsReturn["friends"];
  handleAddFriend: () => Promise<void>;
  handleMessage: (friendId: Id<"users">) => Promise<void>;
}

export function useFriendsInteraction(): UseFriendsInteractionReturn {
  const friendsHook = useFriends();
  const { startConversation } = useDMConversations();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendUsername, setAddFriendUsername] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const handleAddFriend = async () => {
    if (!addFriendUsername.trim() || isAdding) return;
    setIsAdding(true);
    try {
      await friendsHook.sendFriendRequest(addFriendUsername.trim());
      setAddFriendUsername("");
      setShowAddFriend(false);
    } catch {
      // Error handled by hook
    } finally {
      setIsAdding(false);
    }
  };

  const handleMessage = async (friendId: Id<"users">) => {
    try {
      await startConversation(friendId);
      navigate({ to: "/lunchtable" });
    } catch {
      // Error handled by hook
    }
  };

  const tabs = useMemo(
    () => [
      { id: "friends" as const, label: "Friends", count: friendsHook.friendCount },
      {
        id: "requests" as const,
        label: "Requests",
        count: friendsHook.incomingRequestCount + friendsHook.outgoingRequestCount,
      },
      { id: "blocked" as const, label: "Blocked", count: friendsHook.blockedUsers?.length ?? 0 },
    ],
    [friendsHook]
  );

  // Filter friends by search
  const filteredFriends = useMemo(() => {
    if (!searchQuery) return friendsHook.friends;
    return friendsHook.friends?.filter((f) =>
      f.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friendsHook.friends, searchQuery]);

  // Separate online and offline
  const offlineFriends = useMemo(
    () => filteredFriends?.filter((f) => !f.isOnline) ?? [],
    [filteredFriends]
  );

  const filteredOnline = useMemo(
    () => filteredFriends?.filter((f) => f.isOnline) ?? [],
    [filteredFriends]
  );

  return {
    // Friends state from base hook
    ...friendsHook,

    // Interaction state
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    addFriendUsername,
    setAddFriendUsername,
    isAdding,
    showAddFriend,
    setShowAddFriend,
    confirmRemove,
    setConfirmRemove,

    // Derived state
    tabs,
    filteredFriends,
    offlineFriends,
    filteredOnline,

    // Handlers
    handleAddFriend,
    handleMessage,
  };
}
