import type { AiProvider, GenerationRequest } from "../providerRegistry";

export const anthropicProvider: AiProvider = {
  id: "anthropic",
  async generate(request: GenerationRequest) {
    return {
      provider: "anthropic",
      model: request.model ?? "claude-3-7-sonnet",
      text: `Anthropic scaffold: ${request.prompt}`,
    };
  },
};
