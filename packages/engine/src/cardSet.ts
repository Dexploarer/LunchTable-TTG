import type { CardDefinition } from "./types/index.js";
import { defineCards } from "./cards.js";
import type { CardLookup } from "./cards.js";

export interface CardSetInput {
  id: string;
  name: string;
  description?: string;
  cards: CardDefinition[];
}

export interface CardSet {
  id: string;
  name: string;
  description?: string;
  cardCount: number;
  lookup: CardLookup;
}

/**
 * Define a card set with metadata and validation.
 * All cards in the set are validated via defineCards.
 */
export function defineCardSet(input: CardSetInput): CardSet {
  const lookup = defineCards(input.cards);
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    cardCount: input.cards.length,
    lookup,
  };
}

/**
 * Merge multiple card sets into a single CardLookup.
 * Throws on duplicate card IDs across sets.
 */
export function mergeCardSets(sets: CardSet[]): CardLookup {
  const merged: CardLookup = {};
  for (const set of sets) {
    for (const [id, card] of Object.entries(set.lookup)) {
      if (merged[id]) {
        throw new Error(`Duplicate card ID "${id}" found when merging sets "${set.id}"`);
      }
      merged[id] = card;
    }
  }
  return merged;
}
