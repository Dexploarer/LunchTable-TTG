import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const cardVariantValidator = v.union(
  v.literal("standard"),
  v.literal("foil"),
  v.literal("alt_art"),
  v.literal("full_art"),
  v.literal("numbered"),
  v.literal("first_edition"),
  v.literal("detention_foil"),
  v.literal("rock_bottom")
);

export default defineSchema({
  cardDefinitions: defineTable({
    name: v.string(),
    rarity: v.string(),
    archetype: v.string(),
    cardType: v.string(),
    attack: v.optional(v.number()),
    defense: v.optional(v.number()),
    cost: v.number(),
    level: v.optional(v.number()),
    attribute: v.optional(v.string()),
    spellType: v.optional(v.string()),
    trapType: v.optional(v.string()),
    viceType: v.optional(v.string()),
    breakdownEffect: v.optional(v.any()),
    breakdownFlavorText: v.optional(v.string()),
    ability: v.optional(v.any()),
    flavorText: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    thumbnailStorageId: v.optional(v.id("_storage")),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_rarity", ["rarity"])
    .index("by_archetype", ["archetype"])
    .index("by_type", ["cardType"])
    .index("by_name", ["name"])
    .index("by_active_rarity", ["isActive", "rarity"]),

  playerCards: defineTable({
    userId: v.string(),
    cardDefinitionId: v.id("cardDefinitions"),
    quantity: v.number(),
    variant: v.optional(cardVariantValidator),
    serialNumber: v.optional(v.number()),
    isFavorite: v.boolean(),
    acquiredAt: v.number(),
    lastUpdatedAt: v.number(),
    source: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_card", ["userId", "cardDefinitionId"])
    .index("by_user_card_variant", ["userId", "cardDefinitionId", "variant"])
    .index("by_user_favorite", ["userId", "isFavorite"])
    .index("by_variant", ["variant"]),

  userDecks: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    deckArchetype: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_updated", ["updatedAt"]),

  deckCards: defineTable({
    deckId: v.id("userDecks"),
    cardDefinitionId: v.id("cardDefinitions"),
    quantity: v.number(),
    position: v.optional(v.number()),
  })
    .index("by_deck", ["deckId"])
    .index("by_deck_card", ["deckId", "cardDefinitionId"]),

  starterDeckDefinitions: defineTable({
    name: v.string(),
    deckCode: v.string(),
    archetype: v.string(),
    description: v.string(),
    playstyle: v.string(),
    cardCount: v.number(),
    isAvailable: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_code", ["deckCode"])
    .index("by_available", ["isAvailable"]),

  numberedCardRegistry: defineTable({
    cardDefinitionId: v.id("cardDefinitions"),
    serialNumber: v.number(),
    maxSerial: v.number(),
    mintedAt: v.number(),
    mintedTo: v.optional(v.string()),
    mintMethod: v.string(),
    currentOwner: v.optional(v.string()),
  })
    .index("by_card", ["cardDefinitionId"])
    .index("by_card_serial", ["cardDefinitionId", "serialNumber"])
    .index("by_owner", ["currentOwner"]),
});
