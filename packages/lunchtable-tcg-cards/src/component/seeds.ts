import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedCardDefinitions = mutation({
  args: {
    cards: v.array(
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
        viceType: v.optional(v.string()),
        breakdownEffect: v.optional(v.any()),
        breakdownFlavorText: v.optional(v.string()),
        ability: v.optional(v.any()),
        flavorText: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    let created = 0;
    let skipped = 0;

    for (const card of args.cards) {
      const existing = await ctx.db
        .query("cardDefinitions")
        .withIndex("by_name", (q) => q.eq("name", card.name))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("cardDefinitions", {
        ...card,
        isActive: true,
        createdAt: Date.now(),
      });
      created++;
    }

    return { created, skipped };
  },
});

export const seedStarterDecks = mutation({
  args: {
    decks: v.array(
      v.object({
        name: v.string(),
        deckCode: v.string(),
        archetype: v.string(),
        description: v.string(),
        playstyle: v.string(),
        cardCount: v.number(),
      })
    ),
  },
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    let created = 0;
    let skipped = 0;

    for (const deck of args.decks) {
      const existing = await ctx.db
        .query("starterDeckDefinitions")
        .withIndex("by_code", (q) => q.eq("deckCode", deck.deckCode))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("starterDeckDefinitions", {
        ...deck,
        isAvailable: true,
        createdAt: Date.now(),
      });
      created++;
    }

    return { created, skipped };
  },
});
