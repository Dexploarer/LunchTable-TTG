import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all active decks for a user with card counts.
 */
export const getUserDecks = query({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      deckId: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      deckArchetype: v.optional(v.string()),
      cardCount: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const decks = await ctx.db
      .query("userDecks")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    const decksWithCounts = await Promise.all(
      decks.map(async (deck) => {
        const deckCards = await ctx.db
          .query("deckCards")
          .withIndex("by_deck", (q) => q.eq("deckId", deck._id))
          .collect();

        const cardCount = deckCards.reduce((sum, dc) => sum + dc.quantity, 0);

        return {
          deckId: deck._id as string,
          name: deck.name,
          description: deck.description,
          deckArchetype: deck.deckArchetype,
          cardCount,
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
        };
      })
    );

    return decksWithCounts.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Get a specific deck with all its cards and full card definitions.
 */
export const getDeckWithCards = query({
  args: { deckId: v.id("userDecks") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck || !deck.isActive) {
      throw new Error("Deck not found");
    }

    const deckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    // Batch fetch all card definitions
    const cardDefs = await Promise.all(
      deckCards.map((dc) => ctx.db.get(dc.cardDefinitionId))
    );

    const cards = deckCards
      .map((dc, index) => {
        const cardDef = cardDefs[index];
        if (!cardDef || !cardDef.isActive) return null;

        return {
          cardDefinitionId: dc.cardDefinitionId as string,
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
          quantity: dc.quantity,
          position: dc.position,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    return {
      deckId: deck._id as string,
      name: deck.name,
      description: deck.description,
      deckArchetype: deck.deckArchetype,
      cards,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
    };
  },
});

/**
 * Get statistical breakdown of a deck.
 */
export const getDeckStats = query({
  args: { deckId: v.id("userDecks") },
  returns: v.object({
    totalCards: v.number(),
    cardsByType: v.object({
      stereotype: v.number(),
      spell: v.number(),
      trap: v.number(),
      class: v.number(),
    }),
    cardsByRarity: v.object({
      common: v.number(),
      uncommon: v.number(),
      rare: v.number(),
      epic: v.number(),
      legendary: v.number(),
    }),
    averageCost: v.number(),
  }),
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck || !deck.isActive) {
      throw new Error("Deck not found");
    }

    const deckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    const cardsByType = { stereotype: 0, spell: 0, trap: 0, class: 0 };
    const cardsByRarity = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    let totalCards = 0;
    let totalCost = 0;

    // Batch fetch all card definitions
    const cardDefs = await Promise.all(
      deckCards.map((dc) => ctx.db.get(dc.cardDefinitionId))
    );

    for (let i = 0; i < deckCards.length; i++) {
      const dc = deckCards[i]!;
      const cardDef = cardDefs[i];
      if (!cardDef || !cardDef.isActive) continue;

      const qty = dc.quantity;
      totalCards += qty;
      totalCost += cardDef.cost * qty;

      // Count by type
      if (cardDef.cardType === "stereotype") cardsByType.stereotype += qty;
      else if (cardDef.cardType === "spell") cardsByType.spell += qty;
      else if (cardDef.cardType === "trap") cardsByType.trap += qty;
      else if (cardDef.cardType === "class") cardsByType.class += qty;

      // Count by rarity
      const rarity = cardDef.rarity as keyof typeof cardsByRarity;
      if (rarity in cardsByRarity) {
        cardsByRarity[rarity] += qty;
      }
    }

    return {
      totalCards,
      cardsByType,
      cardsByRarity,
      averageCost: totalCards > 0 ? totalCost / totalCards : 0,
    };
  },
});

/**
 * Validate a deck against game rules.
 */
export const validateDeck = query({
  args: {
    deckId: v.id("userDecks"),
    minSize: v.optional(v.number()),
    maxSize: v.optional(v.number()),
    maxCopies: v.optional(v.number()),
    maxLegendaryCopies: v.optional(v.number()),
  },
  returns: v.object({
    isValid: v.boolean(),
    errors: v.array(v.string()),
    warnings: v.array(v.string()),
    totalCards: v.number(),
  }),
  handler: async (ctx, args) => {
    const minSize = args.minSize ?? 30;
    const maxSize = args.maxSize ?? 60;
    const maxCopies = args.maxCopies ?? 3;
    const maxLegendaryCopies = args.maxLegendaryCopies ?? 1;

    const deck = await ctx.db.get(args.deckId);
    if (!deck || !deck.isActive) {
      throw new Error("Deck not found");
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    const deckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    // Batch fetch all card definitions
    const cardDefs = await Promise.all(
      deckCards.map((dc) => ctx.db.get(dc.cardDefinitionId))
    );

    let totalCards = 0;

    for (let i = 0; i < deckCards.length; i++) {
      const dc = deckCards[i]!;
      const cardDef = cardDefs[i];

      if (!cardDef || !cardDef.isActive) {
        errors.push(`Invalid card in deck: ${dc.cardDefinitionId}`);
        continue;
      }

      totalCards += dc.quantity;

      // Check legendary copy limit
      if (cardDef.rarity === "legendary" && dc.quantity > maxLegendaryCopies) {
        errors.push(
          `${cardDef.name}: Legendary cards limited to ${maxLegendaryCopies} copy`
        );
      } else if (dc.quantity > maxCopies) {
        errors.push(
          `${cardDef.name}: Limited to ${maxCopies} copies per deck`
        );
      }
    }

    // Check deck size
    if (totalCards < minSize) {
      errors.push(
        `Deck needs at least ${minSize} cards. Currently has ${totalCards}.`
      );
    }
    if (totalCards > maxSize) {
      errors.push(
        `Deck cannot exceed ${maxSize} cards. Currently has ${totalCards}.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalCards,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new empty deck.
 */
export const createDeck = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    deckArchetype: v.optional(v.string()),
    maxDecks: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const maxDecks = args.maxDecks ?? 50;

    // Validate name length
    const trimmedName = args.name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) {
      throw new Error("Deck name must be between 1 and 50 characters");
    }

    // Check deck limit
    const existingDecks = await ctx.db
      .query("userDecks")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    if (existingDecks.length >= maxDecks) {
      throw new Error(`Cannot exceed ${maxDecks} decks per user`);
    }

    const now = Date.now();
    const deckId = await ctx.db.insert("userDecks", {
      userId: args.userId,
      name: trimmedName,
      description: args.description,
      deckArchetype: args.deckArchetype,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return deckId as string;
  },
});

/**
 * Save or update a deck's card list.
 * Validates ownership, card copy limits, and replaces all existing cards.
 */
export const saveDeck = mutation({
  args: {
    deckId: v.id("userDecks"),
    cards: v.array(
      v.object({
        cardDefinitionId: v.id("cardDefinitions"),
        quantity: v.number(),
      })
    ),
    minSize: v.optional(v.number()),
    maxSize: v.optional(v.number()),
    maxCopies: v.optional(v.number()),
    maxLegendaryCopies: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const minSize = args.minSize ?? 30;
    const maxSize = args.maxSize ?? 60;
    const maxCopies = args.maxCopies ?? 3;
    const maxLegendaryCopies = args.maxLegendaryCopies ?? 1;

    // Get the deck
    const deck = await ctx.db.get(args.deckId);
    if (!deck || !deck.isActive) {
      throw new Error("Deck not found");
    }

    // Calculate total cards
    const totalCards = args.cards.reduce((sum, c) => sum + c.quantity, 0);

    // Validate deck size
    if (totalCards < minSize) {
      throw new Error(
        `Deck needs at least ${minSize} cards. Currently has ${totalCards}.`
      );
    }
    if (totalCards > maxSize) {
      throw new Error(
        `Deck cannot exceed ${maxSize} cards. Currently has ${totalCards}.`
      );
    }

    // Validate each card exists, user owns enough, and copy limits
    for (const card of args.cards) {
      const cardDef = await ctx.db.get(card.cardDefinitionId);
      if (!cardDef || !cardDef.isActive) {
        throw new Error(`Invalid card: ${card.cardDefinitionId}`);
      }

      // Check copy limits
      if (cardDef.rarity === "legendary" && card.quantity > maxLegendaryCopies) {
        throw new Error(
          `${cardDef.name}: Legendary cards limited to ${maxLegendaryCopies} copy`
        );
      }
      if (card.quantity > maxCopies) {
        throw new Error(
          `${cardDef.name}: Limited to ${maxCopies} copies per deck`
        );
      }

      // Check ownership
      const playerCard = await ctx.db
        .query("playerCards")
        .withIndex("by_user_card", (q) =>
          q
            .eq("userId", deck.userId)
            .eq("cardDefinitionId", card.cardDefinitionId)
        )
        .first();

      if (!playerCard || playerCard.quantity < card.quantity) {
        throw new Error(
          `You need ${card.quantity} copies of "${cardDef.name}" but only own ${playerCard?.quantity ?? 0}`
        );
      }
    }

    // Delete all existing deckCards for this deck
    const existingDeckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    await Promise.all(existingDeckCards.map((dc) => ctx.db.delete(dc._id)));

    // Insert new deck cards
    await Promise.all(
      args.cards.map((card) =>
        ctx.db.insert("deckCards", {
          deckId: args.deckId,
          cardDefinitionId: card.cardDefinitionId,
          quantity: card.quantity,
          position: undefined,
        })
      )
    );

    // Update deck timestamp
    await ctx.db.patch(args.deckId, {
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Rename a deck.
 */
export const renameDeck = mutation({
  args: {
    deckId: v.id("userDecks"),
    name: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const trimmedName = args.name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) {
      throw new Error("Deck name must be between 1 and 50 characters");
    }

    const deck = await ctx.db.get(args.deckId);
    if (!deck || !deck.isActive) {
      throw new Error("Deck not found");
    }

    await ctx.db.patch(args.deckId, {
      name: trimmedName,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a deck (soft delete by setting isActive=false).
 */
export const deleteDeck = mutation({
  args: {
    deckId: v.id("userDecks"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) {
      throw new Error("Deck not found");
    }

    await ctx.db.patch(args.deckId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Duplicate an existing deck with all its cards.
 */
export const duplicateDeck = mutation({
  args: {
    deckId: v.id("userDecks"),
    name: v.string(),
    maxDecks: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const maxDecks = args.maxDecks ?? 50;

    // Verify source deck exists and is active
    const sourceDeck = await ctx.db.get(args.deckId);
    if (!sourceDeck || !sourceDeck.isActive) {
      throw new Error("Source deck not found or inactive");
    }

    // Validate name
    const trimmedName = args.name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) {
      throw new Error("Deck name must be between 1 and 50 characters");
    }

    // Check deck limit
    const existingDecks = await ctx.db
      .query("userDecks")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", sourceDeck.userId).eq("isActive", true)
      )
      .collect();

    if (existingDecks.length >= maxDecks) {
      throw new Error(`Cannot exceed ${maxDecks} decks per user`);
    }

    const now = Date.now();

    // Create new deck
    const newDeckId = await ctx.db.insert("userDecks", {
      userId: sourceDeck.userId,
      name: trimmedName,
      description: sourceDeck.description,
      deckArchetype: sourceDeck.deckArchetype,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Copy all cards from source deck
    const sourceDeckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    for (const sourceCard of sourceDeckCards) {
      await ctx.db.insert("deckCards", {
        deckId: newDeckId,
        cardDefinitionId: sourceCard.cardDefinitionId,
        quantity: sourceCard.quantity,
        position: sourceCard.position,
      });
    }

    return newDeckId as string;
  },
});

/**
 * Set a deck as the active deck for matchmaking.
 * Validates the deck belongs to user and passes validation rules.
 * Returns deckId as string (main app uses this to set users.activeDeckId).
 */
export const setActiveDeck = mutation({
  args: {
    userId: v.string(),
    deckId: v.id("userDecks"),
    minSize: v.optional(v.number()),
    maxSize: v.optional(v.number()),
    maxCopies: v.optional(v.number()),
    maxLegendaryCopies: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const minSize = args.minSize ?? 30;
    const maxSize = args.maxSize ?? 60;
    const maxCopies = args.maxCopies ?? 3;
    const maxLegendaryCopies = args.maxLegendaryCopies ?? 1;

    // Get the deck
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== args.userId || !deck.isActive) {
      throw new Error("Deck not found or not owned by user");
    }

    // Validate deck
    const deckCards = await ctx.db
      .query("deckCards")
      .withIndex("by_deck", (q) => q.eq("deckId", args.deckId))
      .collect();

    const totalCards = deckCards.reduce((sum, dc) => sum + dc.quantity, 0);

    if (totalCards < minSize) {
      throw new Error(
        `Deck must have at least ${minSize} cards to be set as active. Currently has ${totalCards}.`
      );
    }
    if (totalCards > maxSize) {
      throw new Error(
        `Deck cannot exceed ${maxSize} cards. Currently has ${totalCards}.`
      );
    }

    // Validate card copy limits
    const cardDefs = await Promise.all(
      deckCards.map((dc) => ctx.db.get(dc.cardDefinitionId))
    );

    for (let i = 0; i < deckCards.length; i++) {
      const dc = deckCards[i]!;
      const cardDef = cardDefs[i];

      if (!cardDef || !cardDef.isActive) {
        throw new Error("Deck contains invalid cards");
      }

      if (cardDef.rarity === "legendary" && dc.quantity > maxLegendaryCopies) {
        throw new Error(
          `${cardDef.name}: Legendary cards limited to ${maxLegendaryCopies} copy`
        );
      }
      if (dc.quantity > maxCopies) {
        throw new Error(
          `${cardDef.name}: Limited to ${maxCopies} copies per deck`
        );
      }
    }

    return args.deckId as string;
  },
});

/**
 * Select and claim a starter deck.
 * Looks up the starter deck definition by deckCode, creates card definitions
 * if needed, adds cards to the player's inventory with rarity-based quantities,
 * and creates a new deck with all the cards.
 */
export const selectStarterDeck = mutation({
  args: {
    userId: v.string(),
    deckCode: v.string(),
    starterCards: v.array(
      v.object({
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
        ability: v.optional(v.any()),
        flavorText: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    deckId: v.string(),
    cardsReceived: v.number(),
    deckSize: v.number(),
  }),
  handler: async (ctx, args) => {
    // Look up starter deck definition by deckCode
    const starterDeckDef = await ctx.db
      .query("starterDeckDefinitions")
      .withIndex("by_code", (q) => q.eq("deckCode", args.deckCode))
      .first();

    if (!starterDeckDef) {
      throw new Error(`Starter deck not found: ${args.deckCode}`);
    }

    const now = Date.now();

    // Rarity-based quantity mapping
    const rarityQuantities: Record<string, number> = {
      common: 4,
      uncommon: 3,
      rare: 2,
      epic: 1,
      legendary: 1,
    };

    // Track unique cards for the deck (by name to deduplicate)
    const deckCardEntries: Array<{
      cardDefinitionId: string;
      quantity: number;
    }> = [];
    let totalCardsReceived = 0;

    for (const starterCard of args.starterCards) {
      // Find or create the card definition by name
      let cardDef = await ctx.db
        .query("cardDefinitions")
        .withIndex("by_name", (q) => q.eq("name", starterCard.name))
        .first();

      if (!cardDef) {
        // Create new card definition
        const cardDefId = await ctx.db.insert("cardDefinitions", {
          name: starterCard.name,
          rarity: starterCard.rarity,
          archetype: starterCard.archetype,
          cardType: starterCard.cardType,
          attack: starterCard.attack,
          defense: starterCard.defense,
          cost: starterCard.cost,
          level: starterCard.level,
          attribute: starterCard.attribute,
          spellType: starterCard.spellType,
          trapType: starterCard.trapType,
          ability: starterCard.ability,
          flavorText: starterCard.flavorText,
          imageUrl: starterCard.imageUrl,
          isActive: true,
          createdAt: now,
        });
        cardDef = await ctx.db.get(cardDefId);
        if (!cardDef) {
          throw new Error(`Failed to create card definition: ${starterCard.name}`);
        }
      }

      // Determine quantity based on rarity
      const qty = rarityQuantities[starterCard.rarity] ?? 1;

      // Add to player's inventory
      const existingPlayerCard = await ctx.db
        .query("playerCards")
        .withIndex("by_user_card", (q) =>
          q.eq("userId", args.userId).eq("cardDefinitionId", cardDef!._id)
        )
        .first();

      if (existingPlayerCard) {
        await ctx.db.patch(existingPlayerCard._id, {
          quantity: existingPlayerCard.quantity + qty,
          lastUpdatedAt: now,
        });
      } else {
        await ctx.db.insert("playerCards", {
          userId: args.userId,
          cardDefinitionId: cardDef._id,
          quantity: qty,
          isFavorite: false,
          acquiredAt: now,
          lastUpdatedAt: now,
        });
      }

      totalCardsReceived += qty;

      // Track for deck creation (1 copy per unique card in the deck)
      deckCardEntries.push({
        cardDefinitionId: cardDef._id as string,
        quantity: 1,
      });
    }

    // Create the deck
    const deckId = await ctx.db.insert("userDecks", {
      userId: args.userId,
      name: starterDeckDef.name,
      description: starterDeckDef.description,
      deckArchetype: starterDeckDef.archetype,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Aggregate deck cards by cardDefinitionId (in case duplicates in starterCards)
    const deckCardMap = new Map<string, number>();
    for (const entry of deckCardEntries) {
      const existing = deckCardMap.get(entry.cardDefinitionId) ?? 0;
      deckCardMap.set(entry.cardDefinitionId, existing + entry.quantity);
    }

    // Insert deck cards
    let deckSize = 0;
    for (const [cardDefIdStr, quantity] of deckCardMap.entries()) {
      await ctx.db.insert("deckCards", {
        deckId,
        cardDefinitionId: cardDefIdStr as any,
        quantity,
        position: undefined,
      });
      deckSize += quantity;
    }

    return {
      deckId: deckId as string,
      cardsReceived: totalCardsReceived,
      deckSize,
    };
  },
});
