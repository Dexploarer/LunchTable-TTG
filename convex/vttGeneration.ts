import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUser } from "./auth";
import { canActorUseWorld } from "./permissions";

export function makeSyntheticOutput(kind: string, input: Record<string, unknown>) {
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

const generationStatus = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function defaultModelForProvider(provider: string) {
  if (provider === "openai") return "gpt-4.1-mini";
  if (provider === "anthropic") return "claude-3-5-sonnet-20240620";
  return "synthetic";
}

export function selectModel(provider: string, input: Record<string, unknown>) {
  const rawModel = typeof input.model === "string" ? input.model.trim() : "";
  return rawModel || defaultModelForProvider(provider);
}

export function buildPrompt(kind: string, input: Record<string, unknown>) {
  const base = `You are an expert tabletop RPG designer and GM copilot.\n\n` as const;

  if (kind === "world") {
    const worldName = typeof input.worldName === "string" ? input.worldName : "";
    const tagline = typeof input.tagline === "string" ? input.tagline : "";

    return (
      base +
      `Create a tabletop RPG world scaffold.\n\n` +
      `World name: ${worldName}\n` +
      `Tagline: ${tagline}\n\n` +
      `Return JSON only (no markdown) with keys:\n` +
      `- summary: string\n` +
      `- rules: { turnLoop: string[], failForwardPolicy: string, escalationTrack: string }\n` +
      `- suggestions: string[]\n` +
      `- maps: { name: string, biome: string, objectives: string[] }[]\n`
    );
  }

  if (kind === "npc") {
    return (
      base +
      `Create an NPC scaffold for a live tabletop session.\n\n` +
      `Input JSON: ${JSON.stringify(input)}\n\n` +
      `Return JSON only (no markdown) with key npcProfile:\n` +
      `npcProfile: { archetype: string, goals: string[], scenePrompts: string[] }\n`
    );
  }

  return (
    base +
    `Create a generation output for kind "${kind}".\n\n` +
    `Input JSON: ${JSON.stringify(input)}\n\n` +
    `Return JSON only (no markdown) with keys: summary (string), suggestions (string[]).\n`
  );
}

export function extractJsonFromText(text: string): unknown | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Best-effort: grab the first top-level JSON object/array from the response.
  const start = Math.min(
    ...[trimmed.indexOf("{"), trimmed.indexOf("[")].filter((idx) => idx >= 0),
  );
  if (!Number.isFinite(start)) return null;

  const lastBrace = trimmed.lastIndexOf("}");
  const lastBracket = trimmed.lastIndexOf("]");
  const end = Math.max(lastBrace, lastBracket);
  if (end <= start) return null;

  const slice = trimmed.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

async function openaiChatCompletion({
  apiKey,
  model,
  prompt,
}: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Return JSON only. Do not wrap in markdown." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const rawError = asRecord(payload)?.error;
    const errorObject = asRecord(rawError);
    const errorMessage =
      typeof rawError === "string"
        ? rawError
        : typeof errorObject?.message === "string"
          ? errorObject.message
          : `OpenAI request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  const choices = asRecord(payload)?.choices;
  const firstChoice = Array.isArray(choices) ? asRecord(choices[0]) : null;
  const content = asRecord(firstChoice?.message)?.content;
  return typeof content === "string" ? content : "";
}

async function anthropicMessage({
  apiKey,
  model,
  prompt,
}: {
  apiKey: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const errorObject = asRecord(asRecord(payload)?.error);
    const errorMessage =
      typeof errorObject?.message === "string"
        ? errorObject.message
        : `Anthropic request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  const content = asRecord(payload)?.content;
  const firstBlock = Array.isArray(content) ? asRecord(content[0]) : null;
  const text = firstBlock?.text;
  return typeof text === "string" ? text : "";
}

export const internalGetGenerationJobForRunner = internalQuery({
  args: {
    jobId: v.id("generationJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    return job;
  },
});

export const internalPatchGenerationJob = internalMutation({
  args: {
    jobId: v.id("generationJobs"),
    status: generationStatus,
    outputJson: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      updatedAt: Date.now(),
      ...(args.outputJson !== undefined ? { outputJson: args.outputJson } : {}),
      ...(args.error !== undefined ? { error: args.error } : {}),
    });
    return { ok: true };
  },
});

