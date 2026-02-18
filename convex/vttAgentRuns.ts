import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getOptionalUser, requireUser } from "./auth";
import {
  buildPrompt,
  defaultModelForProvider,
  extractJsonFromText,
  generateTextForProvider,
} from "./vttGeneration";
import { selectNarrationFromNarrationOutput } from "./vttNarrator";
import {
  advanceRunState,
  computeNextTokenPosition,
  makeSeededRng,
} from "./vttAgentRunsLogic";
import {
  formatProviderFallbackMessage,
  isExternalVttProvider,
  vVttProvider,
  type VttProvider,
} from "./vttAiProviders";

const internalAgentRuns: any = (internal as any).vttAgentRuns;
const internalTickRunRef: any = (internal as any).vttAgentRuns.internalTickRun;

interface SessionMapToken {
  _id: Id<"tokens">;
  name: string;
  x: number;
  y: number;
  layer: "ground" | "mid" | "air";
  color?: string;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function clampInteger(value: number, min: number, max: number) {
  return Math.trunc(clamp(value, min, max));
}

function playerName(index: number) {
  return `Player ${String.fromCharCode(65 + index)}`;
}

async function getParticipantByUserId(
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

async function ensureRunAccessBySession(
  ctx: MutationCtx | QueryCtx,
  sessionId: Id<"sessions">,
  userId: Id<"users">,
) {
  const session = await ctx.db.get(sessionId);
  if (!session) return null;
  if (session.hostUserId === userId) return session;

  const participant = await getParticipantByUserId(ctx, sessionId, userId);
  if (participant) return session;

  const world = await ctx.db.get(session.worldId);
  if (world?.ownerUserId === userId) return session;
  return null;
}

export const getRunForSession = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const viewer = await getOptionalUser(ctx);
    if (!viewer) return null;

    const session = await ensureRunAccessBySession(ctx, args.sessionId, viewer._id);
    if (!session) return null;

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    return runs.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
  },
});

export const internalAdvanceRunTurn = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    expectedTurn: v.number(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return { ok: false as const, reason: "not_found" };
    if (run.status !== "running") return { ok: false as const, reason: "not_running" };
    if (run.turn !== args.expectedTurn) return { ok: false as const, reason: "stale_turn" };

    await ctx.db.patch(run._id, {
      turn: run.turn + 1,
      updatedAt: Date.now(),
    });

    return { ok: true as const, turn: run.turn + 1 };
  },
});

export const internalPatchRun = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    status: v.optional(v.union(v.literal("running"), v.literal("stopped"), v.literal("completed"), v.literal("failed"))),
    objectiveIndex: v.optional(v.number()),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return { ok: false as const };

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.status !== undefined) patch.status = args.status;
    if (args.objectiveIndex !== undefined) patch.objectiveIndex = args.objectiveIndex;
    if (args.lastError !== undefined) patch.lastError = args.lastError;
    await ctx.db.patch(args.runId, patch);

    return { ok: true as const };
  },
});

