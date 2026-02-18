export interface GenerationRequest {
  model?: string;
  prompt: string;
  context?: Record<string, unknown>;
}

export interface GenerationResponse {
  provider: string;
  model: string;
  text: string;
}

export interface AiProvider {
  id: string;
  generate: (request: GenerationRequest) => Promise<GenerationResponse>;
}

const providers = new Map<string, AiProvider>();

export function registerAiProvider(provider: AiProvider) {
  providers.set(provider.id, provider);
}

export function getAiProvider(providerId: string) {
  return providers.get(providerId) ?? providers.get("openai") ?? null;
}

export function listAiProviders() {
  return Array.from(providers.values()).map((provider) => provider.id);
}
