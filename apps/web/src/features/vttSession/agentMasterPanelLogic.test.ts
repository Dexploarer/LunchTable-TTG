import { describe, expect, it } from "vitest";
import {
  formatProviderFallbackMessage,
  normalizeAgentRunFormState,
} from "./agentMasterPanelLogic";

describe("agentMasterPanelLogic", () => {
  it("clamps runtime values to allowed ranges", () => {
    const normalized = normalizeAgentRunFormState({
      provider: "eliza",
      seed: 12.8,
      playerCount: 9,
      maxTurns: 0,
      tickIntervalMs: 100_000,
    });

    expect(normalized.seed).toBe(12);
    expect(normalized.playerCount).toBe(3);
    expect(normalized.maxTurns).toBe(1);
    expect(normalized.tickIntervalMs).toBe(30000);
  });

  it("formats provider fallback messages", () => {
    expect(formatProviderFallbackMessage("openai")).toContain("openai");
    expect(formatProviderFallbackMessage("anthropic")).toContain("anthropic");
    expect(formatProviderFallbackMessage("openrouter")).toContain("openrouter");
    expect(formatProviderFallbackMessage("vercel_gateway")).toContain("vercel_gateway");
  });
});