export const internalTickRun = internalAction({
  args: {
    runId: v.id("agentRuns"),
    singleStep: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: boolean; skipped?: string; stopped?: string; completed?: boolean; error?: string }> => {
    const run = await ctx.runQuery(internalAgentRuns.getInternalRun, { runId: args.runId });
    if (!run || run.status !== "running") return { ok: false };

    try {
      const session = await ctx.runQuery(internalAgentRuns.getInternalSession, {
        sessionId: run.sessionId,
      });
      if (!session || session.status === "ended") {
        await ctx.runMutation(internalAgentRuns.internalPatchRun, {
          runId: run._id,
          status: "completed",
        });
        return { ok: true, stopped: "session_ended" };
      }

      const advanced = await ctx.runMutation(internalAgentRuns.internalAdvanceRunTurn, {
        runId: run._id,
        expectedTurn: run.turn,
      });
      if (!advanced.ok) return { ok: false, skipped: advanced.reason };

      const nextTurn = advanced.turn;
      const world = await ctx.runQuery(internalAgentRuns.getInternalWorld, {
        worldId: run.worldId,
      });
      if (!world) {
        await ctx.runMutation(internalAgentRuns.internalPatchRun, {
          runId: run._id,
          status: "failed",
          lastError: "World not found",
        });
        return { ok: false };
      }

      const maps = await ctx.runQuery(internalAgentRuns.getInternalMapsForWorld, {
        worldId: run.worldId,
      });
      const activeMap = maps[0] ?? null;
      if (!activeMap) {
        await ctx.runMutation(internalAgentRuns.internalPatchRun, {
          runId: run._id,
          status: "failed",
          lastError: "No map found for world",
        });
        return { ok: false };
      }

      const existingTokens = (await ctx.runQuery(internalAgentRuns.getInternalSessionMapTokens, {
        sessionId: run.sessionId,
        mapId: activeMap._id,
      })) as SessionMapToken[];

      const personaNames = [
        "Narrator",
        ...Array.from({ length: run.playerCount }, (_, index) => playerName(index)),
      ];
      const tokenByName = new Map<string, SessionMapToken>(
        existingTokens.map((token) => [token.name, token]),
      );

      const seededRng = makeSeededRng(run.seed + nextTurn);
      const initialSpawns = [
        { name: "Narrator", x: 14, y: 18, color: "#ffcc00" },
        { name: "Player A", x: 30, y: 50, color: "#33ccff" },
        { name: "Player B", x: 50, y: 58, color: "#f97316" },
        { name: "Player C", x: 68, y: 44, color: "#eab308" },
      ];

      for (const persona of personaNames) {
        if (tokenByName.has(persona)) continue;
        const spawn = initialSpawns.find((entry) => entry.name === persona) ?? {
          name: persona,
          x: clamp(20 + seededRng() * 60, 2, 98),
          y: clamp(20 + seededRng() * 60, 2, 98),
          color: "#cbd5e1",
        };

        const created = await ctx.runMutation(internal.vttMaps.internalUpsertTokenForSession, {
          actorUserId: run.ownerUserId,
          worldId: run.worldId,
          mapId: activeMap._id,
          sessionId: run.sessionId,
          name: spawn.name,
          x: spawn.x,
          y: spawn.y,
          layer: "mid",
          color: spawn.color,
        });

        tokenByName.set(persona, {
          _id: created.tokenId,
          name: spawn.name,
          x: spawn.x,
          y: spawn.y,
          layer: "mid",
          color: spawn.color,
        });
      }

      const fallbackObjectives = ["Secure the lead", "Survive the complication", "Extract safely"];
      const objectives =
        Array.isArray(activeMap.objectives) && activeMap.objectives.length > 0
          ? activeMap.objectives
          : fallbackObjectives;
      const objectiveText =
        objectives[Math.min(run.objectiveIndex, objectives.length - 1)] ?? "Push forward";

      let providerInUse: VttProvider = run.provider;
      let narrationText = "";
      let narrationUsage: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
        finishReason?: string;
        requestId?: string;
      } | null = null;
      const mapBiome = activeMap.biome ?? "Unknown";
      let providerApiKey: string | undefined;

      if (isExternalVttProvider(run.provider)) {
        const key = await ctx.runQuery(internal.vttByok.internalGetActiveProviderKey, {
          userId: run.ownerUserId,
          provider: run.provider,
        });

        if (!key?.apiKey) {
          providerInUse = "eliza";
          if (nextTurn === 1) {
            await ctx.runMutation(internal.vttSessions.internalPostChatMessage, {
              sessionId: run.sessionId,
              actorUserId: run.ownerUserId,
              sender: "SYSTEM",
              text: formatProviderFallbackMessage(run.provider),
              meta: { source: "agent_run" },
            });
          }
        } else {
          providerApiKey = key.apiKey;
        }
      }

      const narrationInput = {
        worldName: world.name,
        genre: world.genre,
        mood: world.mood,
        tagline: world.tagline,
        mapName: activeMap.name,
        mapBiome,
        prompt: `Turn: ${nextTurn}\nObjective index: ${run.objectiveIndex}\nCurrent objective: ${objectiveText}`,
      };
      const prompt = buildPrompt("narration", narrationInput);
      const model = defaultModelForProvider(providerInUse);

      if (providerInUse === "eliza") {
        narrationText = `Turn ${nextTurn}: ${world.name} tightens around the party in ${activeMap.name}. Objective in focus: ${objectiveText}.`;
      } else {
        const generated = await generateTextForProvider({
          provider: providerInUse,
          kind: "narration",
          model,
          prompt,
          input: narrationInput,
          apiKey: providerApiKey,
        });
        narrationUsage = generated.usage;
        const parsed = extractJsonFromText(generated.text);
        narrationText = selectNarrationFromNarrationOutput(parsed, generated.text);
      }

      await ctx.runMutation(internal.vttSessions.internalPostChatMessage, {
        sessionId: run.sessionId,
        actorUserId: run.ownerUserId,
        sender: "NARRATOR",
        text: narrationText,
        meta: { turn: nextTurn, provider: providerInUse, model, source: "agent_run" },
      });

      await ctx.runMutation(internal.vttAiUsage.internalRecordUsageEvent, {
        actorUserId: run.ownerUserId,
        provider: providerInUse,
        model,
        kind: "narration",
        inputTokens: narrationUsage?.inputTokens,
        outputTokens: narrationUsage?.outputTokens,
        totalTokens: narrationUsage?.totalTokens,
        finishReason: narrationUsage?.finishReason,
        requestId: narrationUsage?.requestId,
        sessionId: run.sessionId,
        worldId: run.worldId,
        runId: run._id,
        metadata: {
          source: "agent_run_tick",
          turn: nextTurn,
          mapId: activeMap._id,
          objectiveIndex: run.objectiveIndex,
        },
      });

      const playerRollTotals: number[] = [];
      for (let index = 0; index < run.playerCount; index += 1) {
        const name = playerName(index);
        const token = tokenByName.get(name);
        if (!token) continue;

        const deterministicTotal = run.seed + nextTurn * 100 + index;
        playerRollTotals.push(deterministicTotal);

        await ctx.runMutation(internal.vttSessions.internalRollDice, {
          sessionId: run.sessionId,
          actorUserId: run.ownerUserId,
          expression: "1d20+2",
          total: deterministicTotal,
          result: {
            formula: "seed + turn*100 + playerIndex",
            seed: run.seed,
            turn: nextTurn,
            playerIndex: index,
            source: "agent_run",
            player: name,
          },
        });

        await ctx.runMutation(internal.vttSessions.internalPostChatMessage, {
          sessionId: run.sessionId,
          actorUserId: run.ownerUserId,
          sender: name,
          text: `${name} takes action (1d20+2) and rolls ${deterministicTotal}.`,
          meta: { turn: nextTurn, source: "agent_run", player: name },
        });

        const nextPos = computeNextTokenPosition(
          { x: token.x, y: token.y },
          makeSeededRng(run.seed + nextTurn * 1000 + index),
        );

        await ctx.runMutation(internal.vttMaps.internalUpsertTokenForSession, {
          actorUserId: run.ownerUserId,
          worldId: run.worldId,
          mapId: activeMap._id,
          sessionId: run.sessionId,
          tokenId: token._id,
          name,
          x: nextPos.x,
          y: nextPos.y,
          layer: token.layer ?? "mid",
          color: token.color,
        });
      }

      const next = advanceRunState({
        turn: nextTurn - 1,
        objectiveIndex: run.objectiveIndex,
        maxTurns: run.maxTurns,
        objectiveTarget: 2,
        rollTotals: playerRollTotals,
        objectiveThreshold: 12,
      });

      if (next.objectiveAdvanced) {
        const completedObjective = objectives[Math.max(0, next.nextObjectiveIndex - 1)] ?? "Objective";
        await ctx.runMutation(internal.vttSessions.internalPostChatMessage, {
          sessionId: run.sessionId,
          actorUserId: run.ownerUserId,
          sender: "SYSTEM",
          text: `Objective completed: ${completedObjective}`,
          meta: { turn: nextTurn, source: "agent_run", objectiveIndex: next.nextObjectiveIndex },
        });
      }

      await ctx.runMutation(internalAgentRuns.internalPatchRun, {
        runId: run._id,
        objectiveIndex: next.nextObjectiveIndex,
        status: next.completed ? "completed" : args.singleStep ? "stopped" : "running",
        lastError: "",
      });

      if (next.completed) {
        await ctx.runMutation(internal.vttSessions.internalPostChatMessage, {
          sessionId: run.sessionId,
          actorUserId: run.ownerUserId,
          sender: "SYSTEM",
          text: `AI one-shot complete in ${next.nextTurn} turns.`,
          meta: { source: "agent_run", turn: next.nextTurn },
        });
        return { ok: true, completed: true };
      }

      if (!args.singleStep) {
        await ctx.scheduler.runAfter(run.tickIntervalMs, internalTickRunRef, {
          runId: run._id,
        });
      }

      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI one-shot tick failed";
      await ctx.runMutation(internalAgentRuns.internalPatchRun, {
        runId: run._id,
        status: "failed",
        lastError: message,
      });
      return { ok: false, error: message };
    }
  },
});

