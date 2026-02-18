import { v } from "convex/values";
import { literals } from "convex-helpers/validators";
import { query, mutation } from "./_generated/server.js";

// ============================================================================
// QUERIES
// ============================================================================

export const getStages = query({
  args: {
    chapterId: v.id("storyChapters"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("storyStages")
      .withIndex("by_chapter", (q) => q.eq("chapterId", args.chapterId))
      .collect();
  },
});

export const getStage = query({
  args: {
    stageId: v.id("storyStages"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.stageId);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const createStage = mutation({
  args: {
    chapterId: v.id("storyChapters"),
    stageNumber: v.number(),
    name: v.optional(v.string()),
    title: v.optional(v.string()),
    description: v.string(),
    opponentName: v.optional(v.string()),
    opponentDeckId: v.optional(v.string()),
    opponentDeckArchetype: v.optional(v.string()),
    difficulty: v.optional(literals("easy", "medium", "hard", "boss")),
    aiDifficulty: v.optional(literals("easy", "medium", "hard", "boss")),
    preMatchDialogue: v.optional(
      v.array(v.object({ speaker: v.string(), text: v.string(), imageUrl: v.optional(v.string()) }))
    ),
    postMatchWinDialogue: v.optional(
      v.array(v.object({ speaker: v.string(), text: v.string() }))
    ),
    postMatchLoseDialogue: v.optional(
      v.array(v.object({ speaker: v.string(), text: v.string() }))
    ),
    rewardGold: v.optional(v.number()),
    rewardXp: v.optional(v.number()),
    firstClearBonus: v.optional(
      v.union(
        v.object({
          gold: v.optional(v.number()),
          xp: v.optional(v.number()),
          gems: v.optional(v.number()),
        }),
        v.number()
      )
    ),
    firstClearGold: v.optional(v.number()),
    repeatGold: v.optional(v.number()),
    firstClearGems: v.optional(v.number()),
    cardRewardId: v.optional(v.string()),
    status: v.optional(literals("draft", "published")),
  },
  returns: v.id("storyStages"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("storyStages", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStage = mutation({
  args: {
    stageId: v.id("storyStages"),
    updates: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.stageId, {
      ...args.updates,
      updatedAt: now,
    });
    return null;
  },
});
