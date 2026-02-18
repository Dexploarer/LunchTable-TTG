import type { CardDefinition } from "./types/index.js";
import { defineCards } from "./cards.js";
import type { CardLookup } from "./cards.js";

/**
 * Load and validate cards from a plain object array.
 * This is the primary entry point for white-label operators
 * who define cards as JSON or TypeScript arrays.
 */
export function loadCardsFromArray(cards: CardDefinition[]): CardLookup {
  return defineCards(cards);
}

/**
 * Load and validate cards from a JSON string.
 * Parses the string, validates the structure, then delegates to defineCards.
 */
export function loadCardsFromJSON(json: string): CardLookup {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error("Card JSON must be an array of CardDefinition objects");
  }
  return defineCards(parsed as CardDefinition[]);
}
