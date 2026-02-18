import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id, TableNames } from "./_generated/dataModel";
import {
  parseAgentApiKey,
  parseGenerationJobRoute,
  parseSessionPostRoute,
  parseSessionViewRoute,
  parseWorldPatchRoute,
  parseWorldPostRoute,
} from "./httpRoutes";

const http = httpRouter();
const registeredOptions = new Set<string>();

const ALLOWED_HEADERS = ["Content-Type", "Authorization"];
type HttpMethod = "GET" | "POST" | "PATCH";
type HttpHandler = (ctx: ActionCtx, request: Request) => Promise<Response>;
type SessionRole = "player" | "observer" | "npc";
type WorldVisibility = "public" | "private" | "unlisted";
type WorldRulesPayload = {
  name: string;
  summary: string;
  turnLoop: string[];
  failForwardPolicy: string;
  escalationTrack: string;
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

function corsHandler(handler: HttpHandler) {
  return async (ctx: ActionCtx, request: Request) => {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = await handler(ctx, request);
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS.join(", "));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

function corsRoute({
  path,
  method,
  handler,
}: {
  path: string;
  method: HttpMethod;
  handler: HttpHandler;
}) {
  http.route({
    path,
    method,
    handler: httpAction(corsHandler(handler)),
  });

  if (!registeredOptions.has(path)) {
    registeredOptions.add(path);
    http.route({
      path,
      method: "OPTIONS",
      handler: httpAction(corsHandler(async () => new Response(null, { status: 204 }))),
    });
  }
}

function corsPrefixRoute({
  pathPrefix,
  method,
  handler,
}: {
  pathPrefix: string;
  method: HttpMethod;
  handler: HttpHandler;
}) {
  http.route({
    pathPrefix,
    method,
    handler: httpAction(corsHandler(handler)),
  });

  if (!registeredOptions.has(pathPrefix)) {
    registeredOptions.add(pathPrefix);
    http.route({
      pathPrefix,
      method: "OPTIONS",
      handler: httpAction(corsHandler(async () => new Response(null, { status: 204 }))),
    });
  }
}

async function parseJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseSessionRole(value: unknown): SessionRole | undefined {
  if (value === "player" || value === "observer" || value === "npc") return value;
  return undefined;
}

function parseWorldVisibility(value: unknown, fallback: WorldVisibility): WorldVisibility {
  if (value === "public" || value === "private" || value === "unlisted") return value;
  return fallback;
}

function parseOptionalWorldVisibility(value: unknown): WorldVisibility | undefined {
  return value === "public" || value === "private" || value === "unlisted" ? value : undefined;
}

function parseWorldRules(value: unknown): WorldRulesPayload | undefined {
  const rules = asObject(value);
  if (!rules) return undefined;

  const turnLoop = Array.isArray(rules.turnLoop)
    ? rules.turnLoop.filter((item): item is string => typeof item === "string")
    : null;

  if (
    typeof rules.name !== "string" ||
    typeof rules.summary !== "string" ||
    !turnLoop ||
    typeof rules.failForwardPolicy !== "string" ||
    typeof rules.escalationTrack !== "string"
  ) {
    return undefined;
  }

  return {
    name: rules.name,
    summary: rules.summary,
    turnLoop,
    failForwardPolicy: rules.failForwardPolicy,
    escalationTrack: rules.escalationTrack,
  };
}

function toId<T extends TableNames>(value: string): Id<T> {
  return value as Id<T>;
}

async function authenticateAgent(ctx: ActionCtx, request: Request) {
  const apiKey = parseAgentApiKey(request.headers.get("Authorization"));
  if (!apiKey) return null;

  const bytes = new TextEncoder().encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const agent = await ctx.runQuery(api.vttAgents.getAgentByKeyHash, { apiKeyHash: hash });
  if (!agent || !agent.isActive) return null;

  await ctx.runMutation(api.vttAgents.touchAgent, { agentId: agent._id });
  return agent;
}

corsRoute({
  path: "/api/vtt/agents/register",
  method: "POST",
  handler: async (ctx, request) => {
    const body = asObject(await parseJson(request));
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return errorResponse("name is required", 400);
    }

    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const keyBody = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const apiKey = `ttg_${keyBody}`;
    const apiKeyPrefix = `ttg_${keyBody.slice(0, 8)}...`;
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKey));
    const apiKeyHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const result = await ctx.runMutation(api.vttAgents.registerAgent, {
      name,
      apiKeyHash,
      apiKeyPrefix,
    });

    return jsonResponse({
      agentId: result.agentId,
      userId: result.userId,
      apiKey,
      apiKeyPrefix,
      warning: "Store this API key securely. It is shown only once.",
    });
  },
});

