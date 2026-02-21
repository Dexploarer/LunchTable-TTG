"use client";

import { useCurrency, useMarketplace, useProfile, useShop } from "@/hooks";
import type { Rarity } from "@/types/cards";
import type {
  CurrencyType,
  ListingType,
  MarketListing,
  ShopItem,
  ShopTab,
  SortOption,
  TokenListing,
} from "@/types/shop";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";

export function useShopInteraction() {
  const { profile: currentUser } = useProfile();
  const { gold, gems } = useCurrency();
  const marketplace = useMarketplace();
  const shop = useShop();

  const [activeTab, setActiveTab] = useState<ShopTab>("shop");
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ListingType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyType>("gold");
  const [isProcessing, setIsProcessing] = useState(false);

  // Listing related state
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [selectedShopItem, setSelectedShopItem] = useState<ShopItem | null>(null);
  const [selectedTokenListing, setSelectedTokenListing] = useState<TokenListing | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [isCardSelectorOpen, setIsCardSelectorOpen] = useState(false);
  const [listingCurrencyType, setListingCurrencyType] = useState<CurrencyType>("gold");

  const [listingDialogCard, setListingDialogCard] = useState<{
    cardDefinitionId: Id<"cardDefinitions">;
    name: string;
    rarity: Rarity;
  } | null>(null);

  const [tokenListingCard, setTokenListingCard] = useState<{
    _id: Id<"playerCards">;
    name: string;
    imageUrl?: string;
    rarity: Rarity;
    quantity: number;
  } | null>(null);

  // Queries
  const userCards = useQuery(api.core.cards.getUserCards, currentUser ? {} : "skip");
  const tokenListingsQuery = useQuery(
    api.economy.tokenMarketplace.getTokenListings,
    currencyFilter === "token" && activeTab === "marketplace" ? {} : "skip"
  );

  // Mutations
  const createListingMutation = useMutation(api.economy.marketplace.createListing);

  // Filter marketplace listings (gold)
  const filteredGoldListings = useMemo(() => {
    if (currencyFilter !== "gold") return [];
    let listings = marketplace.listings?.listings ?? [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      listings = listings.filter((listing: MarketListing) =>
        listing.cardName.toLowerCase().includes(query)
      );
    }

    if (rarityFilter !== "all") {
      listings = listings.filter((listing: MarketListing) => listing.cardRarity === rarityFilter);
    }

    if (typeFilter !== "all") {
      listings = listings.filter((listing: MarketListing) => listing.listingType === typeFilter);
    }

    const sorted = [...listings];
    sorted.sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return b.createdAt - a.createdAt;
    });

    return sorted;
  }, [searchQuery, marketplace.listings, currencyFilter, rarityFilter, typeFilter, sortBy]);

  // Filter token listings
  const filteredTokenListings = useMemo((): TokenListing[] => {
    if (currencyFilter !== "token") return [];
    let listings = (tokenListingsQuery?.listings ?? []) as TokenListing[];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      listings = listings.filter((listing) => listing.cardName.toLowerCase().includes(query));
    }

    if (rarityFilter !== "all") {
      listings = listings.filter((listing) => listing.cardRarity === rarityFilter);
    }

    const sorted = [...listings];
    sorted.sort((a, b) => {
      if (sortBy === "price_asc") return a.tokenPrice - b.tokenPrice;
      if (sortBy === "price_desc") return b.tokenPrice - a.tokenPrice;
      return b.createdAt - a.createdAt;
    });

    return sorted;
  }, [searchQuery, tokenListingsQuery, currencyFilter, rarityFilter, sortBy]);

  // Transform shop items
  const transformedShopItems = useMemo(() => {
    if (!shop.products) return [];
    return shop.products.map(
      (product): ShopItem => ({
        ...product,
        id: product.productId,
        type: product.productType,
        contents: product.packConfig
          ? `${product.packConfig.cardCount} Cards`
          : product.boxConfig
            ? `${product.boxConfig.packCount} Packs`
            : undefined,
        quantity: product.currencyConfig?.amount,
      })
    );
  }, [shop.products]);

  const packItems = useMemo(
    () => transformedShopItems.filter((item) => item.type === "pack"),
    [transformedShopItems]
  );
  const boxItems = useMemo(
    () => transformedShopItems.filter((item) => item.type === "box"),
    [transformedShopItems]
  );
  const currencyItems = useMemo(
    () => transformedShopItems.filter((item) => item.type === "currency"),
    [transformedShopItems]
  );

  // Handlers
  const handleShopPurchase = useCallback(
    async (item: ShopItem, useGems: boolean) => {
      setIsProcessing(true);
      try {
        let result: unknown;
        if (item.productType === "pack") {
          result = await shop.purchasePack(item.productId, useGems);
        } else if (item.productType === "box") {
          result = await shop.purchaseBox(item.productId, useGems);
        } else if (item.productType === "currency") {
          await shop.purchaseBundle(item.productId);
        }

        if (result && (item.productType === "pack" || item.productType === "box")) {
          const cardsData = encodeURIComponent(JSON.stringify(result));
          window.location.href = `/shop/open?type=${item.productType}&data=${cardsData}`;
        }
        setSelectedShopItem(null);
      } catch (error) {
        console.error("Purchase failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [shop]
  );

  const handleMarketPurchase = useCallback(
    async (listingId: string) => {
      setIsProcessing(true);
      try {
        await marketplace.buyNow(listingId as Id<"marketplaceListings">);
        setSelectedListing(null);
      } catch (error) {
        console.error("Purchase failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [marketplace]
  );

  const handlePlaceBid = useCallback(
    async (listingId: string) => {
      if (!bidAmount) return;
      setIsProcessing(true);
      try {
        await marketplace.placeBid(
          listingId as Id<"marketplaceListings">,
          Number.parseInt(bidAmount)
        );
        setBidAmount("");
        setSelectedListing(null);
      } catch (error) {
        console.error("Bid failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [bidAmount, marketplace]
  );

  const handleCreateListing = useCallback(
    async (listingType: ListingType, price: number, duration?: number) => {
      if (!listingDialogCard) return;
      setIsProcessing(true);
      try {
        await createListingMutation({
          cardDefinitionId: listingDialogCard.cardDefinitionId,
          quantity: 1,
          listingType,
          price,
          duration,
        });
        setListingDialogCard(null);
      } catch (error) {
        console.error("Create listing failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [listingDialogCard, createListingMutation]
  );

  const handleCancelListing = useCallback(
    async (listingId: Id<"marketplaceListings">) => {
      setIsProcessing(true);
      try {
        await marketplace.cancelListing(listingId);
      } catch (error) {
        console.error("Cancel failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [marketplace]
  );

  return {
    // Balances
    gold,
    gems,

    // Config
    currentUser,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    rarityFilter,
    setRarityFilter,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    currencyFilter,
    setCurrencyFilter,
    isProcessing,

    // Selection state
    selectedListing,
    setSelectedListing,
    selectedShopItem,
    setSelectedShopItem,
    selectedTokenListing,
    setSelectedTokenListing,
    bidAmount,
    setBidAmount,
    isCardSelectorOpen,
    setIsCardSelectorOpen,
    listingCurrencyType,
    setListingCurrencyType,
    listingDialogCard,
    setListingDialogCard,
    tokenListingCard,
    setTokenListingCard,

    // Derived data
    packItems,
    boxItems,
    currencyItems,
    filteredGoldListings,
    filteredTokenListings,
    myListings: marketplace.myListings,
    userCards,

    // Handlers
    handleShopPurchase,
    handleMarketPurchase,
    handlePlaceBid,
    handleCreateListing,
    handleCancelListing,
  };
}
