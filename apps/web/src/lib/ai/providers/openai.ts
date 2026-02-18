import type { AiProvider, GenerationRequest } from "../providerRegistry";

export const openaiProvider: AiProvider = {
  id: "openai",
  async generate(request: GenerationRequest) {
    return {
      provider: "openai",
      model: request.model ?? "gpt-4.1-mini",
      text: `OpenAI scaffold: ${request.prompt}`,
    };
  },
};
