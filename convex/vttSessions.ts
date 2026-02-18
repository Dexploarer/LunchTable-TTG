import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireUser } from "./auth";

async function ensureParticipant(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  userId: Id<"users">,
) {
  const existing = await ctx.db
    .query("sessionParticipants")
    .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
    .collect();

  return existing.find((participant) => participant.userId === userId) ?? null;
}

export const createSession = mutation({
  args: {
    worldId: v.id("worlds"),
    title: v.optional(v.string()),
    maxParticipants: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const world = await ctx.db.get(args.worldId);
    if (!world) throw new Error("World not found");

    const now = Date.now();
    const sessionId = await ctx.db.insert("sessions", {
      workspaceId: world.workspaceId,
      worldId: world._id,
      hostUserId: user._id,
      title: args.title ?? `${world.name} Session`,
      status: "active",
      maxParticipants: Math.max(2, Math.min(8, args.maxParticipants ?? 7)),
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("sessionParticipants", {
      sessionId,
      userId: user._id,
      role: "gm",
      joinedAt: now,
      lastActiveAt: now,
    });

    return { sessionId, status: "active" as const };
  },
});

export const joinSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    role: v.optional(v.union(v.literal("player"), v.literal("observer"), v.literal("npc"))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status === "ended") throw new Error("Session has ended");

    const existingParticipant = await ensureParticipant(ctx, session._id, user._id);
    if (existingParticipant) {
      await ctx.db.patch(existingParticipant._id, { lastActiveAt: Date.now() });
      return { joined: true, role: existingParticipant.role };
    }

    const participants = await ctx.db
      .query("sessionParticipants")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    if (participants.length >= session.maxParticipants) {
      throw new Error("Session is full");
    }

    const role = args.role ?? "player";
    await ctx.db.insert("sessionParticipants", {
      sessionId: session._id,
      userId: user._id,
      role,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    return { joined: true, role };
  },
});

export const postCommand = mutation({
  args: {
    sessionId: v.id("sessions"),
    command: v.string(),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const participant = await ensureParticipant(ctx, session._id, user._id);
    if (!participant) throw new Error("Not a session participant");

    const eventId = await ctx.db.insert("sessionEvents", {
      sessionId: session._id,
      actorUserId: user._id,
      eventType: args.command,
      payloadJson: JSON.stringify(args.payload ?? {}),
      createdAt: Date.now(),
    });

    await ctx.db.patch(participant._id, { lastActiveAt: Date.now() });
    await ctx.db.patch(session._id, { updatedAt: Date.now() });

    return { eventId };
  },
});

export const getSessionView = query({
  args: {
    sessionId: v.id("sessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const participants = await ctx.db
      .query("sessionParticipants")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const events = await ctx.db
      .query("sessionEvents")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    const sortedEvents = events
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.max(1, Math.min(200, args.limit ?? 50)))
      .reverse();

    const recentDice = await ctx.db
      .query("diceRolls")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    return {
      session,
      participants,
      events: sortedEvents.map((event) => ({
        ...event,
        payload: JSON.parse(event.payloadJson || "{}"),
      })),
      diceRolls: recentDice.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20),
    };
  },
});

export const rollDice = mutation({
  args: {
    sessionId: v.id("sessions"),
    expression: v.string(),
    total: v.number(),
    result: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.insert("diceRolls", {
      sessionId: session._id,
      actorUserId: user._id,
      expression: args.expression,
      total: args.total,
      resultJson: JSON.stringify(args.result ?? {}),
      createdAt: Date.now(),
    });

    return { ok: true };
  },
});

export const closeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.hostUserId !== user._id) throw new Error("Only host can close session");

    await ctx.db.patch(session._id, {
      status: "ended",
      endedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const listActiveSessions = query({
  args: {
    worldId: v.optional(v.id("worlds")),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return sessions
      .filter((session) => (args.worldId ? session.worldId === args.worldId : true))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
