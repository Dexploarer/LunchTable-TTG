/**
 * Convex Helper Utilities
 *
 * Provides type-safe helpers for Convex API access.
 * Uses TypedAPI from @ltcg/core for full type safety.
 *
 * IMPORTANT: Always use `typedApi` for all Convex queries/mutations.
 * Never use raw `api` - it lacks type safety.
 */

// Re-export Convex React hooks directly for full type inference
export { useAction, useMutation, useQuery } from "convex/react";

// Re-export types from core API types
export type {
  User,
  UserInfo,
  UserProfile,
  PlayerBalance,
  Transaction,
  TransactionHistoryResponse,
  TokenBalance,
  GameLobby,
  GameState,
  GameMode,
  CardDefinition,
  CardInstance,
  UserCard,
  UserDeck,
  CardVariant,
  BattlePassStatus,
  Notification,
  StoryChapter,
  StoryProgress,
  Difficulty,
  Tournament,
  TutorialStatus,
  UserWallet,
  CardListing,
  MarketOverview,
  Id,
} from "@ltcg/core/types";

export {
  createTypedQuery,
  createTypedMutation,
  createTypedAction,
} from "@ltcg/core/api";

/**
 * Export API with type bypass to avoid TS2589 "Type instantiation is excessively deep" errors.
 * The Convex API types are deeply nested and can exceed TypeScript's recursion limits.
 *
 * Usage pattern:
 * - Import typedApi for path references: typedApi.module.function
 * - Cast results to expected types where needed: useQuery(...) as ResultType
 * - For mutations, use the wrapper hooks or cast results
 *
 * NOTE: We import from a separate wrapper file that isolates the type evaluation.
 * This prevents the TS2589 error that occurs when TypeScript tries to evaluate
 * the deeply nested Convex API types during compilation.
 */
import { api } from "./convexApiWrapper";
export const typedApi = api;

// Legacy aliases for backward compatibility - use typedApi instead
export { useQuery as useConvexQuery } from "convex/react";
export { useMutation as useConvexMutation } from "convex/react";
export { useAction as useConvexAction } from "convex/react";
