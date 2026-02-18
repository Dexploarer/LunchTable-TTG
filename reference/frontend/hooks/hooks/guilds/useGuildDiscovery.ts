"use client";

import { typedApi, useQuery } from "@/lib/convexHelpers";
import { useMutationWithToast } from "@/lib/useMutationWithToast";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";

// Module-scope references to avoid TS2589
// Module-scope references to avoid TS2589
const getFeaturedGuildsQuery = typedApi.social.guilds.discovery.getFeaturedGuilds;
const searchGuildsQuery = typedApi.social.guilds.discovery.searchGuilds;
const getPublicGuildsQuery = typedApi.social.guilds.discovery.getPublicGuilds;
const joinPublicGuildMutation = typedApi.social.guilds.members.joinPublicGuild;
const requestToJoinMutation = typedApi.social.guilds.requests.requestToJoin;

/**
 * Hook for discovering and joining guilds
 */
export function useGuildDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"members" | "recent" | "name">("members");

  // Queries
  const featuredGuilds = useQuery(getFeaturedGuildsQuery, { limit: 6 });
  const searchResults = useQuery(
    searchGuildsQuery,
    searchQuery.length >= 2 ? { query: searchQuery, limit: 20 } : "skip"
  );
  const publicGuilds = useQuery(getPublicGuildsQuery, { limit: 20, sortBy });

  // Mutations with toast handling
  const joinPublicGuild = useMutationWithToast(joinPublicGuildMutation, {
    success: "Joined guild!",
    error: "Failed to join guild",
  });

  const requestToJoin = useMutationWithToast(requestToJoinMutation, {
    success: "Join request sent!",
    error: "Failed to send join request",
  });

  // Actions
  const search = (query: string) => setSearchQuery(query);
  const clearSearch = () => setSearchQuery("");

  // Convenience wrappers
  const handleJoinPublicGuild = (guildId: Id<"guilds">) => joinPublicGuild({ guildId });
  const handleRequestToJoin = (guildId: Id<"guilds">, message?: string) =>
    requestToJoin({ guildId, message });

  return {
    // Data
    featuredGuilds: featuredGuilds ?? [],
    searchResults: searchResults ?? [],
    publicGuilds: publicGuilds?.guilds ?? [],
    totalGuilds: publicGuilds?.total ?? 0,
    hasMoreGuilds: publicGuilds?.hasMore ?? false,
    // State
    searchQuery,
    sortBy,
    isLoading: featuredGuilds === undefined,
    isSearching: searchQuery.length >= 2 && searchResults === undefined,
    // Actions
    search,
    clearSearch,
    setSortBy,
    joinPublicGuild: handleJoinPublicGuild,
    requestToJoin: handleRequestToJoin,
  };
}
