export interface TTGPluginConfig {
  apiUrl: string;
  apiKey: string;
}

export type TTGSessionRole = "player" | "observer" | "npc";
export type TTGGenerationProvider =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "vercel_gateway"
  | "eliza";

export interface TTGAgentMe {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
}

export interface TTGSessionResult {
  sessionId: string;
  status: string;
}

export interface TTGJoinSessionResult {
  joined: boolean;
  role: string;
}

export interface TTGGenerationJobCreateResult {
  jobId: string;
}

export interface TTGGenerationJob {
  _id: string;
  kind: string;
  provider: string;
  status: string;
  error?: string;
  input: Record<string, unknown>;
  output: unknown;
  createdAt: number;
  updatedAt: number;
}

export interface TTGDiceCommandPayload {
  expression: string;
  total: number;
  result?: Record<string, unknown>;
}

export interface TTGTokenUpsertPayload {
  tokenId?: string;
  worldId?: string;
  mapId: string;
  name: string;
  x: number;
  y: number;
  layer?: "ground" | "mid" | "air";
  color?: string;
  data?: Record<string, unknown>;
}
