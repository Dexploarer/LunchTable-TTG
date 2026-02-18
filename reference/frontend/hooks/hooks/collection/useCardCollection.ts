"use client";

import { calculateCollectionStats, filterCards, sortCards } from "@/lib/collectionUtils";
import type { SortOption } from "@/types";
import type { BinderTab, CardData, ViewMode } from "@/types/binder";
import type { CardType, Element, Rarity } from "@/types/cards";
import type { Id } from "@convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { useCardBinder } from "./useCardBinder";

export function useCardCollection() {
  const binder = useCardBinder();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState<BinderTab>("collection");
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<Rarity | "all">("all");
  const [selectedElement, setSelectedElement] = useState<Element | "all">("all");
  const [selectedType, setSelectedType] = useState<CardType | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("rarity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Convert API data to CardData format
  const cards: CardData[] = useMemo(() => {
    if (!binder.userCards) return [];
    return binder.userCards.map((card) => ({
      id: card.id,
      cardDefinitionId: card.cardDefinitionId,
      name: card.name,
      rarity: card.rarity as Rarity,
      element: card.element as Element,
      cardType: card.cardType as CardType,
      attack: card.attack,
      defense: card.defense,
      cost: card.cost,
      ability: card.ability,
      flavorText: card.flavorText,
      imageUrl: card.imageUrl,
      owned: card.owned,
      isFavorite: card.isFavorite,
    }));
  }, [binder.userCards]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    const filtered = filterCards(cards, {
      searchQuery,
      selectedRarity,
      selectedElement,
      selectedType,
      showFavoritesOnly,
    });

    return sortCards(filtered, {
      sortBy,
      sortOrder,
    });
  }, [
    cards,
    searchQuery,
    selectedRarity,
    selectedElement,
    selectedType,
    sortBy,
    sortOrder,
    showFavoritesOnly,
  ]);

  // Calculate stats
  const stats = useMemo(() => calculateCollectionStats(cards), [cards]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRarity("all");
    setSelectedElement("all");
    setSelectedType("all");
    setShowFavoritesOnly(false);
    setSortBy("rarity");
    setSortOrder("desc");
  };

  const hasActiveFilters = !!(
    searchQuery ||
    selectedRarity !== "all" ||
    selectedElement !== "all" ||
    selectedType !== "all" ||
    showFavoritesOnly
  );

  const toggleFavorite = async (cardId: string) => {
    try {
      await binder.toggleFavorite(cardId as Id<"playerCards">);
      if (previewCard?.id === cardId) {
        setPreviewCard((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  return {
    ...binder,

    // View state
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    previewCard,
    setPreviewCard,

    // Filter state
    searchQuery,
    setSearchQuery,
    selectedRarity,
    setSelectedRarity,
    selectedElement,
    setSelectedElement,
    selectedType,
    setSelectedType,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    showFilters,
    setShowFilters,
    showFavoritesOnly,
    setShowFavoritesOnly,

    // Derived data
    cards,
    filteredCards,
    stats,
    hasActiveFilters,

    // Handlers
    clearFilters,
    toggleFavorite,
  };
}
