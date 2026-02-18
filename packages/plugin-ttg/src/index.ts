import { TTGClient } from "./client";
import type { TTGPluginConfig } from "./types";

export function createTTGPlugin(config: TTGPluginConfig) {
  const client = new TTGClient(config.apiUrl, config.apiKey);

  return {
    name: "lunchtable-ttg-plugin",
    description: "LunchTable TTG VTT plugin for agent runtimes",
    actions: {
      TTG_STATUS: async () => client.me(),
      TTG_START_SESSION: async ({ worldId, title }: { worldId: string; title?: string }) =>
        client.createSession(worldId, title),
    },
  };
}

export * from "./client";
export * from "./types";
