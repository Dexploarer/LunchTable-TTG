"use client";

import { typedApi } from "@/lib/convexHelpers";
import type { Id } from "@convex/_generated/dataModel";
// Import inferred types from validators - single source of truth
import type { FullUser, UserInfo } from "@convex/lib/returnValidators";
import { useQuery } from "convex/react";

import { useAuth } from "../auth/useConvexAuthHook";

// Module-scope references to avoid TS2589
const currentUserQuery = typedApi.core.users.currentUser;
const getUserQuery = typedApi.core.users.getUser;

/**
 * Type-safe profile with optional stats fields
 * Types are inferred from Convex validators for full type safety
 */
export type ProfileWithStats = (FullUser | UserInfo) & {
  xp?: number;
  level?: number;
  totalWins?: number;
  totalLosses?: number;
  rankedElo?: number;
  casualRating?: number;
  activeDeckId?: string;
};

/**
 * User profile data retrieval for current user or other players.
 *
 * Provides access to user profile information including stats, level, badges,
 * and deck information. Can fetch either the current user's profile or another
 * player's profile by ID. Automatically determines if viewing own profile.
 *
 * Features:
 * - Get current user profile (when no userId provided)
 * - Get other user profiles (when userId provided)
 * - Determine if viewing own profile
 * - Type-safe profile data (avoids TypeScript depth issues)
 *
 * @example
 * ```typescript
 * // Current user's profile
 * const { profile, isCurrentUser } = useProfile();
 *
 * console.log(`Level ${profile?.level}`);
 * console.log(`Username: ${profile?.username}`);
 *
 * // Other user's profile
 * const { profile: otherProfile } = useProfile(userId);
 *
 * console.log(`Viewing ${otherProfile?.username}`);
 * console.log(`Ranked Rating: ${otherProfile?.rankedRating}`);
 * ```
 *
 * @param userId - Optional user ID to fetch specific user's profile
 *
 * @returns Profile data with loading state and current user check
 *
 * @throws {Error} When user is not authenticated
 */
export function useProfile(userId?: Id<"users">) {
  const { isAuthenticated } = useAuth();

  const currentUser = useQuery(currentUserQuery, isAuthenticated ? {} : "skip");

  const otherUser = useQuery(getUserQuery, userId ? { userId } : "skip");

  // Profile type is inferred from validators via query return types
  const profile: FullUser | UserInfo | null | undefined = userId ? otherUser : currentUser;

  return {
    profile: profile ?? undefined,
    isLoading: profile === undefined,
    isCurrentUser: !userId || (currentUser ? userId === currentUser._id : false),
  };
}
