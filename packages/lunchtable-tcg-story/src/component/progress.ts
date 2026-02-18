import { v } from "convex/values";
import { literals } from "convex-helpers/validators";
import { query, mutation } from "./_generated/server.js";

// ============================================================================
// QUERIES
// ============================================================================

export const getProgress = query({
  args: {
    userId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getChapterProgress = query({
  args: {
    userId: v.string(),
    actNumber: v.number(),
    chapterNumber: v.number(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyProgress")
      .withIndex("by_user_chapter", (q) =>
        q
          .eq("userId", args.userId)
          .eq("actNumber", args.actNumber)
          .eq("chapterNumber", args.chapterNumber)
      )
      .first();
  },
});

export const getBattleAttempts = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("storyBattleAttempts")
      .withIndex("by_user_time", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

export const getStageProgress = query({
  args: {
    userId: v.string(),
    stageId: v.optional(v.id("storyStages")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    if (args.stageId !== undefined) {
      return await ctx.db
        .query("storyStageProgress")
        .withIndex("by_user_stage", (q) =>
          q.eq("userId", args.userId).eq("stageId", args.stageId!)
        )
        .first();
    }
    return await ctx.db
      .query("storyStageProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const upsertProgress = mutation({
  args: {
    userId: v.string(),
    actNumber: v.number(),
    chapterNumber: v.number(),
    difficulty: literals("normal", "hard", "legendary"),
    status: literals("locked", "available", "in_progress", "completed"),
    starsEarned: v.number(),
    bestScore: v.optional(v.number()),
    timesAttempted: v.number(),
    timesCompleted: v.number(),
    firstCompletedAt: v.optional(v.number()),
    lastAttemptedAt: v.optional(v.number()),
  },
  returns: v.id("storyProgress"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("storyProgress")
      .withIndex("by_user_chapter", (q) =>
        q
          .eq("userId", args.userId)
          .eq("actNumber", args.actNumber)
          .eq("chapterNumber", args.chapterNumber)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("storyProgress", args);
  },
});

export const recordBattleAttempt = mutation({
  args: {
    userId: v.string(),
    progressId: v.id("storyProgress"),
    actNumber: v.number(),
    chapterNumber: v.number(),
    difficulty: literals("normal", "hard", "legendary"),
    outcome: literals("won", "lost", "abandoned"),
    starsEarned: v.number(),
    finalLP: v.number(),
    rewardsEarned: v.object({
      gold: v.number(),
      xp: v.number(),
      cards: v.optional(v.array(v.string())),
    }),
  },
  returns: v.id("storyBattleAttempts"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("storyBattleAttempts", {
      ...args,
      attemptedAt: now,
    });
  },
});

export const upsertStageProgress = mutation({
  args: {
    userId: v.string(),
    stageId: v.id("storyStages"),
    chapterId: v.id("storyChapters"),
    stageNumber: v.number(),
    status: literals("locked", "available", "completed", "starred"),
    starsEarned: v.number(),
    bestScore: v.optional(v.number()),
    timesCompleted: v.number(),
    firstClearClaimed: v.boolean(),
    lastCompletedAt: v.optional(v.number()),
  },
  returns: v.id("storyStageProgress"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("storyStageProgress")
      .withIndex("by_user_stage", (q) =>
        q.eq("userId", args.userId).eq("stageId", args.stageId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("storyStageProgress", args);
  },
});
