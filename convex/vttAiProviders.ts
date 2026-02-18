import { v } from "convex/values";

export const VTT_PROVIDER_VALUES = [
  "openai",
  "anthropic",
  "openrouter",
  "vercel_gateway",
  "eliza",
] as const;

export type VttProvider = (typeof VTT_PROVIDER_VALUES)[number];
export type ExternalVttProvider = Exclude<VttProvider, "eliza">;

export const vVttProvider = v.union(
  v.literal("openai"),
  v.literal("anthropic"),
  v.literal("openrouter"),
  v.literal("vercel_gateway"),
  v.literal("eliza"),
);

export function isExternalVttProvider(provider: string): provider is ExternalVttProvider {
  return (
    provider === "openai" ||
    provider === "anthropic" ||
    provider === "openrouter" ||
    provider === "vercel_gateway"
  );
}

export function formatProviderFallbackMessage(provider: ExternalVttProvider) {
  return `No active ${provider} BYOK key found. Falling back to eliza.`;
}
