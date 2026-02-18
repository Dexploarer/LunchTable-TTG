import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { evaluateModerationText } from "./vttModeration";

export const publishWorld = mutation({
  args: {
    worldId: v.id("worlds"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error("World not found");
    if (world.ownerUserId !== user._id) throw new Error("Forbidden");

    const versionId = world.latestVersionId;
    if (!versionId) throw new Error("World has no version snapshot to publish");

    const title = args.title ?? world.name;
    const description = args.description ?? world.tagline;
    const tags = args.tags ?? [world.genre, world.mood];

    const moderation = evaluateModerationText(`${title}\n${description}\n${tags.join(" ")}`);
    await ctx.db.insert("moderationEvents", {
      targetType: "publishListing",
      targetId: world._id,
      status: moderation.status,
      reason: moderation.reason,
      createdAt: Date.now(),
    });

    const now = Date.now();
    const listingId = await ctx.db.insert("publishListings", {
      worldId: world._id,
      worldVersionId: versionId,
      ownerUserId: user._id,
      title,
      description,
      tags,
      moderationStatus: moderation.status,
      isVisible: moderation.status === "approved",
      rating: 0,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(world._id, {
      isPublished: moderation.status === "approved",
      visibility: moderation.status === "approved" ? "public" : world.visibility,
      updatedAt: now,
    });

    return {
      listingId,
      moderationStatus: moderation.status,
      visible: moderation.status === "approved",
    };
  },
});

export const listPublishedWorlds = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("publishListings")
      .withIndex("by_visibility", (q) => q.eq("isVisible", true))
      .collect();

    return listings.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
