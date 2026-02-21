"use client";

import { handleHookError } from "@/lib/errorHandling";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

interface BuyNowResult {
  success: boolean;
  price: number;
  platformFee: number;
  totalCost: number;
}

interface UseMarketplaceReturn {
  listings:
    | ReturnType<typeof useQuery<typeof api.economy.marketplace.getMarketplaceListings>>
    | undefined;
  myListings:
    | ReturnType<typeof useQuery<typeof api.economy.marketplace.getUserListings>>
    | undefined;
  isLoading: boolean;
  createListing: (params: {
    cardDefinitionId: Id<"cardDefinitions">;
    quantity: number;
    listingType: "fixed" | "auction";
    price: number;
    duration?: number;
  }) => Promise<Id<"marketplaceListings">>;
  cancelListing: (listingId: Id<"marketplaceListings">) => Promise<void>;
  buyNow: (listingId: Id<"marketplaceListings">) => Promise<BuyNowResult>;
  placeBid: (listingId: Id<"marketplaceListings">, bidAmount: number) => Promise<void>;
  claimAuction: (listingId: Id<"marketplaceListings">) => Promise<void>;
}

/**
 * Player-to-player marketplace for buying and selling cards.
 *
 * Provides complete marketplace functionality including fixed-price listings
 * and auction-style bidding. Players can list their cards for sale and browse
 * other players' listings. All operations show toast notifications.
 *
 * Features:
 * - Browse all marketplace listings
 * - Create fixed-price or auction listings
 * - Cancel your own listings
 * - Buy cards instantly (fixed-price)
 * - Place bids on auctions
 * - Claim won auctions
 * - View your active listings
 *
 * @example
 * ```typescript
 * const {
 *   listings,
 *   myListings,
 *   createListing,
 *   buyNow,
 *   placeBid
 * } = useMarketplace();
 *
 * // Create a fixed-price listing
 * await createListing({
 *   cardDefinitionId: cardId,
 *   quantity: 1,
 *   listingType: "fixed",
 *   price: 100
 * });
 *
 * // Create an auction
 * await createListing({
 *   cardDefinitionId: cardId,
 *   quantity: 1,
 *   listingType: "auction",
 *   price: 50, // Starting bid
 *   duration: 24 // hours
 * });
 *
 * // Buy instantly
 * await buyNow(listingId);
 *
 * // Place bid
 * await placeBid(listingId, 75);
 * ```
 *
 * @returns {UseMarketplaceReturn} Marketplace interface
 *
 * @throws {Error} When user is not authenticated or insufficient funds
 */
export function useMarketplace(): UseMarketplaceReturn {
  const { isAuthenticated } = useAuth();

  // Queries
  const listings = useQuery(api.economy.marketplace.getMarketplaceListings, {});

  const myListings = useQuery(
    api.economy.marketplace.getUserListings,
    isAuthenticated ? {} : "skip"
  );

  // Mutations
  const createListingMutation = useMutation(api.economy.marketplace.createListing);
  const cancelListingMutation = useMutation(api.economy.marketplace.cancelListing);
  const buyNowMutation = useMutation(api.economy.marketplace.buyNow);
  const placeBidMutation = useMutation(api.economy.marketplace.placeBid);
  const claimAuctionMutation = useMutation(api.economy.marketplace.claimAuctionWin);

  // Actions
  const createListing = async (params: {
    cardDefinitionId: Id<"cardDefinitions">;
    quantity: number;
    listingType: "fixed" | "auction";
    price: number;
    duration?: number;
  }) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const result = await createListingMutation({ ...params });
      toast.success("Listing created");
      return result.listingId;
    } catch (error) {
      const message = handleHookError(error, "Failed to create listing");
      toast.error(message);
      throw error;
    }
  };

  const cancelListing = async (listingId: Id<"marketplaceListings">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await cancelListingMutation({ listingId });
      toast.success("Listing cancelled");
    } catch (error) {
      const message = handleHookError(error, "Failed to cancel listing");
      toast.error(message);
      throw error;
    }
  };

  const buyNow = async (listingId: Id<"marketplaceListings">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const result = await buyNowMutation({ listingId });
      toast.success(`Purchased for ${result.price} gold`);
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to purchase");
      toast.error(message);
      throw error;
    }
  };

  const placeBid = async (listingId: Id<"marketplaceListings">, bidAmount: number) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await placeBidMutation({ listingId, bidAmount });
      toast.success(`Bid placed: ${bidAmount} gold`);
    } catch (error) {
      const message = handleHookError(error, "Failed to place bid");
      toast.error(message);
      throw error;
    }
  };

  const claimAuction = async (listingId: Id<"marketplaceListings">) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      await claimAuctionMutation({ listingId });
      toast.success("Auction won! Cards added to your collection");
    } catch (error) {
      const message = handleHookError(error, "Failed to claim auction");
      toast.error(message);
      throw error;
    }
  };

  return {
    listings,
    myListings,
    isLoading: listings === undefined,
    createListing,
    cancelListing,
    buyNow,
    placeBid,
    claimAuction,
  };
}