corsRoute({
  path: "/api/vtt/agents/me",
  method: "GET",
  handler: async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    return jsonResponse({
      id: agent._id,
      name: agent.name,
      userId: agent.userId,
      apiKeyPrefix: agent.apiKeyPrefix,
      isActive: agent.isActive,
      createdAt: agent.createdAt,
      lastSeenAt: agent.lastSeenAt,
    });
  },
});

corsRoute({
  path: "/api/vtt/sessions",
  method: "POST",
  handler: async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    const body = asObject(await parseJson(request));
    const worldId = typeof body?.worldId === "string" ? body.worldId : null;
    if (!worldId) return errorResponse("worldId is required", 400);

    const result = await ctx.runMutation(api.vttAgents.agentCreateSession, {
      agentUserId: agent.userId,
      worldId: toId<"worlds">(worldId),
      title: typeof body?.title === "string" ? body.title : undefined,
    });

    return jsonResponse({ sessionId: result.sessionId, status: "active" });
  },
});

corsPrefixRoute({
  pathPrefix: "/api/vtt/sessions/",
  method: "POST",
  handler: async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    const route = parseSessionPostRoute(new URL(request.url).pathname);
    if (!route) return errorResponse("Not found", 404);

    const body = asObject(await parseJson(request));

    if (route.kind === "join") {
      const role = parseSessionRole(body?.role);
      const result = await ctx.runMutation(api.vttAgents.agentJoinSession, {
        agentUserId: agent.userId,
        sessionId: toId<"sessions">(route.sessionId),
        role,
      });
      return jsonResponse(result);
    }

    const command = typeof body?.command === "string" ? body.command : "NOOP";
    const result = await ctx.runMutation(api.vttAgents.agentPostCommand, {
      agentUserId: agent.userId,
      sessionId: toId<"sessions">(route.sessionId),
      command,
      payload: body?.payload ?? {},
    });
    return jsonResponse(result);
  },
});

corsPrefixRoute({
  pathPrefix: "/api/vtt/sessions/",
  method: "GET",
  handler: async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    const route = parseSessionViewRoute(new URL(request.url).pathname);
    if (!route) return errorResponse("Not found", 404);

    const result = await ctx.runQuery(api.vttAgents.agentSessionView, {
      agentUserId: agent.userId,
      sessionId: toId<"sessions">(route.sessionId),
    });

    return jsonResponse(result ?? { session: null });
  },
});

corsRoute({
  path: "/api/vtt/worlds",
  method: "POST",
  handler: async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    const body = asObject(await parseJson(request));
    const name = typeof body?.name === "string" ? body.name : "Untitled World";
    const result = await ctx.runMutation(api.vttAgents.agentCreateWorld, {
      agentUserId: agent.userId,
      name,
      tagline: typeof body?.tagline === "string" ? body.tagline : "",
      genre: typeof body?.genre === "string" ? body.genre : "Custom",
      mood: typeof body?.mood === "string" ? body.mood : "Neutral",
      visibility: parseWorldVisibility(body?.visibility, "private"),
      recommendedPartySize: typeof body?.recommendedPartySize === "string" ? body.recommendedPartySize : undefined,
      sessionLength: typeof body?.sessionLength === "string" ? body.sessionLength : undefined,
      rules: parseWorldRules(body?.rules),
    });

    return jsonResponse(result, 201);
  },
});

