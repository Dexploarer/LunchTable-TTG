import { describe, expect, it } from "vitest";
import { clampPercent, clientPointToPercent } from "./geometry";

describe("vttCanvas geometry", () => {
  it("converts client point to percent coordinates", () => {
    const bounds = { left: 10, top: 20, width: 200, height: 100 };
    expect(clientPointToPercent({ clientX: 10, clientY: 20 }, bounds)).toEqual({ x: 0, y: 0 });
    expect(clientPointToPercent({ clientX: 210, clientY: 120 }, bounds)).toEqual({ x: 100, y: 100 });
    expect(clientPointToPercent({ clientX: 110, clientY: 70 }, bounds)).toEqual({ x: 50, y: 50 });
  });

  it("clamps percent values with sane defaults", () => {
    expect(clampPercent(-10)).toBe(2);
    expect(clampPercent(0)).toBe(2);
    expect(clampPercent(50)).toBe(50);
    expect(clampPercent(100)).toBe(98);
    expect(clampPercent(999)).toBe(98);
    expect(clampPercent(Number.NaN)).toBe(2);
  });
});

