import { describe, expect, it } from "vitest";
import {
  buildPrompt,
  defaultModelForProvider,
  extractJsonFromText,
  selectModel,
} from "./vttGeneration";

describe("vttGeneration helpers", () => {
  it("selects default models when none provided", () => {
    expect(defaultModelForProvider("openai")).toBe("gpt-4.1-mini");
    expect(defaultModelForProvider("anthropic")).toBe("claude-3-5-sonnet-20240620");
    expect(defaultModelForProvider("openrouter")).toBe("openai/gpt-4.1-mini");
    expect(defaultModelForProvider("vercel_gateway")).toBe("openai/gpt-4.1-mini");
    expect(defaultModelForProvider("eliza")).toBe("synthetic");

    expect(selectModel("openai", {})).toBe("gpt-4.1-mini");
    expect(selectModel("anthropic", {})).toBe("claude-3-5-sonnet-20240620");
    expect(selectModel("openrouter", {})).toBe("openai/gpt-4.1-mini");
    expect(selectModel("vercel_gateway", {})).toBe("openai/gpt-4.1-mini");
  });

  it("allows explicit model override in input", () => {
    expect(selectModel("openai", { model: "gpt-4.1" })).toBe("gpt-4.1");
    expect(selectModel("anthropic", { model: "claude-test" })).toBe("claude-test");
    expect(selectModel("openrouter", { model: "anthropic/claude-3.5-sonnet" })).toBe(
      "anthropic/claude-3.5-sonnet",
    );
  });

  it("extracts json objects and arrays from text", () => {
    expect(extractJsonFromText("")).toBeNull();
    expect(extractJsonFromText("no json here")).toBeNull();

    expect(extractJsonFromText("{\"a\":1}")).toEqual({ a: 1 });
    expect(extractJsonFromText("[1,2,3]")).toEqual([1, 2, 3]);
    expect(extractJsonFromText("before {\"a\":1} after")).toEqual({ a: 1 });
    expect(extractJsonFromText("```json\n{\"a\":1}\n```")).toEqual({ a: 1 });
  });

  it("builds narration prompt with JSON-only requirements and context fields", () => {
    const prompt = buildPrompt("narration", {
      worldName: "Harborfall",
      genre: "Dark fantasy",
      mood: "Tense",
      tagline: "Every debt is paid in salt.",
      mapName: "Storm Docks",
      mapBiome: "Coastal",
      prompt: "Open on a stormy harbor.",
    });

    expect(prompt).toContain("Return JSON only");
    expect(prompt).toContain("{ \"narration\": string }");
    expect(prompt).toContain("2-4 sentences");
    expect(prompt).toContain("Present tense");
    expect(prompt).toContain("World name: Harborfall");
    expect(prompt).toContain("Genre: Dark fantasy");
    expect(prompt).toContain("Mood: Tense");
    expect(prompt).toContain("Tagline: Every debt is paid in salt.");
    expect(prompt).toContain("Map name: Storm Docks");
    expect(prompt).toContain("Map biome: Coastal");
    expect(prompt).toContain("GM prompt: Open on a stormy harbor.");
  });
});
