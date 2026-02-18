import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";

function makeSyntheticOutput(kind: string, input: Record<string, unknown>) {
  if (kind === "world") {
    return {
      summary: "Generated world scaffold",
      rules: {
        turnLoop: ["setup", "intent", "resolution", "aftermath"],
        failForwardPolicy: "Failure always advances fiction with a cost.",
      },
      suggestions: [
        "Define 3 factions with conflicting goals.",
        "Create 5 map objectives with escalating pressure.",
      ],
      input,
    };
  }

  if (kind === "npc") {
    return {
      npcProfile: {
        archetype: "Broker",
        goals: ["Secure leverage", "Protect network"],
        scenePrompts: ["Offer a costly shortcut", "Reveal partial truth"],
      },
      input,
    };
  }

  return {
    result: `Generated ${kind} artifact`,
    input,
  };
}

export const createGenerationJob = mutation({
  args: {
    actorUserId: v.id("users"),
    worldId: v.optional(v.id("worlds")),
    kind: v.string(),
    provider: v.string(),
    input: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const input = (args.input ?? {}) as Record<string, unknown>;

    const jobId = await ctx.db.insert("generationJobs", {
      actorUserId: args.actorUserId,
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

export const getGenerationJob = query({
  args: {
    jobId: v.id("generationJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;

    return {
      ...job,
      input: JSON.parse(job.inputJson),
      output: job.outputJson ? JSON.parse(job.outputJson) : null,
    };
  },
});

export const getLatestGenerationJobForWorld = query({
  args: {
    worldId: v.id("worlds"),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .collect();

    const latest = jobs.sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (!latest) return null;

    return {
      ...latest,
      input: JSON.parse(latest.inputJson),
      output: latest.outputJson ? JSON.parse(latest.outputJson) : null,
    };
  },
});

export async function createAgentGenerationJob(
  ctx: ActionCtx,
  actorUserId: Id<"users">,
  kind: string,
  provider: string,
  worldId?: Id<"worlds">,
  input?: Record<string, unknown>,
) {
  const result = await ctx.runMutation(api.vttGeneration.createGenerationJob, {
    actorUserId,
    worldId,
    kind,
    provider,
    input,
  });

  return result;
}
