import type { AiProvider, GenerationRequest } from "../providerRegistry";

export const vercelGatewayProvider: AiProvider = {
  id: "vercel_gateway",
  async generate(request: GenerationRequest) {
    return {
      provider: "vercel_gateway",
      model: request.model ?? "openai/gpt-4.1-mini",
      text: `Vercel Gateway scaffold: ${request.prompt}`,
    };
  },
};