corsPrefixRoute({
  pathPrefix: "/api/vtt/worlds/",
  method: "PATCH",
  handler: async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    const route = parseWorldPatchRoute(new URL(request.url).pathname);
    if (!route) return errorResponse("Not found", 404);

    const body = asObject(await parseJson(request));

    const result = await ctx.runMutation(api.vttAgents.agentUpdateWorld, {
      agentUserId: agent.userId,
      worldId: toId<"worlds">(route.worldId),
      name: typeof body?.name === "string" ? body.name : undefined,
      tagline: typeof body?.tagline === "string" ? body.tagline : undefined,
      genre: typeof body?.genre === "string" ? body.genre : undefined,
      mood: typeof body?.mood === "string" ? body.mood : undefined,
      visibility: parseOptionalWorldVisibility(body?.visibility),
      recommendedPartySize:
        typeof body?.recommendedPartySize === "string" ? body.recommendedPartySize : undefined,
      sessionLength: typeof body?.sessionLength === "string" ? body.sessionLength : undefined,
    });

    return jsonResponse(result);
  },
});

corsPrefixRoute({
  pathPrefix: "/api/vtt/worlds/",
  method: "POST",
  handler: async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    const route = parseWorldPostRoute(new URL(request.url).pathname);
    if (!route) return errorResponse("Not found", 404);

    if (route.kind === "fork") {
      const result = await ctx.runMutation(api.vttAgents.agentForkWorld, {
        agentUserId: agent.userId,
        worldId: toId<"worlds">(route.worldId),
      });
      return jsonResponse(result, 201);
    }

    const body = asObject(await parseJson(request));
    const tags = Array.isArray(body?.tags)
      ? body.tags.filter((value): value is string => typeof value === "string")
      : undefined;

    const result = await ctx.runMutation(api.vttAgents.agentPublishWorld, {
      agentUserId: agent.userId,
      worldId: toId<"worlds">(route.worldId),
      title: typeof body?.title === "string" ? body.title : undefined,
      description: typeof body?.description === "string" ? body.description : undefined,
      tags,
    });
    return jsonResponse(result);
  },
});

corsRoute({
  path: "/api/vtt/discovery/worlds",
  method: "GET",
  handler: async (ctx, request) => {
    const search = new URL(request.url).searchParams.get("search") ?? undefined;
    const worlds = await ctx.runQuery(api.vttDiscovery.listDiscoveryWorlds, { search });
    return jsonResponse(worlds);
  },
});

corsRoute({
  path: "/api/vtt/discovery/lfg",
  method: "GET",
  handler: async (ctx, request) => {
    const statusParam = new URL(request.url).searchParams.get("status");
    const status =
      statusParam === "open" || statusParam === "filled" || statusParam === "closed"
        ? statusParam
        : undefined;

    const posts = await ctx.runQuery(api.vttDiscovery.listLfgPosts, { status });
    return jsonResponse(posts);
  },
});

corsRoute({
  path: "/api/vtt/generation/jobs",
  method: "POST",
  handler: async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    const body = asObject(await parseJson(request));
    const kind = typeof body?.kind === "string" ? body.kind : "world";
    const provider = typeof body?.provider === "string" ? body.provider : "openai";

    const result = await ctx.runMutation(api.vttAgents.agentCreateGenerationJob, {
      agentUserId: agent.userId,
      worldId:
        typeof body?.worldId === "string" ? toId<"worlds">(body.worldId) : undefined,
      kind,
      provider,
      input: body?.input ?? {},
    });

    return jsonResponse(result, 201);
  },
});

corsPrefixRoute({
  pathPrefix: "/api/vtt/generation/jobs/",
  method: "GET",
  handler: async (ctx, request) => {
    const agent = await authenticateAgent(ctx, request);
    if (!agent) return errorResponse("Unauthorized", 401);

    const route = parseGenerationJobRoute(new URL(request.url).pathname);
    if (!route) return errorResponse("Not found", 404);

    const result = await ctx.runQuery(api.vttAgents.agentGetGenerationJob, {
      agentUserId: agent.userId,
      jobId: toId<"generationJobs">(route.jobId),
    });
    if (!result) return errorResponse("Job not found", 404);

    return jsonResponse(result);
  },
});

export default http;
