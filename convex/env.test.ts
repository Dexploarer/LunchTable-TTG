import { afterEach, describe, expect, it } from "vitest";
import { fromBase64, getByokSecret, toBase64 } from "./env";

const originalSecret = process.env.BYOK_ENCRYPTION_SECRET;

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.BYOK_ENCRYPTION_SECRET;
    return;
  }
  process.env.BYOK_ENCRYPTION_SECRET = originalSecret;
});

describe("env", () => {
  it("requires BYOK_ENCRYPTION_SECRET", () => {
    delete process.env.BYOK_ENCRYPTION_SECRET;
    expect(() => getByokSecret()).toThrow("BYOK_ENCRYPTION_SECRET is required");
  });

  it("returns configured BYOK_ENCRYPTION_SECRET", () => {
    process.env.BYOK_ENCRYPTION_SECRET = "my-test-secret";
    expect(getByokSecret()).toBe("my-test-secret");
  });

  it("round-trips base64 helpers", () => {
    const source = new TextEncoder().encode("hello-ttg");
    const encoded = toBase64(source);
    const decoded = fromBase64(encoded);
    expect(Array.from(decoded)).toEqual(Array.from(source));
  });
});
