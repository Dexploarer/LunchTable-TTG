import { getAbilityDisplayText } from "@/lib/cardHelpers";
import type { SortOption } from "@/types";
import type { CardData } from "@/types/binder";
import type { CardType, Element, Rarity } from "@/types/cards";

export const RARITY_ORDER: Record<string, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

export interface CardFilters {
  searchQuery?: string;
  selectedRarity?: Rarity | "all";
  selectedElement?: Element | "all";
  selectedType?: CardType | "all";
  showFavoritesOnly?: boolean;
}

export interface CardSortOptions {
  sortBy: SortOption;
  sortOrder: "asc" | "desc";
}

/**
 * Filter a collection of cards based on standard criteria
 */
export function filterCards(cards: CardData[], filters: CardFilters): CardData[] {
  const {
    searchQuery,
    selectedRarity = "all",
    selectedElement = "all",
    selectedType = "all",
    showFavoritesOnly = false,
  } = filters;

  let filtered = [...cards];

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (card) =>
        card.name.toLowerCase().includes(query) ||
        getAbilityDisplayText(card.ability)?.toLowerCase().includes(query) ||
        card.flavorText?.toLowerCase().includes(query)
    );
  }

  if (selectedRarity !== "all") {
    filtered = filtered.filter((card) => card.rarity === selectedRarity);
  }

  if (selectedElement !== "all") {
    filtered = filtered.filter((card) => card.element === selectedElement);
  }

  if (selectedType !== "all") {
    filtered = filtered.filter((card) => card.cardType === selectedType);
  }

  if (showFavoritesOnly) {
    filtered = filtered.filter((card) => card.isFavorite);
  }

  return filtered;
}

/**
 * Sort a collection of cards
 */
export function sortCards(cards: CardData[], options: CardSortOptions): CardData[] {
  const { sortBy, sortOrder } = options;
  const sorted = [...cards];

  sorted.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "rarity":
        comparison = (RARITY_ORDER[a.rarity] || 0) - (RARITY_ORDER[b.rarity] || 0);
        break;
      case "element":
        comparison = a.element.localeCompare(b.element);
        break;
      case "attack":
        comparison = (a.attack ?? 0) - (b.attack ?? 0);
        break;
      case "defense":
        comparison = (a.defense ?? 0) - (b.defense ?? 0);
        break;
      case "cost":
        comparison = a.cost - b.cost;
        break;
      case "owned":
        comparison = a.owned - b.owned;
        break;
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  return sorted;
}

/**
 * Calculate statistics for a collection of cards
 */
export function calculateCollectionStats(cards: CardData[]) {
  const uniqueCards = cards.length;
  const totalCards = cards.reduce((sum, c) => sum + (c.owned || 0), 0);
  const favoriteCount = cards.filter((c) => c.isFavorite).length;

  const byRarity: Record<Rarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };

  const byElement: Record<Element, number> = {
    red: 0,
    blue: 0,
    yellow: 0,
    purple: 0,
    green: 0,
    white: 0,
  };

  for (const card of cards) {
    if (card.rarity in byRarity) byRarity[card.rarity]++;
    if (card.element in byElement) byElement[card.element]++;
  }

  return { uniqueCards, totalCards, favoriteCount, byRarity, byElement };
}
