import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

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
