"use client";

import { typedApi, useConvexQuery } from "@/lib/convexHelpers";
import { useMutationWithToast } from "@/lib/useMutationWithToast";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "../auth/useConvexAuthHook";

// Module-scope references to avoid TS2589
const getMyInvitesQuery = typedApi.social.guilds.invites.getMyInvites;
const getGuildPendingInvitesQuery = typedApi.social.guilds.invites.getGuildPendingInvites;
const sendInviteMutation = typedApi.social.guilds.invites.sendInvite;
const acceptInviteMutation = typedApi.social.guilds.invites.acceptInvite;
const declineInviteMutation = typedApi.social.guilds.invites.declineInvite;
const cancelInviteMutation = typedApi.social.guilds.invites.cancelInvite;

/**
 * Hook for managing guild invites (both sent and received)
 *
 * @param guildId - Optional guild ID for owner view of pending invites
 * @returns Invite data and actions
 */
export function useGuildInvites(guildId?: Id<"guilds">) {
  const { isAuthenticated } = useAuth();

  // Queries
  const myInvites = useConvexQuery(getMyInvitesQuery, isAuthenticated ? {} : "skip");
  const guildPendingInvites = useConvexQuery(
    getGuildPendingInvitesQuery,
    guildId ? { guildId } : "skip"
  );

  // Mutations with toast handling
  const sendInviteRaw = useMutationWithToast(sendInviteMutation, {
    error: "Failed to send invite",
  });

  const acceptInvite = useMutationWithToast(acceptInviteMutation, {
    success: "Joined guild!",
    error: "Failed to accept invite",
  });

  const declineInvite = useMutationWithToast(declineInviteMutation, {
    success: "Invite declined",
    error: "Failed to decline invite",
  });

  const cancelInvite = useMutationWithToast(cancelInviteMutation, {
    success: "Invite cancelled",
    error: "Failed to cancel invite",
  });

  // Convenience wrappers
  const sendInvite = async (targetGuildId: Id<"guilds">, username: string) => {
    await sendInviteRaw({ guildId: targetGuildId, username });
    // Custom success message with username
    const { toast } = await import("sonner");
    toast.success(`Invite sent to ${username}`);
  };

  const handleAcceptInvite = (inviteId: Id<"guildInvites">) => acceptInvite({ inviteId });

  const handleDeclineInvite = (inviteId: Id<"guildInvites">) => declineInvite({ inviteId });

  const handleCancelInvite = (inviteId: Id<"guildInvites">) => cancelInvite({ inviteId });

  return {
    // Data
    myInvites: myInvites ?? [],
    guildPendingInvites: guildPendingInvites ?? [],
    hasInvites: (myInvites?.length ?? 0) > 0,
    isLoading: myInvites === undefined,
    // Actions
    sendInvite,
    acceptInvite: handleAcceptInvite,
    declineInvite: handleDeclineInvite,
    cancelInvite: handleCancelInvite,
  };
}
