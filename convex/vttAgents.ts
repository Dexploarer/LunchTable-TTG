import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { canActorUseWorld } from "./permissions";
import { evaluateModerationText } from "./vttModeration";
import { makeSyntheticOutput } from "./vttGeneration";

function normalizeUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 18) || "agent";
}

async function ensureAgentParticipant(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
  userId: Id<"users">,
) {
  const participants = await ctx.db
    .query("sessionParticipants")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();

  return participants.find((entry) => entry.userId === userId) ?? null;
}

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

export const registerAgent = mutation({
  args: {
    name: v.string(),
    apiKeyHash: v.string(),
    apiKeyPrefix: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("agents")
      .withIndex("by_apiKeyHash", (q) => q.eq("apiKeyHash", args.apiKeyHash))
      .first();
    if (existing) {
      return { agentId: existing._id, userId: existing.userId };
    }

    const userId = await ctx.db.insert("users", {
      privyId: `agent:${args.apiKeyHash.slice(0, 20)}`,
      username: `agent_${normalizeUsername(args.name)}`,
      createdAt: now,
      updatedAt: now,
    });

    const agentId = await ctx.db.insert("agents", {
      name: args.name,
      apiKeyHash: args.apiKeyHash,
      apiKeyPrefix: args.apiKeyPrefix,
      userId,
      isActive: true,
      createdAt: now,
      lastSeenAt: now,
    });

    const workspaceId = await ctx.db.insert("workspaces", {
      ownerUserId: userId,
      name: `${args.name} workspace`,
      description: "Agent workspace",
      visibility: "private",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(userId, {
      activeWorkspaceId: workspaceId,
      updatedAt: now,
    });

    return { agentId, userId };
  },
});

export const getAgentByKeyHash = query({
  args: { apiKeyHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_apiKeyHash", (q) => q.eq("apiKeyHash", args.apiKeyHash))
      .first();
  },
});

export const touchAgent = mutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) return { ok: false };

    await ctx.db.patch(agent._id, { lastSeenAt: Date.now() });
    return { ok: true };
  },
});

