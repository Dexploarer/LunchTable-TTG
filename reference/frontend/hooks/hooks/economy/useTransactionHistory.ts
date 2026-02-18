"use client";

/**
 * Transaction History Hook
 *
 * Paginated transaction history for gold/gems and tokens.
 */

import { typedApi } from "@/lib/convexHelpers";
import type { TransactionFilter } from "@/types/economy";
import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { useAuth } from "../auth/useConvexAuthHook";

interface Transaction {
  _id: string;
  transactionType: string;
  currencyType?: string;
  amount: number;
  balanceAfter?: number;
  description?: string;
  createdAt: number;
}

interface TokenTransaction {
  _id: string;
  transactionType: string;
  amount: number;
  signature?: string;
  status: string;
  description?: string;
  createdAt: number;
  confirmedAt?: number;
}

interface UseTransactionHistoryReturn {
  // Gold/Gems transactions
  transactions: Transaction[];
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;

  // Token transactions
  tokenTransactions: TokenTransaction[];
  tokenHasMore: boolean;
  loadMoreTokens: () => void;
  isTokenLoading: boolean;

  // All transactions combined (sorted by date)
  allTransactions: Array<Transaction | TokenTransaction>;

  // Filter
  filter: TransactionFilter;
  setFilter: (filter: TransactionFilter) => void;
}

/**
 * Paginated transaction history for all currency types.
 *
 * Supports filtering by currency type and loading more transactions.
 *
 * @example
 * ```tsx
 * const {
 *   transactions,
 *   tokenTransactions,
 *   hasMore,
 *   loadMore,
 *   filter,
 *   setFilter,
 * } = useTransactionHistory();
 *
 * return (
 *   <div>
 *     <select value={filter} onChange={(e) => setFilter(e.target.value)}>
 *       <option value="all">All</option>
 *       <option value="gold">Gold</option>
 *       <option value="token">Token</option>
 *     </select>
 *     {transactions.map(tx => (
 *       <div key={tx._id}>{tx.amount} - {tx.description}</div>
 *     ))}
 *     {hasMore && <button onClick={loadMore}>Load More</button>}
 *   </div>
 * );
 * ```
 */
export function useTransactionHistory(): UseTransactionHistoryReturn {
  const { isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<TransactionFilter>("all");

  // Gold/Gems transactions with pagination
  const {
    results: transactions,
    status,
    loadMore,
  } = usePaginatedQuery(
    typedApi.economy.getTransactionHistoryPaginated,
    isAuthenticated ? {} : "skip",
    { initialNumItems: 20 }
  );

  // Token transactions - using Convex pagination
  const {
    results: tokenTransactions,
    status: tokenStatus,
    loadMore: loadMoreTokens,
  } = usePaginatedQuery(
    typedApi.economy.tokenMarketplace.getTokenTransactionHistory,
    isAuthenticated ? {} : "skip",
    { initialNumItems: 20 }
  );

  // Filter transactions based on selected filter
  const filteredTransactions = (transactions ?? []).filter((tx: Transaction) => {
    if (filter === "all" || filter === "token") return true;
    return tx.currencyType === filter;
  });

  const filteredTokenTx = filter === "all" || filter === "token" ? (tokenTransactions ?? []) : [];

  // Combine and sort all transactions by date
  const allTransactions = [...filteredTransactions, ...filteredTokenTx].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return {
    // Gold/Gems
    transactions: filteredTransactions,
    hasMore: status === "CanLoadMore",
    loadMore: () => loadMore(20),
    isLoading: status === "LoadingFirstPage",

    // Token
    tokenTransactions: filteredTokenTx,
    tokenHasMore: tokenStatus === "CanLoadMore",
    loadMoreTokens: () => loadMoreTokens(20),
    isTokenLoading: tokenStatus === "LoadingFirstPage",

    // Combined
    allTransactions,

    // Filter
    filter,
    setFilter,
  };
}
