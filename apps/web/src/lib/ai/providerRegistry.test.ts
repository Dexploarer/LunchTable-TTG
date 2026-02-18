import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

describe("providerRegistry", () => {
  it("falls back to openai when provider id is missing", async () => {
    const { registerAiProvider, getAiProvider } = await import("./providerRegistry");
    const { openaiProvider } = await import("./providers/openai");

    registerAiProvider(openaiProvider);

    const provider = getAiProvider("missing-provider");
    expect(provider?.id).toBe("openai");
  });

  it("registers all builtin providers once", async () => {
    const { ensureAiProvidersRegistered } = await import("./index");
    const { listAiProviders } = await import("./providerRegistry");

    ensureAiProvidersRegistered();
    ensureAiProvidersRegistered();

    expect(listAiProviders().sort()).toEqual(["anthropic", "eliza", "openai"]);
  });

  it("supports deterministic scaffold responses", async () => {
    const { ensureAiProvidersRegistered } = await import("./index");
    const { getAiProvider } = await import("./providerRegistry");

    ensureAiProvidersRegistered();

    const provider = getAiProvider("anthropic");
    if (!provider) throw new Error("provider missing");

    const response = await provider.generate({ prompt: "build world" });
    expect(response.provider).toBe("anthropic");
    expect(response.model).toBe("claude-3-7-sonnet");
    expect(response.text).toContain("build world");
  });
});
