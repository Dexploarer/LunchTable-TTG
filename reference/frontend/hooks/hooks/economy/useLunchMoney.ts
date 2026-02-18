"use client";

/**
 * LunchMoney Hook
 *
 * Unified economy dashboard data hook combining balances, listings,
 * and transaction history for the LunchMoney page.
 */

import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

// Local interfaces to avoid deep type issues
// Match the Listing interface expected by MyListings component
interface Listing {
  _id: string;
  listingType: "fixed" | "auction";
  cardDefinitionId: string;
  cardName?: string;
  cardRarity?: string;
  cardImageUrl?: string;
  quantity: number;
  price: number;
  tokenPrice?: number;
  currencyType?: "gold" | "token";
  currentBid?: number;
  bidCount?: number;
  endsAt?: number;
  createdAt: number;
}

// Raw token listing from backend before transformation
interface RawTokenListing {
  _id: string;
  cardDefinitionId: string;
  cardName: string;
  cardType: string;
  cardRarity: string;
  cardImageUrl?: string;
  quantity: number;
  tokenPrice: number;
  status: string;
  createdAt: number;
}

interface PendingPurchase {
  _id: string;
  listingId?: string;
  amount: number;
  status: string;
  createdAt: number;
  expiresAt?: number;
  transactionSignature?: string;
  listingCardName?: string;
}

interface UseLunchMoneyReturn {
  // Balances
  gold: number;
  gems: number;
  lifetimeGoldEarned: number;
  lifetimeGoldSpent: number;
  lifetimeGemsEarned: number;
  lifetimeGemsSpent: number;

  // Token
  tokenBalance: number;
  tokenBalanceStale: boolean;
  walletAddress: string | undefined;
  lastTokenUpdate: number | undefined;

  // Listings
  goldListings: Listing[];
  tokenListings: Listing[];
  pendingPurchases: PendingPurchase[];
  activeListingsCount: number;

  // Market overview
  marketOverview: {
    activeListings: number;
    totalSold: number;
    volumeToday: number;
    volumeThisWeek: number;
    goldVolumeToday: number;
    tokenVolumeToday: number;
    averageListingPrice: number;
  } | null;

  // Loading states
  isLoading: boolean;
  isTokenLoading: boolean;

  // Actions
  refreshTokenBalance: () => Promise<void>;
  cancelGoldListing: (listingId: string) => Promise<void>;
  cancelTokenListing: (listingId: string) => Promise<void>;
}

/**
 * Unified economy data for the LunchMoney dashboard.
 *
 * Combines all economy-related data into a single hook for the LunchMoney page.
 * Provides balances, active listings, market overview, and management actions.
 *
 * @example
 * ```tsx
 * const {
 *   gold,
 *   gems,
 *   tokenBalance,
 *   goldListings,
 *   tokenListings,
 *   marketOverview,
 *   isLoading,
 * } = useLunchMoney();
 *
 * return (
 *   <div>
 *     <p>Gold: {gold.toLocaleString()}</p>
 *     <p>LTCG: {tokenBalance}</p>
 *     <p>Active Listings: {goldListings.length + tokenListings.length}</p>
 *   </div>
 * );
 * ```
 */
export function useLunchMoney(): UseLunchMoneyReturn {
  const { isAuthenticated } = useAuth();

  // Balance queries
  const balance = useConvexQuery(typedApi.economy.getPlayerBalance, isAuthenticated ? {} : "skip");
  const tokenData = useConvexQuery(
    typedApi.economy.tokenBalance.getTokenBalance,
    isAuthenticated ? {} : "skip"
  );

  // Listings queries
  const goldListingsData = useConvexQuery(
    typedApi.economy.marketplace.getUserListings,
    isAuthenticated ? {} : "skip"
  );
  const tokenListingsData = useConvexQuery(
    typedApi.economy.tokenMarketplace.getUserTokenListings,
    isAuthenticated ? {} : "skip"
  );
  const pendingPurchasesData = useConvexQuery(
    typedApi.economy.tokenMarketplace.getUserPendingPurchases,
    isAuthenticated ? {} : "skip"
  );

  // Market overview
  const marketOverviewData = useConvexQuery(typedApi.economy.priceHistory.getMarketOverview, {});

  // Mutations
  const refreshBalanceMutation = useConvexMutation(
    typedApi.economy.tokenBalance.requestBalanceRefresh
  );
  const cancelGoldListingMutation = useConvexMutation(typedApi.economy.marketplace.cancelListing);
  const cancelTokenListingMutation = useConvexMutation(
    typedApi.economy.tokenMarketplace.cancelTokenListing
  );

  // Actions
  const refreshTokenBalance = async () => {
    try {
      await refreshBalanceMutation({});
      toast.success("Token balance refreshed");
    } catch (_error) {
      toast.error("Failed to refresh balance");
    }
  };

  const cancelGoldListing = async (listingId: string) => {
    try {
      await cancelGoldListingMutation({ listingId });
      toast.success("Listing cancelled");
    } catch (_error) {
      toast.error("Failed to cancel listing");
    }
  };

  const cancelTokenListing = async (listingId: string) => {
    try {
      await cancelTokenListingMutation({ listingId });
      toast.success("Token listing cancelled");
    } catch (_error) {
      toast.error("Failed to cancel listing");
    }
  };

  // Combine listings with safe defaults
  const allGoldListings: Listing[] = goldListingsData ?? [];

  // Transform raw token listings to match Listing interface
  const rawTokenListings: RawTokenListing[] =
    (tokenListingsData as RawTokenListing[] | undefined) ?? [];
  const allTokenListings: Listing[] = rawTokenListings.map((t) => ({
    _id: t._id,
    listingType: "fixed" as const,
    cardDefinitionId: t.cardDefinitionId,
    cardName: t.cardName,
    cardRarity: t.cardRarity,
    cardImageUrl: t.cardImageUrl,
    quantity: t.quantity,
    price: t.tokenPrice, // Use tokenPrice as the main price
    tokenPrice: t.tokenPrice,
    currencyType: "token" as const,
    createdAt: t.createdAt,
  }));
  const allPendingPurchases: PendingPurchase[] = pendingPurchasesData ?? [];

  // Extract nested lifetime stats from backend response
  const lifetimeStats = (balance as Record<string, unknown> | undefined)?.lifetimeStats as
    | { goldEarned: number; goldSpent: number; gemsEarned: number; gemsSpent: number }
    | undefined;

  return {
    // Balances
    gold: balance?.gold ?? 0,
    gems: balance?.gems ?? 0,
    lifetimeGoldEarned: lifetimeStats?.goldEarned ?? 0,
    lifetimeGoldSpent: lifetimeStats?.goldSpent ?? 0,
    lifetimeGemsEarned: lifetimeStats?.gemsEarned ?? 0,
    lifetimeGemsSpent: lifetimeStats?.gemsSpent ?? 0,

    // Token
    tokenBalance: tokenData?.balance ?? 0,
    tokenBalanceStale: tokenData?.isStale ?? false,
    walletAddress: tokenData?.walletAddress,
    lastTokenUpdate: tokenData?.lastVerifiedAt,

    // Listings
    goldListings: allGoldListings,
    tokenListings: allTokenListings,
    pendingPurchases: allPendingPurchases,
    activeListingsCount: allGoldListings.length + allTokenListings.length,

    // Market overview
    marketOverview: marketOverviewData ?? null,

    // Loading states
    isLoading: balance === undefined,
    isTokenLoading: tokenData === undefined,

    // Actions
    refreshTokenBalance,
    cancelGoldListing,
    cancelTokenListing,
  };
}
