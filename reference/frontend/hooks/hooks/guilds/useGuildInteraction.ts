"use client";

import type { Visibility } from "@/types/common";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuth } from "../auth/useConvexAuthHook";
import { useGuild } from "./useGuild";
import { useGuildDiscovery } from "./useGuildDiscovery";
import { useMyGuild } from "./useMyGuild";

export type GuildDashboardTab = "members" | "chat" | "settings" | "invites";

export interface UseGuildInteractionReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasGuild: boolean;
  guild: ReturnType<typeof useMyGuild>["guild"];
  dashboard: {
    activeTab: GuildDashboardTab;
    setActiveTab: (tab: GuildDashboardTab) => void;
    guild: ReturnType<typeof useMyGuild>["guild"];
    details: ReturnType<typeof useGuild>["guild"];
    members: ReturnType<typeof useGuild>["members"];
    onlineMemberCount: number;
    joinRequests: ReturnType<typeof useGuild>["joinRequests"];
    leaveGuild: () => Promise<unknown>;
    kickMember: (userId: Id<"users">) => Promise<unknown>;
    transferOwnership: (newOwnerId: Id<"users">) => Promise<unknown>;
    approveRequest: (requestId: Id<"guildJoinRequests">) => Promise<unknown>;
    rejectRequest: (requestId: Id<"guildJoinRequests">) => Promise<unknown>;
    updateGuild: (data: {
      name?: string;
      description?: string;
      visibility?: Visibility;
    }) => Promise<unknown>;
    setProfileImage: (storageId: Id<"_storage">) => Promise<unknown>;
    setBannerImage: (storageId: Id<"_storage">) => Promise<unknown>;
    isOwner: boolean;
    isMember: boolean;
    myRole: "owner" | "admin" | "member" | null;
  };
  discovery: ReturnType<typeof useGuildDiscovery>;
}

export function useGuildInteraction(): UseGuildInteractionReturn {
  const { isAuthenticated } = useAuth();
  const myGuild = useMyGuild();
  const discovery = useGuildDiscovery();

  // Fetch detailed guild data if user has a guild
  const guildDetails = useGuild(myGuild.guild?._id ?? null);

  const [activeTab, setActiveTab] = useState<GuildDashboardTab>("members");

  return {
    isAuthenticated,
    // Combine loading states
    isLoading: myGuild.isLoading || (myGuild.hasGuild && guildDetails.isLoading),

    // Guild Membership State
    hasGuild: myGuild.hasGuild,
    guild: myGuild.guild,

    // Dashboard State (for when user has a guild)
    dashboard: {
      activeTab,
      setActiveTab,
      guild: myGuild.guild,
      details: guildDetails.guild,
      members: guildDetails.members,
      onlineMemberCount: guildDetails.onlineMemberCount,
      joinRequests: guildDetails.joinRequests,
      leaveGuild: myGuild.leaveGuild,
      kickMember: guildDetails.kickMember,
      transferOwnership: guildDetails.transferOwnership,
      approveRequest: guildDetails.approveRequest,
      rejectRequest: guildDetails.rejectRequest,
      updateGuild: guildDetails.updateGuild,
      setProfileImage: guildDetails.setProfileImage,
      setBannerImage: guildDetails.setBannerImage,
      isOwner: myGuild.isOwner,
      isMember: myGuild.isMember,
      myRole: myGuild.myRole,
    },

    // Discovery State (for when user has no guild)
    discovery: {
      ...discovery,
    },
  };
}
