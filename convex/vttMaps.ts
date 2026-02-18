import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const listMaps = query({
  args: {
    worldId: v.id("worlds"),
  },
  handler: async (ctx, args) => {
    const maps = await ctx.db
      .query("maps")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .collect();

    return maps.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const upsertToken = mutation({
  args: {
    worldId: v.id("worlds"),
    mapId: v.id("maps"),
    sessionId: v.optional(v.id("sessions")),
    tokenId: v.optional(v.id("tokens")),
    name: v.string(),
    x: v.number(),
    y: v.number(),
    layer: v.union(v.literal("ground"), v.literal("mid"), v.literal("air")),
    color: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    if (args.tokenId) {
      const existing = await ctx.db.get(args.tokenId);
      if (!existing) throw new Error("Token not found");

      await ctx.db.patch(args.tokenId, {
        name: args.name,
        x: args.x,
        y: args.y,
        layer: args.layer,
        color: args.color,
        dataJson: JSON.stringify(args.data ?? {}),
        updatedAt: now,
      });

      return { tokenId: args.tokenId, updatedBy: user._id };
    }

    const tokenId = await ctx.db.insert("tokens", {
      worldId: args.worldId,
      mapId: args.mapId,
      sessionId: args.sessionId,
      name: args.name,
      x: args.x,
      y: args.y,
      layer: args.layer,
      color: args.color,
      dataJson: JSON.stringify(args.data ?? {}),
      createdAt: now,
      updatedAt: now,
    });

    return { tokenId, updatedBy: user._id };
  },
});

export const updateFog = mutation({
  args: {
    sessionId: v.id("sessions"),
    mapId: v.id("maps"),
    fog: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("fogStates")
      .withIndex("by_session_map", (q) => q.eq("sessionId", args.sessionId).eq("mapId", args.mapId))
      .first();

    const now = Date.now();
    const fogJson = JSON.stringify(args.fog ?? {});

    if (existing) {
      await ctx.db.patch(existing._id, {
        fogJson,
        updatedBy: user._id,
        updatedAt: now,
      });
      return { fogStateId: existing._id };
    }

    const fogStateId = await ctx.db.insert("fogStates", {
      sessionId: args.sessionId,
      mapId: args.mapId,
      fogJson,
      updatedBy: user._id,
      updatedAt: now,
    });

    return { fogStateId };
  },
});

export const getSessionMapState = query({
  args: {
    sessionId: v.id("sessions"),
    mapId: v.id("maps"),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("tokens")
      .withIndex("by_map", (q) => q.eq("mapId", args.mapId))
      .collect();

    const sessionTokens = tokens
      .filter((token) => !token.sessionId || token.sessionId === args.sessionId)
      .map((token) => ({
        ...token,
        data: token.dataJson ? JSON.parse(token.dataJson) : {},
      }));

    const fog = await ctx.db
      .query("fogStates")
      .withIndex("by_session_map", (q) => q.eq("sessionId", args.sessionId).eq("mapId", args.mapId))
      .first();

    return {
      tokens: sessionTokens,
      fog: fog ? JSON.parse(fog.fogJson) : null,
      fogUpdatedAt: fog?.updatedAt ?? null,
    };
  },
});
