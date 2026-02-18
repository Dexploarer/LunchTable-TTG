import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const listDiscoveryWorlds = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const listings = await ctx.db
      .query("publishListings")
      .withIndex("by_visibility", (q) => q.eq("isVisible", true))
      .collect();

    const search = args.search?.trim().toLowerCase();

    return listings
      .filter((listing) => {
        if (!search) return true;
        return (
          listing.title.toLowerCase().includes(search) ||
          listing.description.toLowerCase().includes(search) ||
          listing.tags.some((tag) => tag.toLowerCase().includes(search))
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const listLfgPosts = query({
  args: {
    status: v.optional(v.union(v.literal("open"), v.literal("filled"), v.literal("closed"))),
  },
  handler: async (ctx, args) => {
    const status = args.status ?? "open";
    const posts = await ctx.db
      .query("lfgPosts")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();

    return posts.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const createLfgPost = mutation({
  args: {
    worldId: v.id("worlds"),
    sessionId: v.optional(v.id("sessions")),
    title: v.string(),
    description: v.string(),
    seatsOpen: v.number(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    const lfgPostId = await ctx.db.insert("lfgPosts", {
      worldId: args.worldId,
      sessionId: args.sessionId,
      hostUserId: user._id,
      title: args.title,
      description: args.description,
      seatsOpen: Math.max(0, Math.min(7, args.seatsOpen)),
      status: "open",
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });

    return { lfgPostId };
  },
});
