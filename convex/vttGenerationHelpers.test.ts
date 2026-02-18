import { describe, expect, it } from "vitest";
import { defaultModelForProvider, extractJsonFromText, selectModel } from "./vttGeneration";

describe("vttGeneration helpers", () => {
  it("selects default models when none provided", () => {
    expect(defaultModelForProvider("openai")).toBe("gpt-4.1-mini");
    expect(defaultModelForProvider("anthropic")).toBe("claude-3-5-sonnet-20240620");
    expect(defaultModelForProvider("eliza")).toBe("synthetic");

    expect(selectModel("openai", {})).toBe("gpt-4.1-mini");
    expect(selectModel("anthropic", {})).toBe("claude-3-5-sonnet-20240620");
  });

  it("allows explicit model override in input", () => {
    expect(selectModel("openai", { model: "gpt-4.1" })).toBe("gpt-4.1");
    expect(selectModel("anthropic", { model: "claude-test" })).toBe("claude-test");
  });

  it("extracts json objects and arrays from text", () => {
    expect(extractJsonFromText("")).toBeNull();
    expect(extractJsonFromText("no json here")).toBeNull();

    expect(extractJsonFromText("{\"a\":1}")).toEqual({ a: 1 });
    expect(extractJsonFromText("[1,2,3]")).toEqual([1, 2, 3]);
    expect(extractJsonFromText("before {\"a\":1} after")).toEqual({ a: 1 });
    expect(extractJsonFromText("```json\n{\"a\":1}\n```")).toEqual({ a: 1 });
  });
});

