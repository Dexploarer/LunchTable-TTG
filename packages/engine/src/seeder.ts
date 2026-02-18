import type { CardDefinition, CardType, Rarity, Attribute, SpellType, TrapType } from "./types/index.js";
import { parseCSVAbilities } from "./effectParser.js";

/**
 * Shape matching the Convex cardDefinitions table.
 * This is a plain object — no Convex runtime dependency.
 */
export interface ConvexCardRow {
  name: string;
  rarity: string;
  archetype: string;
  cardType: string;
  attack?: number;
  defense?: number;
  cost: number;
  level?: number;
  attribute?: string;
  spellType?: string;
  trapType?: string;
  viceType?: string;
  breakdownEffect?: unknown;
  breakdownFlavorText?: string;
  ability?: unknown;
  flavorText?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: number;
}

/**
 * Convert a Convex cardDefinitions row back to engine CardDefinition.
 * Inverse of toConvexCardRows. Accepts the _id from Convex as the `id` field.
 */
export function fromConvexCardRow(row: ConvexCardRow & { _id: string }): CardDefinition {
  return {
    id: row._id,
    name: row.name,
    type: row.cardType as CardType,
    description: row.flavorText ?? row.name,
    rarity: row.rarity as Rarity,
    attack: row.attack,
    defense: row.defense,
    level: row.level,
    attribute: row.attribute as Attribute | undefined,
    archetype: row.archetype,
    spellType: row.spellType as SpellType | undefined,
    trapType: row.trapType as TrapType | undefined,
    effects: parseCSVAbilities(row.ability),
    viceType: row.viceType,
    flavorText: row.flavorText,
    imageUrl: row.imageUrl,
    cost: row.cost,
  };
}

/**
 * Build a cardLookup map from Convex cardDefinitions rows.
 * Keys are Convex _id strings, values are engine CardDefinition objects.
 */
export function buildCardLookup(rows: Array<ConvexCardRow & { _id: string }>): Record<string, CardDefinition> {
  const lookup: Record<string, CardDefinition> = {};
  for (const row of rows) {
    lookup[row._id] = fromConvexCardRow(row);
  }
  return lookup;
}

/**
 * Convert engine CardDefinition[] to Convex cardDefinitions row format.
 * Pure mapping function — does not touch the database.
 */
export function toConvexCardRows(cards: CardDefinition[]): ConvexCardRow[] {
  const now = Date.now();
  return cards.map((card) => ({
    name: card.name,
    rarity: card.rarity,
    archetype: card.archetype ?? "",
    cardType: card.type,
    attack: card.type === "stereotype" ? card.attack : undefined,
    defense: card.type === "stereotype" ? card.defense : undefined,
    cost: card.cost ?? 0,
    level: card.level,
    attribute: card.attribute,
    spellType: card.spellType,
    trapType: card.trapType,
    viceType: card.viceType,
    ability: card.effects,
    flavorText: card.flavorText,
    imageUrl: card.imageUrl,
    isActive: true,
    createdAt: now,
  }));
}
