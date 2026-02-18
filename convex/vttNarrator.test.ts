import { describe, expect, it } from "vitest";
import {
  DEFAULT_NARRATION,
  selectNarrationFromNarrationOutput,
  selectNarrationFromNpcOutput,
} from "./vttNarrator";

describe("vttNarrator", () => {
  it("returns default narration for non-object outputs", () => {
    expect(selectNarrationFromNpcOutput(null)).toBe(DEFAULT_NARRATION);
    expect(selectNarrationFromNpcOutput(123)).toBe(DEFAULT_NARRATION);
    expect(selectNarrationFromNpcOutput("hello")).toBe(DEFAULT_NARRATION);
  });

  it("returns default narration when npc profile is missing or invalid", () => {
    expect(selectNarrationFromNpcOutput({})).toBe(DEFAULT_NARRATION);
    expect(selectNarrationFromNpcOutput({ npcProfile: null })).toBe(DEFAULT_NARRATION);
    expect(selectNarrationFromNpcOutput({ npcProfile: 123 })).toBe(DEFAULT_NARRATION);
  });

  it("returns default narration when scenePrompts is missing or invalid", () => {
    expect(selectNarrationFromNpcOutput({ npcProfile: {} })).toBe(DEFAULT_NARRATION);
    expect(selectNarrationFromNpcOutput({ npcProfile: { scenePrompts: null } })).toBe(
      DEFAULT_NARRATION,
    );
    expect(selectNarrationFromNpcOutput({ npcProfile: { scenePrompts: "nope" } })).toBe(
      DEFAULT_NARRATION,
    );
  });

  it("returns the first non-empty string prompt", () => {
    expect(
      selectNarrationFromNpcOutput({
        npcProfile: { scenePrompts: ["  ", "", "A shadow passes over the moon."] },
      }),
    ).toBe("A shadow passes over the moon.");
  });

  it("ignores non-string prompts", () => {
    expect(
      selectNarrationFromNpcOutput({
        npcProfile: { scenePrompts: [false, 123, { text: "x" }, "A door creaks open."] },
      }),
    ).toBe("A door creaks open.");
  });
});

describe("vttNarrator narration selection", () => {
  it("prefers parsed narration when available", () => {
    expect(selectNarrationFromNarrationOutput({ narration: "A storm rolls in." }, "")).toBe(
      "A storm rolls in.",
    );
  });

  it("falls back to the first non-empty line of raw text", () => {
    expect(selectNarrationFromNarrationOutput({}, "\n\nFirst line.\nSecond line.\n")).toBe(
      "First line.",
    );
  });

  it("returns default narration when parsed and raw text are empty", () => {
    expect(selectNarrationFromNarrationOutput(null, "  ")).toBe(DEFAULT_NARRATION);
  });
});
