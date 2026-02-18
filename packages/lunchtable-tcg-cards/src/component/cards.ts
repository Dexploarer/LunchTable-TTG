import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const cardVariantValidator = v.union(
  v.literal("standard"),
  v.literal("foil"),
  v.literal("alt_art"),
  v.literal("full_art"),
  v.literal("numbered")
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all active card definitions
 */
export const getAllCards = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("cardDefinitions")
      .withIndex("by_active_rarity", (q) => q.eq("isActive", true))
      .collect();
  },
});

/**
 * Get a single card definition by ID
 */
export const getCard = query({
  args: { cardId: v.id("cardDefinitions") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cardId);
  },
});

/**
 * Batch resolve card IDs — critical for game engine performance
 */
export const getCardsBatch = query({
  args: { cardIds: v.array(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const cards = await Promise.all(
      args.cardIds.map((id) =>
        ctx.db.get(id as Id<"cardDefinitions">)
      )
    );
    return cards.filter((c) => c !== null);
  },
});

/**
 * Get all cards owned by a user with card definition details
 */
export const getUserCards = query({
  args: { userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const playerCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Batch fetch card definitions to avoid N+1 queries
    const cardDefIds = playerCards.map((pc) => pc.cardDefinitionId);
    const cardDefs = await Promise.all(
      cardDefIds.map((id) => ctx.db.get(id))
    );
    const cardDefMap = new Map(
      cardDefs
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .map((c) => [c._id, c])
    );

    return playerCards
      .map((pc) => {
        const cardDef = cardDefMap.get(pc.cardDefinitionId);
        if (!cardDef || !cardDef.isActive) return null;

        return {
          playerCardId: pc._id.toString(),
          cardDefinitionId: pc.cardDefinitionId,
          name: cardDef.name,
          rarity: cardDef.rarity,
          archetype: cardDef.archetype,
          cardType: cardDef.cardType,
          attack: cardDef.attack,
          defense: cardDef.defense,
          cost: cardDef.cost,
          level: cardDef.level,
          attribute: cardDef.attribute,
          spellType: cardDef.spellType,
          trapType: cardDef.trapType,
          ability: cardDef.ability,
          flavorText: cardDef.flavorText,
          imageUrl: cardDef.imageUrl,
          quantity: pc.quantity,
          isFavorite: pc.isFavorite,
          variant: pc.variant,
          acquiredAt: pc.acquiredAt,
        };
      })
      .filter((c) => c !== null);
  },
});

/**
 * Get user's favorite cards
 */
export const getUserFavoriteCards = query({
  args: { userId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const favoriteCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user_favorite", (q) =>
        q.eq("userId", args.userId).eq("isFavorite", true)
      )
      .collect();

    // Batch fetch card definitions to avoid N+1 queries
    const cardDefIds = favoriteCards.map((pc) => pc.cardDefinitionId);
    const cardDefs = await Promise.all(
      cardDefIds.map((id) => ctx.db.get(id))
    );
    const cardDefMap = new Map(
      cardDefs
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .map((c) => [c._id, c])
    );

    return favoriteCards
      .map((pc) => {
        const cardDef = cardDefMap.get(pc.cardDefinitionId);
        if (!cardDef || !cardDef.isActive) return null;

        return {
          playerCardId: pc._id.toString(),
          cardDefinitionId: pc.cardDefinitionId,
          name: cardDef.name,
          rarity: cardDef.rarity,
          archetype: cardDef.archetype,
          cardType: cardDef.cardType,
          attack: cardDef.attack,
          defense: cardDef.defense,
          cost: cardDef.cost,
          level: cardDef.level,
          attribute: cardDef.attribute,
          spellType: cardDef.spellType,
          trapType: cardDef.trapType,
          ability: cardDef.ability,
          flavorText: cardDef.flavorText,
          imageUrl: cardDef.imageUrl,
          quantity: pc.quantity,
          isFavorite: pc.isFavorite,
          variant: pc.variant,
          acquiredAt: pc.acquiredAt,
        };
      })
      .filter((c) => c !== null);
  },
});

/**
 * Get collection stats for a user
 */
