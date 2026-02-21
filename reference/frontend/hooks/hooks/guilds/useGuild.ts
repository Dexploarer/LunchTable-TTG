"use client";

import { typedApi, useQuery } from "@/lib/convexHelpers";
import { useMutationWithToast } from "@/lib/useMutationWithToast";
import type { Visibility } from "@/types/common";
import type { Id } from "@convex/_generated/dataModel";

// Module-scope references to avoid TS2589
const getGuildQuery = typedApi.social.guilds.core.getGuild;
const getGuildMembersQuery = typedApi.social.guilds.members.getGuildMembers;
const getOnlineMemberCountQuery = typedApi.social.guilds.members.getOnlineMemberCount;
const getGuildJoinRequestsQuery = typedApi.social.guilds.requests.getGuildJoinRequests;
const updateGuildMutation = typedApi.social.guilds.core.updateGuild;
const deleteGuildMutation = typedApi.social.guilds.core.deleteGuild;
const setProfileImageMutation = typedApi.social.guilds.core.setProfileImage;
const setBannerImageMutation = typedApi.social.guilds.core.setBannerImage;
const transferOwnershipMutation = typedApi.social.guilds.core.transferOwnership;
const kickMemberMutation = typedApi.social.guilds.members.kickMember;
const approveRequestMutation = typedApi.social.guilds.requests.approveRequest;
const rejectRequestMutation = typedApi.social.guilds.requests.rejectRequest;

/**
 * Hook for viewing and managing a specific guild
 *
 * @param guildId - The ID of the guild to view
 * @returns Guild data, members, and management actions
 */
export function useGuild(guildId: Id<"guilds"> | null) {
  // Queries
  const guild = useQuery(getGuildQuery, guildId ? { guildId } : "skip");
  const members = useQuery(getGuildMembersQuery, guildId ? { guildId } : "skip");
  const onlineMemberCount = useQuery(getOnlineMemberCountQuery, guildId ? { guildId } : "skip");
  const joinRequests = useQuery(getGuildJoinRequestsQuery, guildId ? { guildId } : "skip");

  // Mutations with toast handling
  const updateGuildRaw = useMutationWithToast(updateGuildMutation, {
    success: "Guild updated",
    error: "Failed to update guild",
  });

  const deleteGuildRaw = useMutationWithToast(deleteGuildMutation, {
    success: "Guild deleted",
    error: "Failed to delete guild",
  });

  const setProfileImageRaw = useMutationWithToast(setProfileImageMutation, {
    success: "Profile image updated",
    error: "Failed to update profile image",
  });

  const setBannerImageRaw = useMutationWithToast(setBannerImageMutation, {
    success: "Banner image updated",
    error: "Failed to update banner image",
  });

  const transferOwnershipRaw = useMutationWithToast(transferOwnershipMutation, {
    success: "Ownership transferred",
    error: "Failed to transfer ownership",
  });

  const kickMemberRaw = useMutationWithToast(kickMemberMutation, {
    success: "Member removed",
    error: "Failed to remove member",
  });

  const approveRequestRaw = useMutationWithToast(approveRequestMutation, {
    success: "Request approved",
    error: "Failed to approve request",
  });

  const rejectRequestRaw = useMutationWithToast(rejectRequestMutation, {
    success: "Request rejected",
    error: "Failed to reject request",
  });

  // Convenience wrappers that include guildId
  const updateGuild = (data: {
    name?: string;
    description?: string;
    visibility?: Visibility;
  }) => {
    if (!guildId) return Promise.resolve();
    return updateGuildRaw({ guildId, ...data });
  };

  const deleteGuild = () => {
    if (!guildId) return Promise.resolve();
    return deleteGuildRaw({ guildId });
  };

  const setProfileImage = (storageId: Id<"_storage">) => {
    if (!guildId) return Promise.resolve();
    return setProfileImageRaw({ guildId, storageId });
  };

  const setBannerImage = (storageId: Id<"_storage">) => {
    if (!guildId) return Promise.resolve();
    return setBannerImageRaw({ guildId, storageId });
  };

  const transferOwnership = (newOwnerId: Id<"users">) => {
    if (!guildId) return Promise.resolve();
    return transferOwnershipRaw({ guildId, newOwnerId });
  };

  const kickMember = (userId: Id<"users">) => {
    if (!guildId) return Promise.resolve();
    return kickMemberRaw({ guildId, userId });
  };

  const approveRequest = (requestId: Id<"guildJoinRequests">) => approveRequestRaw({ requestId });

  const rejectRequest = (requestId: Id<"guildJoinRequests">) => rejectRequestRaw({ requestId });

  return {
    // Data
    guild: guild ?? null,
    members: members ?? [],
    onlineMemberCount: onlineMemberCount ?? 0,
    joinRequests: joinRequests ?? [],
    // Loading states
    isLoading: guild === undefined,
    isFullyLoaded:
      guild !== undefined &&
      members !== undefined &&
      onlineMemberCount !== undefined &&
      joinRequests !== undefined,
    // Actions
    updateGuild,
    deleteGuild,
    setProfileImage,
    setBannerImage,
    transferOwnership,
    kickMember,
    approveRequest,
    rejectRequest,
  };
}
