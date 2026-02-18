import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getOptionalUser, requireUser } from "./auth";

async function getSessionParticipant(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
  userId: Id<"users">,
) {
  const participants = await ctx.db
    .query("sessionParticipants")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();

  return participants.find((participant) => participant.userId === userId) ?? null;
}

export const listMaps = query({
  args: {
    worldId: v.id("worlds"),
    sessionId: v.optional(v.id("sessions")),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) return [];

    if (world.visibility === "private") {
      const viewer = await getOptionalUser(ctx);
      if (!viewer) return [];
      if (world.ownerUserId !== viewer._id) {
        if (!args.sessionId) return [];
        const session = await ctx.db.get(args.sessionId);
        if (!session || session.worldId !== world._id) return [];
        const participant = await getSessionParticipant(ctx, session._id, viewer._id);
        if (!participant) return [];
      }
    }

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

    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error("World not found");
    const map = await ctx.db.get(args.mapId);
    if (!map) throw new Error("Map not found");
    if (map.worldId !== world._id) throw new Error("Map does not belong to world");

    if (args.sessionId) {
      const session = await ctx.db.get(args.sessionId);
      if (!session) throw new Error("Session not found");
      if (session.worldId !== world._id) throw new Error("Session does not belong to world");
      if (session.status === "ended") throw new Error("Session has ended");

      const participant = await getSessionParticipant(ctx, session._id, user._id);
      if (!participant) throw new Error("Not a session participant");
    } else if (world.ownerUserId !== user._id) {
      throw new Error("Forbidden");
    }

    if (args.tokenId) {
      const existing = await ctx.db.get(args.tokenId);
      if (!existing) throw new Error("Token not found");
      if (existing.worldId !== world._id || existing.mapId !== map._id) {
        throw new Error("Token does not belong to map");
      }
      if (args.sessionId) {
        if (existing.sessionId && existing.sessionId !== args.sessionId) {
          throw new Error("Token belongs to a different session");
        }
      } else if (existing.sessionId) {
        throw new Error("Token belongs to a session");
      }

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
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    const map = await ctx.db.get(args.mapId);
    if (!map) throw new Error("Map not found");
    if (map.worldId !== session.worldId) throw new Error("Map does not belong to session world");

    const participant = await getSessionParticipant(ctx, session._id, user._id);
    if (!participant) throw new Error("Not a session participant");
    if (participant.role !== "gm") throw new Error("Only the GM can update fog");

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
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const map = await ctx.db.get(args.mapId);
    if (!map) return null;
    if (map.worldId !== session.worldId) throw new Error("Map does not belong to session world");

    const viewer = await getOptionalUser(ctx);
    if (!viewer) {
      return { tokens: [], fog: null, fogUpdatedAt: null };
    }

    const participant = await getSessionParticipant(ctx, session._id, viewer._id);
    if (!participant) {
      return { tokens: [], fog: null, fogUpdatedAt: null };
    }

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
