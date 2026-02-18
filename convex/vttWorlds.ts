import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireUser } from "./auth";

async function ensureActiveWorkspace(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");

  if (user.activeWorkspaceId) {
    return user.activeWorkspaceId;
  }

  const now = Date.now();
  const workspaceId = await ctx.db.insert("workspaces", {
    ownerUserId: userId,
    name: `${user.username}'s workspace`,
    description: "Personal workspace",
    visibility: "private",
    createdAt: now,
    updatedAt: now,
  });

  await ctx.db.patch(userId, {
    activeWorkspaceId: workspaceId,
    updatedAt: now,
  });

  return workspaceId;
}

async function getWorldSnapshot(ctx: QueryCtx, worldId: Id<"worlds">) {
  const world = await ctx.db.get(worldId);
  if (!world) return null;

  const maps = await ctx.db
    .query("maps")
    .withIndex("by_world", (q) => q.eq("worldId", worldId))
    .collect();

  const ruleset = world.rulesetId ? await ctx.db.get(world.rulesetId) : null;

  return {
    world,
    ruleset,
    maps: maps.sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

export const createWorld = mutation({
  args: {
    name: v.string(),
    tagline: v.string(),
    genre: v.string(),
    mood: v.string(),
    visibility: v.union(v.literal("public"), v.literal("private"), v.literal("unlisted")),
    recommendedPartySize: v.optional(v.string()),
    sessionLength: v.optional(v.string()),
    rules: v.optional(
      v.object({
        name: v.string(),
        summary: v.string(),
        turnLoop: v.array(v.string()),
        failForwardPolicy: v.string(),
        escalationTrack: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const workspaceId = await ensureActiveWorkspace(ctx, user._id);
    const now = Date.now();

    let rulesetId: Id<"rulesets"> | undefined;
    if (args.rules) {
      rulesetId = await ctx.db.insert("rulesets", {
        workspaceId,
        name: args.rules.name,
        summary: args.rules.summary,
        turnLoop: args.rules.turnLoop,
        failForwardPolicy: args.rules.failForwardPolicy,
        escalationTrack: args.rules.escalationTrack,
        createdAt: now,
        updatedAt: now,
      });
    }

    const worldId = await ctx.db.insert("worlds", {
      workspaceId,
      ownerUserId: user._id,
      rulesetId,
      name: args.name,
      tagline: args.tagline,
      genre: args.genre,
      mood: args.mood,
      recommendedPartySize: args.recommendedPartySize,
      sessionLength: args.sessionLength,
      visibility: args.visibility,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    });

    const snapshot = JSON.stringify({
      name: args.name,
      tagline: args.tagline,
      genre: args.genre,
      mood: args.mood,
      rules: args.rules ?? null,
      maps: [],
    });

    const versionId = await ctx.db.insert("worldVersions", {
      worldId,
      versionNumber: 1,
      snapshotJson: snapshot,
      createdBy: user._id,
      createdAt: now,
    });

    await ctx.db.patch(worldId, { latestVersionId: versionId, updatedAt: now });

    return { worldId, versionId };
  },
});

export const updateWorld = mutation({
  args: {
    worldId: v.id("worlds"),
    name: v.optional(v.string()),
    tagline: v.optional(v.string()),
    genre: v.optional(v.string()),
    mood: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"), v.literal("unlisted"))),
    recommendedPartySize: v.optional(v.string()),
    sessionLength: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error("World not found");
    if (world.ownerUserId !== user._id) throw new Error("Forbidden");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) patch.name = args.name;
    if (args.tagline !== undefined) patch.tagline = args.tagline;
    if (args.genre !== undefined) patch.genre = args.genre;
    if (args.mood !== undefined) patch.mood = args.mood;
    if (args.visibility !== undefined) patch.visibility = args.visibility;
    if (args.recommendedPartySize !== undefined) patch.recommendedPartySize = args.recommendedPartySize;
    if (args.sessionLength !== undefined) patch.sessionLength = args.sessionLength;

    await ctx.db.patch(args.worldId, patch);

    return { worldId: args.worldId };
  },
});

export const forkWorld = mutation({
  args: {
    worldId: v.id("worlds"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const source = await ctx.db.get(args.worldId);
    if (!source) throw new Error("World not found");

    const workspaceId = await ensureActiveWorkspace(ctx, user._id);
    const now = Date.now();

    const forkId = await ctx.db.insert("worlds", {
      workspaceId,
      ownerUserId: user._id,
      rulesetId: source.rulesetId,
      name: `${source.name} (Fork)`,
      tagline: source.tagline,
      genre: source.genre,
      mood: source.mood,
      recommendedPartySize: source.recommendedPartySize,
      sessionLength: source.sessionLength,
      visibility: "private",
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    });

    const sourceMaps = await ctx.db
      .query("maps")
      .withIndex("by_world", (q) => q.eq("worldId", source._id))
      .collect();

    for (const map of sourceMaps) {
      await ctx.db.insert("maps", {
        worldId: forkId,
        name: map.name,
        biome: map.biome,
        camera: map.camera,
        lightingPreset: map.lightingPreset,
        ambience: map.ambience,
        objectives: map.objectives,
        sortOrder: map.sortOrder,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("worldForks", {
      sourceWorldId: source._id,
      forkWorldId: forkId,
      forkedBy: user._id,
      createdAt: now,
    });

    return { worldId: forkId };
  },
});

export const getWorld = query({
  args: {
    worldId: v.id("worlds"),
  },
  handler: async (ctx, args) => {
    return await getWorldSnapshot(ctx, args.worldId);
  },
});

export const listWorlds = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const worlds = await ctx.db.query("worlds").collect();
    const search = args.search?.trim().toLowerCase();

    return worlds
      .filter((world) => {
        if (!search) return true;
        return (
          world.name.toLowerCase().includes(search) ||
          world.tagline.toLowerCase().includes(search) ||
          world.genre.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const addMap = mutation({
  args: {
    worldId: v.id("worlds"),
    name: v.string(),
    biome: v.optional(v.string()),
    camera: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error("World not found");
    if (world.ownerUserId !== user._id) throw new Error("Forbidden");

    const existing = await ctx.db
      .query("maps")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .collect();

    const now = Date.now();
    const mapId = await ctx.db.insert("maps", {
      worldId: args.worldId,
      name: args.name,
      biome: args.biome,
      camera: args.camera,
      lightingPreset: "default",
      ambience: [],
      objectives: [],
      sortOrder: existing.length,
      createdAt: now,
      updatedAt: now,
    });

    return { mapId };
  },
});
