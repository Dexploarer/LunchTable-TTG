import type {
  TTGAgentMe,
  TTGDiceCommandPayload,
  TTGGenerationJob,
  TTGGenerationJobCreateResult,
  TTGGenerationProvider,
  TTGJoinSessionResult,
  TTGSessionResult,
  TTGSessionRole,
  TTGTokenUpsertPayload,
} from "./types";

export class TTGClient {
  constructor(private readonly apiUrl: string, private readonly apiKey: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`TTG API error (${response.status}): ${text}`);
    }

    return (await response.json()) as T;
  }

  me() {
    return this.request<TTGAgentMe>("/api/vtt/agents/me");
  }

  createSession(worldId: string, title?: string) {
    return this.request<TTGSessionResult>("/api/vtt/sessions", {
      method: "POST",
      body: JSON.stringify({ worldId, title }),
    });
  }

  joinSession(sessionId: string, role?: TTGSessionRole) {
    return this.request<TTGJoinSessionResult>(`/api/vtt/sessions/${sessionId}/join`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  }

  sessionView(sessionId: string) {
    return this.request(`/api/vtt/sessions/${sessionId}/view`);
  }

  postCommand(sessionId: string, command: string, payload: Record<string, unknown> = {}) {
    return this.request(`/api/vtt/sessions/${sessionId}/commands`, {
      method: "POST",
      body: JSON.stringify({ command, payload }),
    });
  }

  rollDice(sessionId: string, payload: TTGDiceCommandPayload) {
    return this.postCommand(sessionId, "DICE_ROLL", payload);
  }

  upsertToken(sessionId: string, payload: TTGTokenUpsertPayload) {
    return this.postCommand(sessionId, "TOKEN_UPSERT", payload as Record<string, unknown>);
  }

  createGenerationJob({
    worldId,
    kind,
    provider,
    input,
  }: {
    worldId?: string;
    kind: string;
    provider: TTGGenerationProvider | string;
    input?: Record<string, unknown>;
  }) {
    return this.request<TTGGenerationJobCreateResult>("/api/vtt/generation/jobs", {
      method: "POST",
      body: JSON.stringify({ worldId, kind, provider, input }),
    });
  }

  getGenerationJob(jobId: string) {
    return this.request<TTGGenerationJob>(`/api/vtt/generation/jobs/${jobId}`);
  }

  invokeNarrator({
    sessionId,
    provider,
    prompt,
    mapName,
    mapBiome,
    worldName,
    genre,
    mood,
    tagline,
  }: {
    sessionId: string;
    provider: TTGGenerationProvider;
    prompt?: string;
    mapName?: string;
    mapBiome?: string;
    worldName?: string;
    genre?: string;
    mood?: string;
    tagline?: string;
  }) {
    return this.createGenerationJob({
      kind: "narration",
      provider,
      input: {
        sessionId,
        ...(prompt ? { prompt } : {}),
        ...(mapName ? { mapName } : {}),
        ...(mapBiome ? { mapBiome } : {}),
        ...(worldName ? { worldName } : {}),
        ...(genre ? { genre } : {}),
        ...(mood ? { mood } : {}),
        ...(tagline ? { tagline } : {}),
      },
    });
  }
}
