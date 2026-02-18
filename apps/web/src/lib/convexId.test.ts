import { describe, expect, it } from "vitest";
import { looksLikeConvexId } from "./convexId";

describe("looksLikeConvexId", () => {
  it("accepts Convex-like ids", () => {
    expect(looksLikeConvexId("js7fw0k0w8npy4f1zj8h9tcbw9765cfa")).toBe(true);
  });

  it("rejects empty or short values", () => {
    expect(looksLikeConvexId("")).toBe(false);
    expect(looksLikeConvexId("abc123")).toBe(false);
    expect(looksLikeConvexId(null)).toBe(false);
  });

  it("rejects seeded world slugs", () => {
    expect(looksLikeConvexId("neon-borough")).toBe(false);
  });
});
