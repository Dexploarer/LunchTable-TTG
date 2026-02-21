import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireUser } from "./auth";
import { canActorUseWorld } from "./permissions";
import { selectNarrationFromNarrationOutput } from "./vttNarrator";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { DefaultFunctionArgs, FunctionReference } from "convex/server";
import {
  isExternalVttProvider,
  type ExternalVttProvider,
  vVttProvider,
  type VttProvider,
} from "./vttAiProviders";

type InternalMutationRef = FunctionReference<"mutation", "internal", DefaultFunctionArgs>;
const internalUsage = (
  internal as unknown as {
    vttAiUsage: {
      internalRecordUsageEvent: InternalMutationRef;
    };
  }
).vttAiUsage;

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

  if (kind === "narration") {
    return {
      narration:
        "Lanternlight flickers across the table as distant thunder rolls in from the horizon. The air tastes of salt and rain, and every creak of timber sounds like a warning. Somewhere nearby, a door opens just a little too slowly.",
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
  if (provider === "openrouter") return "openai/gpt-4.1-mini";
  if (provider === "vercel_gateway") return "openai/gpt-4.1-mini";
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

  if (kind === "narration") {
    const worldName = typeof input.worldName === "string" ? input.worldName : "";
    const genre = typeof input.genre === "string" ? input.genre : "";
    const mood = typeof input.mood === "string" ? input.mood : "";
    const tagline = typeof input.tagline === "string" ? input.tagline : "";
    const mapName = typeof input.mapName === "string" ? input.mapName : "";
    const mapBiome = typeof input.mapBiome === "string" ? input.mapBiome : "";
    const prompt = typeof input.prompt === "string" ? input.prompt : "";

    return (
      base +
      `Write brief narration for the next beat of a live tabletop session.\n\n` +
      `Hard requirements:\n` +
      `- Return JSON only (no markdown).\n` +
      `- Output must match exactly: { "narration": string }\n` +
      `- 2-4 sentences.\n` +
      `- Present tense.\n` +
      `- No markdown.\n\n` +
      `Incorporate these details when present:\n` +
      `- worldName, genre, mood, tagline\n` +
      `- mapName, mapBiome\n` +
      `- prompt (GM guidance)\n\n` +
      `Context:\n` +
      `World name: ${worldName}\n` +
      `Genre: ${genre}\n` +
      `Mood: ${mood}\n` +
      `Tagline: ${tagline}\n` +
      `Map name: ${mapName}\n` +
      `Map biome: ${mapBiome}\n` +
      `GM prompt: ${prompt}\n`
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

function normalizeProvider(provider: string): VttProvider | null {
  if (
    provider === "openai" ||
    provider === "anthropic" ||
    provider === "openrouter" ||
    provider === "vercel_gateway" ||
    provider === "eliza"
  ) {
    return provider;
  }
  return null;
}

function getLanguageModel(params: {
  provider: ExternalVttProvider;
  apiKey: string;
  model: string;
}) {
  if (params.provider === "openai") {
    const openai = createOpenAI({ apiKey: params.apiKey });
    return openai(params.model);
  }

  if (params.provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: params.apiKey });
    return anthropic(params.model);
  }

  if (params.provider === "openrouter") {
    const openrouter = createOpenAI({
      apiKey: params.apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER ?? "https://lunchtable-ttg.local",
        "X-Title": process.env.OPENROUTER_APP_TITLE ?? "LunchTable TTG",
      },
    });
    return openrouter(params.model);
  }

  const gateway = createOpenAI({
    apiKey: params.apiKey,
    baseURL: "https://ai-gateway.vercel.sh/v1",
  });
  return gateway(params.model);
}

export type ProviderGenerationResult = {
  text: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    finishReason?: string;
    requestId?: string;
  } | null;
};

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function extractUsage(result: unknown): ProviderGenerationResult["usage"] {
  const payload = asRecord(result);
  const usage = asRecord(payload?.usage);
  const response = asRecord(payload?.response);

  return {
    inputTokens: readNumber(usage?.inputTokens),
    outputTokens: readNumber(usage?.outputTokens),
    totalTokens: readNumber(usage?.totalTokens),
    finishReason: readString(payload?.finishReason),
    requestId: readString(response?.id),
  };
}

