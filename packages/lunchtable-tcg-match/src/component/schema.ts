import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Match metadata — status, players, mode, winner
  matches: defineTable({
    hostId: v.string(),
    awayId: v.union(v.string(), v.null()),
    mode: v.union(v.literal("pvp"), v.literal("story")),
    status: v.union(
      v.literal("waiting"),
      v.literal("active"),
      v.literal("ended")
    ),
    winner: v.optional(v.union(v.literal("host"), v.literal("away"))),
    endReason: v.optional(v.string()),
    hostDeck: v.array(v.string()),
    awayDeck: v.union(v.array(v.string()), v.null()),
    isAIOpponent: v.boolean(),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_host", ["hostId"])
    .index("by_away", ["awayId"])
    .index("by_created", ["createdAt"]),

  // Materialized game state snapshots (source of truth for current state)
  matchSnapshots: defineTable({
    matchId: v.id("matches"),
    version: v.number(),
    state: v.string(), // JSON-serialized GameState
    createdAt: v.number(),
  })
    .index("by_match", ["matchId"])
    .index("by_match_version", ["matchId", "version"]),

  // Append-only event log (for replays and animations)
  matchEvents: defineTable({
    matchId: v.id("matches"),
    version: v.number(),
    events: v.string(), // JSON-serialized EngineEvent[]
    command: v.string(), // JSON-serialized Command that produced these events
    seat: v.union(v.literal("host"), v.literal("away")),
    createdAt: v.number(),
  })
    .index("by_match", ["matchId"])
    .index("by_match_version", ["matchId", "version"]),

  // Pending player decisions (optional triggers, chain responses)
  matchPrompts: defineTable({
    matchId: v.id("matches"),
    seat: v.union(v.literal("host"), v.literal("away")),
    promptType: v.union(
      v.literal("chain_response"),
      v.literal("optional_trigger"),
      v.literal("replay_decision"),
      v.literal("discard")
    ),
    data: v.optional(v.string()), // JSON-serialized prompt-specific data
    resolved: v.boolean(),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_match", ["matchId"])
    .index("by_match_seat", ["matchId", "seat"])
    .index("by_match_unresolved", ["matchId", "resolved"]),
});
