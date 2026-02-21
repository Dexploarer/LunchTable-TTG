import { TTGClient } from "./client";
import type {
  TTGDiceCommandPayload,
  TTGGenerationProvider,
  TTGPluginConfig,
  TTGSessionRole,
  TTGTokenUpsertPayload,
} from "./types";

export function createTTGPlugin(config: TTGPluginConfig) {
  const client = new TTGClient(config.apiUrl, config.apiKey);

  return {
    name: "lunchtable-ttg-plugin",
    description: "LunchTable TTG VTT plugin for agent runtimes",
    actions: {
      TTG_STATUS: async () => client.me(),
      TTG_START_SESSION: async ({ worldId, title }: { worldId: string; title?: string }) =>
        client.createSession(worldId, title),
      TTG_JOIN_SESSION: async ({
        sessionId,
        role,
      }: {
        sessionId: string;
        role?: TTGSessionRole;
      }) => client.joinSession(sessionId, role),
      TTG_DICE_ROLL: async ({
        sessionId,
        payload,
      }: {
        sessionId: string;
        payload: TTGDiceCommandPayload;
      }) => client.rollDice(sessionId, payload),
      TTG_TOKEN_UPSERT: async ({
        sessionId,
        payload,
      }: {
        sessionId: string;
        payload: TTGTokenUpsertPayload;
      }) => client.upsertToken(sessionId, payload),
      TTG_GENERATION_CREATE: async ({
        worldId,
        kind,
        provider,
        input,
      }: {
        worldId?: string;
        kind: string;
        provider: TTGGenerationProvider;
        input?: Record<string, unknown>;
      }) => client.createGenerationJob({ worldId, kind, provider, input }),
      TTG_GENERATION_GET: async ({ jobId }: { jobId: string }) => client.getGenerationJob(jobId),
      TTG_INVOKE_NARRATOR: async ({
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
      }) =>
        client.invokeNarrator({
          sessionId,
          provider,
          prompt,
          mapName,
          mapBiome,
          worldName,
          genre,
          mood,
          tagline,
        }),
    },
  };
}

export * from "./client";
export * from "./types";
