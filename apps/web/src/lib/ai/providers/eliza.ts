import type { AiProvider, GenerationRequest } from "../providerRegistry";

export const elizaProvider: AiProvider = {
  id: "eliza",
  async generate(request: GenerationRequest) {
    return {
      provider: "eliza",
      model: request.model ?? "eliza-runtime-default",
      text: `Eliza scaffold: ${request.prompt}`,
    };
  },
};
