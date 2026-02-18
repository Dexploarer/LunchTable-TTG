type SessionPostKind = "join" | "commands";
type WorldPostKind = "fork" | "publish";

const SESSION_JOIN_PATTERN = /^\/api\/vtt\/sessions\/(?<sessionId>[^/]+)\/join$/;
const SESSION_COMMANDS_PATTERN = /^\/api\/vtt\/sessions\/(?<sessionId>[^/]+)\/commands$/;
const SESSION_VIEW_PATTERN = /^\/api\/vtt\/sessions\/(?<sessionId>[^/]+)\/view$/;
const WORLD_PATCH_PATTERN = /^\/api\/vtt\/worlds\/(?<worldId>[^/]+)$/;
const WORLD_FORK_PATTERN = /^\/api\/vtt\/worlds\/(?<worldId>[^/]+)\/fork$/;
const WORLD_PUBLISH_PATTERN = /^\/api\/vtt\/worlds\/(?<worldId>[^/]+)\/publish$/;
const GENERATION_JOB_PATTERN = /^\/api\/vtt\/generation\/jobs\/(?<jobId>[^/]+)$/;

function decodePathValue(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

function getNamedMatch(pathname: string, pattern: RegExp, name: string) {
  const match = pathname.match(pattern);
  const rawValue = match?.groups?.[name];
  if (!rawValue) return null;
  return decodePathValue(rawValue);
}

export function parseAgentApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token.startsWith("ttg_")) return null;
  return token.length > 4 ? token : null;
}

export function parseSessionPostRoute(
  pathname: string,
): { kind: SessionPostKind; sessionId: string } | null {
  const joinId = getNamedMatch(pathname, SESSION_JOIN_PATTERN, "sessionId");
  if (joinId) return { kind: "join", sessionId: joinId };

  const commandsId = getNamedMatch(pathname, SESSION_COMMANDS_PATTERN, "sessionId");
  if (commandsId) return { kind: "commands", sessionId: commandsId };

  return null;
}

export function parseSessionViewRoute(pathname: string): { sessionId: string } | null {
  const sessionId = getNamedMatch(pathname, SESSION_VIEW_PATTERN, "sessionId");
  return sessionId ? { sessionId } : null;
}

export function parseWorldPatchRoute(pathname: string): { worldId: string } | null {
  const worldId = getNamedMatch(pathname, WORLD_PATCH_PATTERN, "worldId");
  return worldId ? { worldId } : null;
}

export function parseWorldPostRoute(
  pathname: string,
): { kind: WorldPostKind; worldId: string } | null {
  const forkId = getNamedMatch(pathname, WORLD_FORK_PATTERN, "worldId");
  if (forkId) return { kind: "fork", worldId: forkId };

  const publishId = getNamedMatch(pathname, WORLD_PUBLISH_PATTERN, "worldId");
  if (publishId) return { kind: "publish", worldId: publishId };

  return null;
}

export function parseGenerationJobRoute(pathname: string): { jobId: string } | null {
  const jobId = getNamedMatch(pathname, GENERATION_JOB_PATTERN, "jobId");
  return jobId ? { jobId } : null;
}