export const agentCreateSession = mutation({
  args: {
    agentUserId: v.id("users"),
    worldId: v.id("worlds"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error("World not found");
    if (
      !canActorUseWorld({
        visibility: world.visibility,
        ownerUserId: world.ownerUserId,
        actorUserId: args.agentUserId,
      })
    ) {
      throw new Error("Forbidden");
    }

    const now = Date.now();
    const sessionId = await ctx.db.insert("sessions", {
      workspaceId: world.workspaceId,
      worldId: world._id,
      hostUserId: args.agentUserId,
      title: args.title ?? `${world.name} Session`,
      status: "active",
      maxParticipants: 7,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("sessionParticipants", {
      sessionId,
      userId: args.agentUserId,
      role: "gm",
      joinedAt: now,
      lastActiveAt: now,
    });

    return { sessionId };
  },
});

export const agentJoinSession = mutation({
  args: {
    agentUserId: v.id("users"),
    sessionId: v.id("sessions"),
    role: v.optional(v.union(v.literal("player"), v.literal("observer"), v.literal("npc"))),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status === "ended") throw new Error("Session has ended");

    const existing = await ensureAgentParticipant(ctx, session._id, args.agentUserId);
    if (existing) {
      await ctx.db.patch(existing._id, { lastActiveAt: Date.now() });
      return { joined: true, role: existing.role };
    }

    const role = args.role ?? "npc";
    await ctx.db.insert("sessionParticipants", {
      sessionId: session._id,
      userId: args.agentUserId,
      role,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    return { joined: true, role };
  },
});

export const agentPostCommand = mutation({
  args: {
    agentUserId: v.id("users"),
    sessionId: v.id("sessions"),
    command: v.string(),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const participant = await ensureAgentParticipant(ctx, session._id, args.agentUserId);
    if (!participant) throw new Error("Agent is not a participant in this session");

    const eventId = await ctx.db.insert("sessionEvents", {
      sessionId: session._id,
      actorUserId: args.agentUserId,
      eventType: args.command,
      payloadJson: JSON.stringify(args.payload ?? {}),
      createdAt: Date.now(),
    });

    await ctx.db.patch(participant._id, { lastActiveAt: Date.now() });
    await ctx.db.patch(session._id, { updatedAt: Date.now() });

    return { eventId };
  },
});

export const agentSessionView = query({
  args: {
    agentUserId: v.id("users"),
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const participant = await ensureAgentParticipant(ctx, session._id, args.agentUserId);
    if (!participant) throw new Error("Agent is not a participant in this session");

    const participants = await ctx.db
      .query("sessionParticipants")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const events = await ctx.db
      .query("sessionEvents")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    return {
      session,
      participants,
      events: events
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 60)
        .reverse()
        .map((event) => ({
          ...event,
          payload: JSON.parse(event.payloadJson || "{}"),
        })),
      role: participant.role,
    };
  },
});

export const agentCreateWorld = mutation({
  args: {
    agentUserId: v.id("users"),
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
    const workspaceId = await ensureActiveWorkspace(ctx, args.agentUserId);
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
      ownerUserId: args.agentUserId,
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

    const defaultMapName = "Scene 1";
    await ctx.db.insert("maps", {
      worldId,
      name: defaultMapName,
      biome: args.genre,
      camera: "topdown",
      lightingPreset: "default",
      ambience: [],
      objectives: [],
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });

    const snapshot = JSON.stringify({
      name: args.name,
      tagline: args.tagline,
      genre: args.genre,
      mood: args.mood,
      rules: args.rules ?? null,
      maps: [
        {
          name: defaultMapName,
          biome: args.genre,
        },
      ],
    });

    const versionId = await ctx.db.insert("worldVersions", {
      worldId,
      versionNumber: 1,
      snapshotJson: snapshot,
      createdBy: args.agentUserId,
      createdAt: now,
    });

    await ctx.db.patch(worldId, { latestVersionId: versionId, updatedAt: now });

    return { worldId, versionId };
  },
});

export const agentUpdateWorld = mutation({
  args: {
    agentUserId: v.id("users"),
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
    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error("World not found");
    if (world.ownerUserId !== args.agentUserId) throw new Error("Forbidden");

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

export const agentForkWorld = mutation({
  args: {
    agentUserId: v.id("users"),
    worldId: v.id("worlds"),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.worldId);
    if (!source) throw new Error("World not found");
    if (source.visibility === "private" && source.ownerUserId !== args.agentUserId) {
      throw new Error("Forbidden");
    }

    const workspaceId = await ensureActiveWorkspace(ctx, args.agentUserId);
    const now = Date.now();

    const forkId = await ctx.db.insert("worlds", {
      workspaceId,
      ownerUserId: args.agentUserId,
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
      forkedBy: args.agentUserId,
      createdAt: now,
    });

    return { worldId: forkId };
  },
});

export const agentPublishWorld = mutation({
  args: {
    agentUserId: v.id("users"),
    worldId: v.id("worlds"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error("World not found");
    if (world.ownerUserId !== args.agentUserId) throw new Error("Forbidden");

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
      ownerUserId: args.agentUserId,
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

export const agentCreateGenerationJob = mutation({
  args: {
    agentUserId: v.id("users"),
    worldId: v.optional(v.id("worlds")),
    kind: v.string(),
    provider: v.string(),
    input: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const input = (args.input ?? {}) as Record<string, unknown>;

    if (args.worldId) {
      const world = await ctx.db.get(args.worldId);
      if (!world) throw new Error("World not found");
      if (
        !canActorUseWorld({
          visibility: world.visibility,
          ownerUserId: world.ownerUserId,
          actorUserId: args.agentUserId,
        })
      ) {
        throw new Error("Forbidden");
      }
    }

    const jobId = await ctx.db.insert("generationJobs", {
      actorUserId: args.agentUserId,
      worldId: args.worldId,
      kind: args.kind,
      provider: args.provider,
      inputJson: JSON.stringify(input),
      status: "running",
      createdAt: now,
      updatedAt: now,
    });

    try {
      const output = makeSyntheticOutput(args.kind, input);
      await ctx.db.patch(jobId, {
        status: "completed",
        outputJson: JSON.stringify(output),
        updatedAt: Date.now(),
      });
    } catch (error) {
      await ctx.db.patch(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Generation failed",
        updatedAt: Date.now(),
      });
    }

    return { jobId };
  },
});

export const agentGetGenerationJob = query({
  args: {
    agentUserId: v.id("users"),
    jobId: v.id("generationJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    if (job.actorUserId !== args.agentUserId) return null;

    return {
      ...job,
      input: JSON.parse(job.inputJson),
      output: job.outputJson ? JSON.parse(job.outputJson) : null,
    };
  },
});
