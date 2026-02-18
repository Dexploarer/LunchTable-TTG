import { registerAiProvider } from "./providerRegistry";
import { openaiProvider } from "./providers/openai";
import { anthropicProvider } from "./providers/anthropic";
import { openrouterProvider } from "./providers/openrouter";
import { vercelGatewayProvider } from "./providers/vercelGateway";
import { elizaProvider } from "./providers/eliza";

let initialized = false;

export function ensureAiProvidersRegistered() {
  if (initialized) return;
  registerAiProvider(openaiProvider);
  registerAiProvider(anthropicProvider);
  registerAiProvider(openrouterProvider);
  registerAiProvider(vercelGatewayProvider);
  registerAiProvider(elizaProvider);
  initialized = true;
}