export const getInternalRun = internalQuery({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.runId);
  },
});

export const getInternalSession = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const getInternalWorld = internalQuery({
  args: { worldId: v.id("worlds") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.worldId);
  },
});

export const getInternalMapsForWorld = internalQuery({
  args: { worldId: v.id("worlds") },
  handler: async (ctx, args) => {
    const maps = await ctx.db
      .query("maps")
      .withIndex("by_world", (q) => q.eq("worldId", args.worldId))
      .collect();
    return maps.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getInternalSessionMapTokens = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    mapId: v.id("maps"),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("tokens")
      .withIndex("by_map", (q) => q.eq("mapId", args.mapId))
      .collect();

    return tokens
      .filter((token) => token.sessionId === args.sessionId)
      .map((token) => ({
        ...token,
        data: token.dataJson ? JSON.parse(token.dataJson) : {},
      }));
  },
});

export const startRun = mutation({
  args: {
    sessionId: v.id("sessions"),
    provider: vVttProvider,
    seed: v.number(),
    playerCount: v.optional(v.number()),
    maxTurns: v.optional(v.number()),
    tickIntervalMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "active") throw new Error("Session must be active");

    const participant = await getParticipantByUserId(ctx, session._id, user._id);
    if (!participant || participant.role !== "gm") {
      throw new Error("Only GM participants can start AI one-shot runs");
    }

    const existingRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    const existing = existingRuns.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;

    const now = Date.now();
    const playerCount = clampInteger(args.playerCount ?? 2, 1, 3);
    const maxTurns = clampInteger(args.maxTurns ?? 8, 1, 20);
    const tickIntervalMs = clampInteger(args.tickIntervalMs ?? 3500, 500, 30000);

    if (existing && existing.status === "running") {
      return { runId: existing._id, status: existing.status };
    }
    if (existing) {
      await ctx.db.patch(existing._id, {
        ownerUserId: user._id,
        provider: args.provider,
        seed: args.seed,
        playerCount,
        turn: 0,
        maxTurns,
        tickIntervalMs,
        objectiveIndex: 0,
        status: "running",
        lastError: "",
        updatedAt: now,
      });
      await ctx.scheduler.runAfter(0, internalTickRunRef, {
        runId: existing._id,
      });
      return { runId: existing._id, status: "running" as const };
    }

    const runId = await ctx.db.insert("agentRuns", {
      sessionId: session._id,
      worldId: session.worldId,
      ownerUserId: user._id,
      provider: args.provider,
      seed: args.seed,
      playerCount,
      turn: 0,
      maxTurns,
      tickIntervalMs,
      objectiveIndex: 0,
      status: "running",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internalTickRunRef, { runId });
    return { runId, status: "running" as const };
  },
});