export async function generateTextForProvider(params: {
  provider: VttProvider;
  kind: string;
  model: string;
  prompt: string;
  input?: Record<string, unknown>;
  apiKey?: string;
}): Promise<ProviderGenerationResult> {
  if (params.provider === "eliza") {
    const output = makeSyntheticOutput(params.kind, params.input ?? {});
    return { text: JSON.stringify(output), usage: null };
  }

  if (!params.apiKey) {
    throw new Error(`No API key provided for provider "${params.provider}"`);
  }

  const model = getLanguageModel({
    provider: params.provider,
    apiKey: params.apiKey,
    model: params.model,
  });

  const result = await generateText({
    model,
    temperature: 0.7,
    maxTokens: 1200,
    system: "Return JSON only. Do not wrap in markdown.",
    prompt: params.prompt,
  });

  return {
    text: result.text ?? "",
    usage: extractUsage(result as unknown),
  };
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
    const provider = normalizeProvider(job.provider);
    if (!provider) {
      await ctx.runMutation(internal.vttGeneration.internalPatchGenerationJob, {
        jobId: job._id,
        status: "failed",
        error: `Unsupported provider "${job.provider}"`,
      });
      return { ok: false };
    }

    const model = selectModel(provider, input);

    try {
      let apiKey: string | undefined;
      if (isExternalVttProvider(provider)) {
        const keyRow = await ctx
          .runQuery(internal.vttByok.internalGetActiveProviderKey, {
            userId: job.actorUserId,
            provider,
          })
          .catch(() => null);

        if (!keyRow?.apiKey) {
          throw new Error(`No active BYOK key configured for provider "${provider}"`);
        }
        apiKey = keyRow.apiKey;
      }

      const generated = await generateTextForProvider({
        provider,
        kind: job.kind,
        model,
        prompt,
        input,
        apiKey,
      });
      const text = generated.text;

      const parsed = extractJsonFromText(text);
      const output = {
        provider,
        model,
        kind: job.kind,
        text,
        parsed,
        usage: generated.usage,
      };

      const outputJson = JSON.stringify(output);

      if (job.kind === "narration") {
        const sessionIdRaw = typeof input.sessionId === "string" ? input.sessionId : "";
        if (sessionIdRaw) {
          const narrationText = selectNarrationFromNarrationOutput(parsed, text);
          try {
            await ctx.runMutation(internal.vttSessions.internalPostNarrationToSession, {
              sessionId: sessionIdRaw as Id<"sessions">,
              actorUserId: job.actorUserId,
              narration: narrationText,
              jobId: job._id,
            });
          } catch (postError) {
            await ctx.runMutation(internal.vttGeneration.internalPatchGenerationJob, {
              jobId: job._id,
              status: "failed",
              outputJson,
              error:
                postError instanceof Error ? postError.message : "Failed to post narration to session",
            });
            return { ok: false };
          }
        }
      }

      await ctx.runMutation(internal.vttGeneration.internalPatchGenerationJob, {
        jobId: job._id,
        status: "completed",
        outputJson,
      });

      await ctx.runMutation(internalUsage.internalRecordUsageEvent, {
        actorUserId: job.actorUserId,
        provider,
        model,
        kind: job.kind,
        inputTokens: generated.usage?.inputTokens,
        outputTokens: generated.usage?.outputTokens,
        totalTokens: generated.usage?.totalTokens,
        finishReason: generated.usage?.finishReason,
        requestId: generated.usage?.requestId,
        worldId: job.worldId,
        jobId: job._id,
        metadata: {
          source: "generation_job",
        },
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
    provider: vVttProvider,
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
