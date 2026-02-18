"use client";

import { typedApi, useQuery } from "@/lib/convexHelpers";
import { handleHookError } from "@/lib/errorHandling";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

// Module-scope references to avoid TS2589
const getMyGuildQuery = typedApi.social.guilds.core.getMyGuild;
const hasGuildQuery = typedApi.social.guilds.core.hasGuild;
const leaveGuildMutationRef = typedApi.social.guilds.members.leaveGuild;

/**
 * Hook for getting the current user's guild membership
 *
 * @returns Guild data if user is in a guild, null otherwise
 */
export function useMyGuild() {
  const { isAuthenticated } = useAuth();

  const myGuild = useQuery(getMyGuildQuery, isAuthenticated ? {} : "skip");
  const hasGuild = useQuery(hasGuildQuery, isAuthenticated ? {} : "skip");

  // Mutations
  const leaveGuildMutation = useMutation(leaveGuildMutationRef);

  // Actions
  const leaveGuild = async () => {
    if (!myGuild?._id) {
      toast.error("Not in a guild");
      return;
    }
    try {
      await leaveGuildMutation({ guildId: myGuild._id });
      toast.success("Left guild");
    } catch (error) {
      const message = handleHookError(error, "Failed to leave guild");
      toast.error(message);
      throw error;
    }
  };

  return {
    guild: myGuild ?? null,
    hasGuild: hasGuild ?? false,
    isLoading: myGuild === undefined,
    isOwner: myGuild?.myRole === "owner",
    isMember: myGuild !== null && myGuild !== undefined,
    myRole: myGuild?.myRole ?? null,
    leaveGuild,
  };
}
