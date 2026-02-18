import type { AiProvider, GenerationRequest } from "../providerRegistry";

export const openrouterProvider: AiProvider = {
  id: "openrouter",
  async generate(request: GenerationRequest) {
    return {
      provider: "openrouter",
      model: request.model ?? "openai/gpt-4.1-mini",
      text: `OpenRouter scaffold: ${request.prompt}`,
    };
  },
};
