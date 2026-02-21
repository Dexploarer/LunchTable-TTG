"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useAuth } from "../auth/useConvexAuthHook";

interface UseCurrencyReturn {
  balance: ReturnType<typeof useQuery<typeof api.economy.economy.getPlayerBalance>> | undefined;
  transactions:
    | ReturnType<typeof useQuery<typeof api.economy.economy.getTransactionHistory>>
    | undefined;
  isLoading: boolean;
  gold: number;
  gems: number;
}

/**
 * Player currency management for gold and gems.
 *
 * Provides read-only access to player's current balance and transaction history.
 * Currency is modified through shop purchases, quest rewards, and game rewards.
 * This hook only displays the current state.
 *
 * Features:
 * - View current gold and gem balance
 * - Access transaction history
 * - Separate gold/gems display values
 *
 * @example
 * ```typescript
 * const {
 *   balance,
 *   transactions,
 *   gold,
 *   gems,
 *   isLoading
 * } = useCurrency();
 *
 * // Display balance
 * console.log(`Gold: ${gold}, Gems: ${gems}`);
 *
 * // Show transaction history
 * transactions?.forEach(tx => {
 *   console.log(`${tx.amount} ${tx.currency} - ${tx.reason}`);
 * });
 * ```
 *
 * @returns {UseCurrencyReturn} Currency interface with balance and transactions
 *
 * @throws {Error} When user is not authenticated
 */
export function useCurrency(): UseCurrencyReturn {
  const { isAuthenticated } = useAuth();

  // Queries
  const balance = useQuery(api.economy.economy.getPlayerBalance, isAuthenticated ? {} : "skip");

  const transactions = useQuery(
    api.economy.economy.getTransactionHistory,
    isAuthenticated ? {} : "skip"
  );

  return {
    balance,
    transactions,
    isLoading: balance === undefined,
    gold: balance?.gold || 0,
    gems: balance?.gems || 0,
  };
}
