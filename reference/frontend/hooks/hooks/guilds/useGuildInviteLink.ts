"use client";

import { typedApi, useConvexQuery } from "@/lib/convexHelpers";
import { useMutationWithToast } from "@/lib/useMutationWithToast";
import { useAuth } from "../auth/useConvexAuthHook";

// Module-scope references to avoid TS2589 (typedApi is pre-cast to any)
const inviteLinksApi = typedApi.social.guilds.inviteLinks;
const getMyGuildInviteLinkQuery = inviteLinksApi.getMyGuildInviteLink;
const getGuildByInviteCodeQuery = inviteLinksApi.getGuildByInviteCode;
const generateInviteLinkMutation = inviteLinksApi.generateInviteLink;
const joinViaInviteLinkMutation = inviteLinksApi.joinViaInviteLink;

/**
 * Hook for managing guild invite links (shareable links).
 * Used by guild members to generate and share invite links.
 */
export function useGuildInviteLink() {
  const { isAuthenticated } = useAuth();

  // Get user's current active invite link
  const myInviteLink = useConvexQuery(getMyGuildInviteLinkQuery, isAuthenticated ? {} : "skip");

  // Mutations
  const generateLink = useMutationWithToast(generateInviteLinkMutation, {
    error: "Failed to generate invite link",
  });

  const joinViaLink = useMutationWithToast(joinViaInviteLinkMutation, {
    success: "Joined guild!",
    error: "Failed to join guild",
  });

  return {
    myInviteLink,
    isLoading: myInviteLink === undefined && isAuthenticated,
    generateLink,
    joinViaLink,
  };
}

/**
 * Hook for the invite landing page to preview a guild by invite code.
 * Works for both authenticated and unauthenticated users.
 */
export function useGuildInvitePreview(code: string) {
  const guildPreview = useConvexQuery(getGuildByInviteCodeQuery, code ? { code } : "skip");

  return {
    guildPreview,
    isLoading: guildPreview === undefined,
    isNotFound: guildPreview === null,
  };
}
