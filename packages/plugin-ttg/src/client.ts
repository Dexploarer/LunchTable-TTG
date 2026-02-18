import type { TTGAgentMe, TTGSessionResult } from "./types";

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

  sessionView(sessionId: string) {
    return this.request(`/api/vtt/sessions/${sessionId}/view`);
  }

  postCommand(sessionId: string, command: string, payload: Record<string, unknown> = {}) {
    return this.request(`/api/vtt/sessions/${sessionId}/commands`, {
      method: "POST",
      body: JSON.stringify({ command, payload }),
    });
  }
}
