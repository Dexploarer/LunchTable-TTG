import { describe, expect, it } from "vitest";
import { evaluateModerationText } from "./vttModeration";

describe("vttModeration", () => {
  it("rejects content containing blocklisted phrases", () => {
    const result = evaluateModerationText("We should discuss Violence Against innocents.");
    expect(result.status).toBe("rejected");
    expect(result.reason).toContain("violence against");
  });

  it("rejects content containing blocklisted keywords anywhere in text", () => {
    const result = evaluateModerationText("A harmless intro, then a dox attempt later.");
    expect(result.status).toBe("rejected");
    expect(result.reason).toContain("dox");
  });

  it("flags short content for review when no blocklist hit", () => {
    const result = evaluateModerationText("Too short.");
    expect(result.status).toBe("needs_review");
    expect(result.reason).toContain("Insufficient content");
  });

  it("approves sufficiently long, clean content", () => {
    const result = evaluateModerationText(
      "A haunted harbor town threatens the party with storms and secrets.",
    );
    expect(result.status).toBe("approved");
    expect(result.reason).toContain("Automated moderation passed");
  });
});
