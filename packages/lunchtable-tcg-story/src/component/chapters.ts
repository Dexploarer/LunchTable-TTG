import { v } from "convex/values";
import { literals } from "convex-helpers/validators";
import { query, mutation } from "./_generated/server.js";

// ============================================================================
// QUERIES
// ============================================================================

export const getChapters = query({
  args: {
    actNumber: v.optional(v.number()),
    status: v.optional(literals("draft", "published")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (args.actNumber !== undefined && args.status !== undefined) {
      return await ctx.db
        .query("storyChapters")
        .withIndex("by_act_chapter", (q) => q.eq("actNumber", args.actNumber))
        .filter((q) => q.eq(q.field("status"), args.status))
        .collect();
    }
    if (args.actNumber !== undefined) {
      return await ctx.db
        .query("storyChapters")
        .withIndex("by_act_chapter", (q) => q.eq("actNumber", args.actNumber))
        .collect();
    }
    if (args.status !== undefined) {
      return await ctx.db
        .query("storyChapters")
        .withIndex("by_status", (q) => q.eq("status", args.status))
        .collect();
    }
    return await ctx.db.query("storyChapters").collect();
  },
});

export const getChapter = query({
  args: {
    chapterId: v.id("storyChapters"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chapterId);
  },
});

export const getChapterByNumber = query({
  args: {
    actNumber: v.number(),
    chapterNumber: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyChapters")
      .withIndex("by_act_chapter", (q) =>
        q.eq("actNumber", args.actNumber).eq("chapterNumber", args.chapterNumber)
      )
      .first();
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const createChapter = mutation({
  args: {
    number: v.optional(v.number()),
    actNumber: v.optional(v.number()),
    chapterNumber: v.optional(v.number()),
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    archetype: v.optional(v.string()),
    storyText: v.optional(v.string()),
    aiOpponentDeckCode: v.optional(v.string()),
    aiDifficulty: v.optional(
      v.union(
        v.literal("easy"),
        v.literal("medium"),
        v.literal("hard"),
        v.literal("boss"),
        v.object({
          normal: v.number(),
          hard: v.number(),
          legendary: v.number(),
        })
      )
    ),
    battleCount: v.optional(v.number()),
    archetypeImageUrl: v.optional(v.string()),
    baseRewards: v.optional(
      v.object({
        gold: v.number(),
        xp: v.number(),
        gems: v.optional(v.number()),
      })
    ),
    unlockCondition: v.optional(
      v.object({
        type: literals("chapter_complete", "player_level", "none"),
        requiredChapterId: v.optional(v.string()),
        requiredLevel: v.optional(v.number()),
      })
    ),
    loreText: v.optional(v.string()),
    unlockRequirements: v.optional(
      v.object({
        previousChapter: v.optional(v.boolean()),
        minimumLevel: v.optional(v.number()),
      })
    ),
    isActive: v.optional(v.boolean()),
    status: v.optional(literals("draft", "published")),
  },
  returns: v.id("storyChapters"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("storyChapters", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateChapter = mutation({
  args: {
    chapterId: v.id("storyChapters"),
    updates: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.chapterId, {
      ...args.updates,
      updatedAt: now,
    });
    return null;
  },
});