export const getCollectionStats = query({
  args: { userId: v.string() },
  returns: v.object({
    uniqueCards: v.number(),
    totalCards: v.number(),
    favoriteCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const playerCards = await ctx.db
      .query("playerCards")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const uniqueCards = playerCards.length;
    const totalCards = playerCards.reduce((sum, pc) => sum + pc.quantity, 0);
    const favoriteCount = playerCards.filter((pc) => pc.isFavorite).length;

    return { uniqueCards, totalCards, favoriteCount };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new card definition
 */
export const createCardDefinition = mutation({
  args: {
    name: v.string(),
    rarity: v.string(),
    archetype: v.string(),
    cardType: v.string(),
    cost: v.number(),
    attack: v.optional(v.number()),
    defense: v.optional(v.number()),
    level: v.optional(v.number()),
    attribute: v.optional(v.string()),
    spellType: v.optional(v.string()),
    trapType: v.optional(v.string()),
    ability: v.optional(v.any()),
    flavorText: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const { isActive, ...rest } = args;

    const cardId = await ctx.db.insert("cardDefinitions", {
      ...rest,
      isActive: isActive ?? true,
      createdAt: Date.now(),
    });

    return cardId as string;
  },
});

/**
 * Update an existing card definition
 */
export const updateCardDefinition = mutation({
  args: {
    cardId: v.id("cardDefinitions"),
    name: v.optional(v.string()),
    rarity: v.optional(v.string()),
    archetype: v.optional(v.string()),
    cardType: v.optional(v.string()),
    cost: v.optional(v.number()),
    attack: v.optional(v.number()),
    defense: v.optional(v.number()),
    level: v.optional(v.number()),
    attribute: v.optional(v.string()),
    spellType: v.optional(v.string()),
    trapType: v.optional(v.string()),
    ability: v.optional(v.any()),
    flavorText: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const { cardId, ...updates } = args;

    const card = await ctx.db.get(cardId);
    if (!card) {
      throw new Error("Card definition not found");
    }

    // Filter out undefined fields
    const fieldsToUpdate: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fieldsToUpdate[key] = value;
      }
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      await ctx.db.patch(cardId, fieldsToUpdate);
    }

    return { success: true };
  },
});

/**
 * Toggle isActive on a card definition
 */
export const toggleCardActive = mutation({
  args: { cardId: v.id("cardDefinitions") },
  returns: v.object({ isActive: v.boolean() }),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card) {
      throw new Error("Card definition not found");
    }

    const newIsActive = !card.isActive;
    await ctx.db.patch(args.cardId, { isActive: newIsActive });

    return { isActive: newIsActive };
  },
});

/**
 * Add cards to a player's inventory
 * For numbered variants, always create a new entry.
 * For others, upsert using by_user_card_variant index.
 */
export const addCardsToInventory = mutation({
  args: {
    userId: v.string(),
    cardDefinitionId: v.id("cardDefinitions"),
    quantity: v.number(),
    variant: v.optional(cardVariantValidator),
    source: v.optional(v.string()),
    serialNumber: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    newQuantity: v.number(),
  }),
  handler: async (ctx, args) => {
    const cardDef = await ctx.db.get(args.cardDefinitionId);
    if (!cardDef || !cardDef.isActive) {
      throw new Error("Card definition not found or inactive");
    }

    const variant = args.variant ?? "standard";
    const now = Date.now();

    // For numbered variants, always create a new entry
    if (variant === "numbered") {
      await ctx.db.insert("playerCards", {
        userId: args.userId,
        cardDefinitionId: args.cardDefinitionId,
        quantity: args.quantity,
        variant,
        serialNumber: args.serialNumber,
        isFavorite: false,
        acquiredAt: now,
        lastUpdatedAt: now,
        source: args.source,
      });
      return { success: true, newQuantity: args.quantity };
    }

    // For non-numbered variants, upsert using by_user_card_variant index
    const existing = await ctx.db
      .query("playerCards")
      .withIndex("by_user_card_variant", (q) =>
        q
          .eq("userId", args.userId)
          .eq("cardDefinitionId", args.cardDefinitionId)
          .eq("variant", variant)
      )
      .first();

    if (existing) {
      const newQuantity = existing.quantity + args.quantity;
      await ctx.db.patch(existing._id, {
        quantity: newQuantity,
        lastUpdatedAt: now,
      });
      return { success: true, newQuantity };
    }

    await ctx.db.insert("playerCards", {
      userId: args.userId,
      cardDefinitionId: args.cardDefinitionId,
      quantity: args.quantity,
      variant,
      isFavorite: false,
      acquiredAt: now,
      lastUpdatedAt: now,
      source: args.source,
    });
    return { success: true, newQuantity: args.quantity };
  },
});

/**
 * Remove cards from a player's inventory
 * Decrements quantity, deletes the record if it reaches 0.
 */
export const removeCardsFromInventory = mutation({
  args: {
    userId: v.string(),
    cardDefinitionId: v.id("cardDefinitions"),
    quantity: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    remainingQuantity: v.number(),
  }),
  handler: async (ctx, args) => {
    const playerCard = await ctx.db
      .query("playerCards")
      .withIndex("by_user_card", (q) =>
        q
          .eq("userId", args.userId)
          .eq("cardDefinitionId", args.cardDefinitionId)
      )
      .first();

    if (!playerCard) {
      throw new Error("Player does not own this card");
    }

    if (playerCard.quantity < args.quantity) {
      throw new Error("Insufficient card quantity");
    }

    const newQuantity = playerCard.quantity - args.quantity;

    if (newQuantity <= 0) {
      await ctx.db.delete(playerCard._id);
      return { success: true, remainingQuantity: 0 };
    }

    await ctx.db.patch(playerCard._id, {
      quantity: newQuantity,
      lastUpdatedAt: Date.now(),
    });

    return { success: true, remainingQuantity: newQuantity };
  },
});

/**
 * Toggle favorite status on a player card
 */
export const toggleFavorite = mutation({
  args: {
    userId: v.string(),
    playerCardId: v.id("playerCards"),
  },
  returns: v.object({ isFavorite: v.boolean() }),
  handler: async (ctx, args) => {
    const playerCard = await ctx.db.get(args.playerCardId);

    if (!playerCard || playerCard.userId !== args.userId) {
      throw new Error("Card not found or not owned by user");
    }

    const newIsFavorite = !playerCard.isFavorite;
    await ctx.db.patch(args.playerCardId, {
      isFavorite: newIsFavorite,
      lastUpdatedAt: Date.now(),
    });

    return { isFavorite: newIsFavorite };
  },
});
