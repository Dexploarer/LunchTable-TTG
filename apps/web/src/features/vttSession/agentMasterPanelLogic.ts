export type AgentRunProvider = "openai" | "anthropic" | "openrouter" | "vercel_gateway" | "eliza";

export interface AgentRunFormState {
  provider: AgentRunProvider;
  seed: number;
  playerCount: number;
  maxTurns: number;
  tickIntervalMs: number;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function normalizeAgentRunFormState(input: AgentRunFormState): AgentRunFormState {
  return {
    provider: input.provider,
    seed: Number.isFinite(input.seed) ? Math.trunc(input.seed) : 42,
    playerCount: clamp(Math.trunc(input.playerCount), 1, 3),
    maxTurns: clamp(Math.trunc(input.maxTurns), 1, 20),
    tickIntervalMs: clamp(Math.trunc(input.tickIntervalMs), 500, 30000),
  };
}

export function formatProviderFallbackMessage(provider: Exclude<AgentRunProvider, "eliza">) {
  return `No active ${provider} BYOK key found. Falling back to eliza.`;
}
