import { registerAiProvider } from "./providerRegistry";
import { openaiProvider } from "./providers/openai";
import { anthropicProvider } from "./providers/anthropic";
import { elizaProvider } from "./providers/eliza";

let initialized = false;

export function ensureAiProvidersRegistered() {
  if (initialized) return;
  registerAiProvider(openaiProvider);
  registerAiProvider(anthropicProvider);
  registerAiProvider(elizaProvider);
  initialized = true;
}