export const stopRun = mutation({
  args: {
    runId: v.id("agentRuns"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Run not found");
    if (run.ownerUserId !== user._id) throw new Error("Forbidden");

    const participant = await getParticipantByUserId(ctx, run.sessionId, user._id);
    if (!participant || participant.role !== "gm") {
      throw new Error("Only GM participants can stop AI one-shot runs");
    }

    await ctx.db.patch(run._id, {
      status: "stopped",
      updatedAt: Date.now(),
    });

    return { runId: run._id, status: "stopped" as const };
  },
});

export const stepRun = mutation({
  args: {
    runId: v.id("agentRuns"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Run not found");
    if (run.ownerUserId !== user._id) throw new Error("Forbidden");

    const participant = await getParticipantByUserId(ctx, run.sessionId, user._id);
    if (!participant || participant.role !== "gm") {
      throw new Error("Only GM participants can step AI one-shot runs");
    }

    if (run.status === "completed" || run.status === "failed") {
      throw new Error("Run is not active");
    }

    if (run.status === "running") {
      throw new Error("Run is already running. Stop it before stepping.");
    }

    await ctx.db.patch(run._id, {
      status: "running",
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internalTickRunRef, {
      runId: run._id,
      singleStep: true,
    });
    return { runId: run._id, status: "running" as const };
  },
});
