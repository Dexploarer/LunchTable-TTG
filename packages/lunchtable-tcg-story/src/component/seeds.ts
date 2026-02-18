import { v } from "convex/values";
import { mutation } from "./_generated/server.js";

// ============================================================================
// SEED DATA MUTATIONS
// ============================================================================

export const seedChapters = mutation({
  args: {
    chapters: v.array(v.any()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let insertedCount = 0;

    for (const chapter of args.chapters) {
      const existing = await ctx.db
        .query("storyChapters")
        .withIndex("by_act_chapter", (q) =>
          q
            .eq("actNumber", chapter.actNumber)
            .eq("chapterNumber", chapter.chapterNumber)
        )
        .first();

      if (!existing) {
        const now = Date.now();
        await ctx.db.insert("storyChapters", {
          ...chapter,
          createdAt: chapter.createdAt ?? now,
          updatedAt: chapter.updatedAt ?? now,
        });
        insertedCount++;
      }
    }

    return insertedCount;
  },
});

export const seedStages = mutation({
  args: {
    stages: v.array(v.any()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let insertedCount = 0;

    for (const stage of args.stages) {
      const existing = await ctx.db
        .query("storyStages")
        .withIndex("by_chapter", (q) => q.eq("chapterId", stage.chapterId))
        .filter((q) => q.eq(q.field("stageNumber"), stage.stageNumber))
        .first();

      if (!existing) {
        const now = Date.now();
        await ctx.db.insert("storyStages", {
          ...stage,
          createdAt: stage.createdAt ?? now,
          updatedAt: stage.updatedAt ?? now,
        });
        insertedCount++;
      }
    }

    return insertedCount;
  },
});
