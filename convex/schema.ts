import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vVttProvider } from "./vttAiProviders";

export default defineSchema(
  {
    users: defineTable({
      privyId: v.string(),
      username: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      avatarPath: v.optional(v.string()),
      activeWorkspaceId: v.optional(v.id("workspaces")),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    })
      .index("by_privyId", ["privyId"])
      .index("by_username", ["username"]),

    agents: defineTable({
      name: v.string(),
      apiKeyHash: v.string(),
      apiKeyPrefix: v.string(),
      userId: v.id("users"),
      isActive: v.boolean(),
      createdAt: v.number(),
      lastSeenAt: v.optional(v.number()),
    })
      .index("by_apiKeyHash", ["apiKeyHash"])
      .index("by_userId", ["userId"]),

    workspaces: defineTable({
      ownerUserId: v.id("users"),
      name: v.string(),
      description: v.optional(v.string()),
      visibility: v.union(v.literal("private"), v.literal("team"), v.literal("public")),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_owner", ["ownerUserId"])
      .index("by_visibility", ["visibility"]),

    rulesets: defineTable({
      workspaceId: v.id("workspaces"),
      name: v.string(),
      summary: v.string(),
      turnLoop: v.array(v.string()),
      failForwardPolicy: v.string(),
      escalationTrack: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_workspace", ["workspaceId"]),

    worlds: defineTable({
      workspaceId: v.id("workspaces"),
      ownerUserId: v.id("users"),
      rulesetId: v.optional(v.id("rulesets")),
      name: v.string(),
      tagline: v.string(),
      genre: v.string(),
      mood: v.string(),
      recommendedPartySize: v.optional(v.string()),
      sessionLength: v.optional(v.string()),
      visibility: v.union(v.literal("public"), v.literal("private"), v.literal("unlisted")),
      isPublished: v.boolean(),
      latestVersionId: v.optional(v.id("worldVersions")),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_workspace", ["workspaceId"])
      .index("by_owner", ["ownerUserId"])
      .index("by_visibility", ["visibility"]),

    worldVersions: defineTable({
      worldId: v.id("worlds"),
      versionNumber: v.number(),
      snapshotJson: v.string(),
      createdBy: v.id("users"),
      createdAt: v.number(),
    }).index("by_world", ["worldId"]),

    maps: defineTable({
      worldId: v.id("worlds"),
      name: v.string(),
      biome: v.optional(v.string()),
      camera: v.optional(v.string()),
      lightingPreset: v.optional(v.string()),
      ambience: v.array(v.string()),
      objectives: v.array(v.string()),
      sortOrder: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_world", ["worldId"]),

    mapLayers: defineTable({
      mapId: v.id("maps"),
      name: v.string(),
      layerType: v.string(),
      opacity: v.number(),
      dataJson: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_map", ["mapId"]),

    tokens: defineTable({
      worldId: v.id("worlds"),
      mapId: v.id("maps"),
      sessionId: v.optional(v.id("sessions")),
      name: v.string(),
      x: v.number(),
      y: v.number(),
      layer: v.union(v.literal("ground"), v.literal("mid"), v.literal("air")),
      color: v.optional(v.string()),
      dataJson: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_map", ["mapId"])
      .index("by_session", ["sessionId"]),

    sessions: defineTable({
      workspaceId: v.id("workspaces"),
      worldId: v.id("worlds"),
      hostUserId: v.id("users"),
      title: v.string(),
      status: v.union(v.literal("waiting"), v.literal("active"), v.literal("ended")),
      maxParticipants: v.number(),
      startedAt: v.number(),
      endedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_world", ["worldId"])
      .index("by_host", ["hostUserId"])
      .index("by_status", ["status"]),

    sessionParticipants: defineTable({
      sessionId: v.id("sessions"),
      userId: v.id("users"),
      role: v.union(v.literal("gm"), v.literal("player"), v.literal("observer"), v.literal("npc")),
      joinedAt: v.number(),
      lastActiveAt: v.number(),
      lastNarrationAt: v.optional(v.number()),
    })
      .index("by_session", ["sessionId"])
      .index("by_user", ["userId"]),

    sessionEvents: defineTable({
      sessionId: v.id("sessions"),
      actorUserId: v.id("users"),
      eventType: v.string(),
      payloadJson: v.string(),
      createdAt: v.number(),
    }).index("by_session", ["sessionId"]),

    fogStates: defineTable({
      sessionId: v.id("sessions"),
      mapId: v.id("maps"),
      fogJson: v.string(),
      updatedBy: v.id("users"),
      updatedAt: v.number(),
    })
      .index("by_session", ["sessionId"])
      .index("by_session_map", ["sessionId", "mapId"]),

    diceRolls: defineTable({
      sessionId: v.id("sessions"),
      actorUserId: v.id("users"),
      expression: v.string(),
      total: v.number(),
      resultJson: v.string(),
      createdAt: v.number(),
    }).index("by_session", ["sessionId"]),

    journals: defineTable({
      worldId: v.id("worlds"),
      sessionId: v.optional(v.id("sessions")),
      title: v.string(),
      body: v.string(),
      visibility: v.union(v.literal("private"), v.literal("party"), v.literal("public")),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_world", ["worldId"])
      .index("by_session", ["sessionId"]),

    publishListings: defineTable({
      worldId: v.id("worlds"),
      worldVersionId: v.id("worldVersions"),
      ownerUserId: v.id("users"),
      title: v.string(),
      description: v.string(),
      tags: v.array(v.string()),
      moderationStatus: v.union(
        v.literal("approved"),
        v.literal("needs_review"),
        v.literal("rejected"),
      ),
      isVisible: v.boolean(),
      rating: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_world", ["worldId"])
      .index("by_owner", ["ownerUserId"])
      .index("by_visibility", ["isVisible"]),

    worldForks: defineTable({
      sourceWorldId: v.id("worlds"),
      forkWorldId: v.id("worlds"),
      forkedBy: v.id("users"),
      createdAt: v.number(),
    })
      .index("by_source", ["sourceWorldId"])
      .index("by_forkedBy", ["forkedBy"]),

    lfgPosts: defineTable({
      worldId: v.id("worlds"),
      sessionId: v.optional(v.id("sessions")),
      hostUserId: v.id("users"),
      title: v.string(),
      description: v.string(),
      seatsOpen: v.number(),
      status: v.union(v.literal("open"), v.literal("filled"), v.literal("closed")),
      tags: v.array(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_world", ["worldId"])
      .index("by_host", ["hostUserId"]),

    providerKeys: defineTable({
      userId: v.id("users"),
      provider: v.string(),
      encryptedKey: v.string(),
      keyPreview: v.string(),
      isActive: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_provider", ["userId", "provider"]),

    moderationEvents: defineTable({
      targetType: v.string(),
      targetId: v.string(),
      status: v.union(v.literal("approved"), v.literal("needs_review"), v.literal("rejected")),
      reason: v.string(),
      detailsJson: v.optional(v.string()),
      reviewerUserId: v.optional(v.id("users")),
      createdAt: v.number(),
    })
      .index("by_target", ["targetType", "targetId"])
      .index("by_status", ["status"]),

    generationJobs: defineTable({
      actorUserId: v.id("users"),
      worldId: v.optional(v.id("worlds")),
      kind: v.string(),
      provider: v.string(),
      inputJson: v.string(),
      status: v.union(
        v.literal("queued"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
      ),
      outputJson: v.optional(v.string()),
      error: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_actor", ["actorUserId"])
      .index("by_world", ["worldId"]),

    agentRuns: defineTable({
      sessionId: v.id("sessions"),
      worldId: v.id("worlds"),
      ownerUserId: v.id("users"),
      provider: vVttProvider,
      seed: v.number(),
      playerCount: v.number(),
      turn: v.number(),
      maxTurns: v.number(),
      tickIntervalMs: v.number(),
      objectiveIndex: v.number(),
      status: v.union(
        v.literal("running"),
        v.literal("stopped"),
        v.literal("completed"),
        v.literal("failed"),
      ),
      lastError: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_session", ["sessionId"])
      .index("by_owner", ["ownerUserId"])
      .index("by_status", ["status"]),

    aiUsageEvents: defineTable({
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
      metadataJson: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_actor", ["actorUserId"])
      .index("by_provider", ["provider"])
      .index("by_session", ["sessionId"])
      .index("by_world", ["worldId"])
      .index("by_run", ["runId"]),
  },
  { schemaValidation: false },
);