export const runGenerationJob = internalAction({
  args: {
    jobId: v.id("generationJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(internal.vttGeneration.internalGetGenerationJobForRunner, {
      jobId: args.jobId,
    });
    if (!job) return null;
    if (job.status === "completed" || job.status === "failed") return null;

    await ctx.runMutation(internal.vttGeneration.internalPatchGenerationJob, {
      jobId: job._id,
      status: "running",
    });

    let input: Record<string, unknown> = {};
    try {
      input = asRecord(JSON.parse(job.inputJson)) ?? {};
    } catch {
      input = {};
    }

    const prompt = buildPrompt(job.kind, input);
    const model = selectModel(job.provider, input);

    try {
      let text = "";
      if (job.provider === "openai" || job.provider === "anthropic") {
        const keyRow = await ctx
          .runQuery(internal.vttByok.internalGetActiveProviderKey, {
            userId: job.actorUserId,
            provider: job.provider,
          })
          .catch(() => null);

        if (!keyRow?.apiKey) {
          throw new Error(`No active BYOK key configured for provider "${job.provider}"`);
        }

        if (job.provider === "openai") {
          text = await openaiChatCompletion({ apiKey: keyRow.apiKey, model, prompt });
        } else {
          text = await anthropicMessage({ apiKey: keyRow.apiKey, model, prompt });
        }
      } else if (job.provider === "eliza") {
        const output = makeSyntheticOutput(job.kind, input);
        text = JSON.stringify(output);
      } else {
        throw new Error(`Unsupported provider "${job.provider}"`);
      }

      const parsed = extractJsonFromText(text);
      const output = {
        provider: job.provider,
        model,
        kind: job.kind,
        text,
        parsed,
      };

      await ctx.runMutation(internal.vttGeneration.internalPatchGenerationJob, {
        jobId: job._id,
        status: "completed",
        outputJson: JSON.stringify(output),
      });

      return { ok: true };
    } catch (error) {
      await ctx.runMutation(internal.vttGeneration.internalPatchGenerationJob, {
        jobId: job._id,
        status: "failed",
        error: error instanceof Error ? error.message : "Generation failed",
      });
      return { ok: false };
    }
  },
});

export const createGenerationJob = mutation({
  args: {
    worldId: v.optional(v.id("worlds")),
    kind: v.string(),
    provider: v.string(),
    input: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const input = asRecord(args.input) ?? {};

    if (args.worldId) {
      const world = await ctx.db.get(args.worldId);
      if (!world) throw new Error("World not found");
      if (
        !canActorUseWorld({
          visibility: world.visibility,
          ownerUserId: world.ownerUserId,
          actorUserId: user._id,
        })
      ) {
        throw new Error("Forbidden");
      }
    }

    const jobId = await ctx.db.insert("generationJobs", {
      actorUserId: user._id,
      worldId: args.worldId,
      kind: args.kind,
      provider: args.provider,
      inputJson: JSON.stringify(input),
      status: "queued",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.vttGeneration.runGenerationJob, { jobId });

    return { jobId };
  },
});

export const getGenerationJob = query({
  args: {
    jobId: v.id("generationJobs"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;
    if (job.actorUserId !== user._id) return null;

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
    const user = await requireUser(ctx);
    const world = await ctx.db.get(args.worldId);
    if (!world) return null;
    if (
      !canActorUseWorld({
        visibility: world.visibility,
        ownerUserId: world.ownerUserId,
        actorUserId: user._id,
      })
    ) {
      return null;
    }
    const jobs = await ctx.db
      .query("generationJobs")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .collect();

    const latest = jobs
      .filter((job) => job.actorUserId === user._id)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (!latest) return null;

    return {
      ...latest,
      input: JSON.parse(latest.inputJson),
      output: latest.outputJson ? JSON.parse(latest.outputJson) : null,
    };
  },
});
