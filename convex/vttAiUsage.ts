import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { vVttProvider } from "./vttAiProviders";

export const internalRecordUsageEvent = internalMutation({
  args: {
    actorUserId: v.id("users"),
    provider: vVttProvider,
    model: v.string(),
    kind: v.string(),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    totalTokens: v.optional(v.number()),
    finishReason: v.optional(v.string()),
    requestId: v.optional(v.string()),
    sessionId: v.optional(v.id("sessions")),
    worldId: v.optional(v.id("worlds")),
    runId: v.optional(v.id("agentRuns")),
    jobId: v.optional(v.id("generationJobs")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiUsageEvents", {
      actorUserId: args.actorUserId,
      provider: args.provider,
      model: args.model,
      kind: args.kind,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      totalTokens: args.totalTokens,
      finishReason: args.finishReason,
      requestId: args.requestId,
      sessionId: args.sessionId,
      worldId: args.worldId,
      runId: args.runId,
      jobId: args.jobId,
      metadataJson: args.metadata !== undefined ? JSON.stringify(args.metadata) : undefined,
      createdAt: Date.now(),
    });

    return { ok: true as const };
  },
});

export const listMyUsageEvents = query({
  args: {
    provider: v.optional(vVttProvider),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = Math.max(1, Math.min(200, args.limit ?? 50));

    const rows = await ctx.db
      .query("aiUsageEvents")
      .withIndex("by_actor", (q) => q.eq("actorUserId", user._id))
      .collect();

    return rows
      .filter((row) => (args.provider ? row.provider === args.provider : true))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map((row) => ({
        ...row,
        metadata: row.metadataJson ? JSON.parse(row.metadataJson) : null,
      }));
  },
});
