"use client";

import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { handleHookError } from "@/lib/errorHandling";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

/** Token decimal places for LTCG token */
const TOKEN_DECIMALS = 6;

interface UseTokenBalanceReturn {
  /** Token balance in human-readable format (e.g., 100.5) */
  balance: number | null;
  /** Raw balance in smallest units (lamports equivalent) */
  rawBalance: number | null;
  /** When balance was last verified from Solana */
  lastVerifiedAt: Date | null;
  /** True if balance is older than 60 seconds (from server) */
  isStale: boolean;
  /** Initial loading state */
  isLoading: boolean;
  /** Refresh operation in progress */
  isRefreshing: boolean;
  /** Trigger balance refresh from Solana RPC */
  refresh: () => Promise<void>;
  /** Format balance with specified decimal places (default 2) */
  formatBalance: (decimals?: number) => string;
}

/**
 * Token balance management for LTCG tokens on Solana.
 *
 * Provides access to the player's cached token balance from Convex and
 * functionality to refresh the balance from Solana RPC. Balance is cached
 * server-side and updated periodically or on-demand.
 *
 * The Convex API returns balance already in raw units (smallest denomination).
 * This hook converts to human-readable format by dividing by 10^TOKEN_DECIMALS.
 *
 * Features:
 * - View current token balance (human-readable and raw)
 * - Stale indicator when balance is older than 60 seconds
 * - Manual refresh capability with rate limiting
 * - Formatting helpers for display
 *
 * @example
 * ```typescript
 * const {
 *   balance,
 *   isStale,
 *   isLoading,
 *   isRefreshing,
 *   refresh,
 *   formatBalance
 * } = useTokenBalance();
 *
 * // Display formatted balance
 * console.log(`Balance: ${formatBalance(2)} LTCG`);
 *
 * // Show stale indicator
 * if (isStale) {
 *   console.log("Balance may be outdated");
 * }
 *
 * // Manual refresh
 * await refresh();
 * ```
 *
 * @returns Token balance state and actions
 *
 * @throws When user is not authenticated
 */
export function useTokenBalance(): UseTokenBalanceReturn {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query cached balance from Convex
  // Only query when explicitly authenticated (not during initial auth check) to avoid "Authentication required" errors
  // Returns: { balance, lastVerifiedAt, isStale } | null
  const cachedBalance = useConvexQuery(
    typedApi.economy.tokenBalance.getTokenBalance,
    isAuthenticated === true && !authLoading ? {} : "skip"
  );

  // Mutation to request balance refresh
  const requestRefresh = useConvexMutation(typedApi.economy.tokenBalance.requestBalanceRefresh);

  // The API returns balance in raw units - convert to human-readable
  const rawBalance = cachedBalance?.balance ?? null;

  const balance = useMemo(() => {
    if (rawBalance == null) return null;
    return rawBalance / 10 ** TOKEN_DECIMALS;
  }, [rawBalance]);

  // Parse last verified timestamp
  const lastVerifiedAt = useMemo(() => {
    if (!cachedBalance?.lastVerifiedAt) return null;
    return new Date(cachedBalance.lastVerifiedAt);
  }, [cachedBalance?.lastVerifiedAt]);

  // Server already calculates staleness, but we expose it directly
  const isStale = cachedBalance?.isStale ?? false;

  // Refresh action
  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }

    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      await requestRefresh({});
      toast.success("Balance refreshed");
    } catch (error) {
      const message = handleHookError(error, "Failed to refresh balance");
      // Check for rate limit error
      if (message.toLowerCase().includes("rate limit")) {
        toast.error("Please wait before refreshing again");
      } else {
        toast.error(message);
      }
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthenticated, isRefreshing, requestRefresh]);

  // Format balance with specified decimals
  const formatBalance = useCallback(
    (decimals = 2) => {
      if (balance == null) return "0.00";
      return balance.toFixed(decimals);
    },
    [balance]
  );

  return {
    balance,
    rawBalance,
    lastVerifiedAt,
    isStale,
    isLoading: cachedBalance === undefined,
    isRefreshing,
    refresh,
    formatBalance,
  };
}
