import { describe, expect, it } from "vitest";
import {
  advanceRunState,
  clampPercent,
  computeDiceRollTotal,
  computeNextTokenPosition,
  makeSeededRng,
} from "./vttAgentRunsLogic";

describe("vttAgentRunsLogic", () => {
  it("produces deterministic RNG sequences for the same seed", () => {
    const rngA = makeSeededRng(42);
    const rngB = makeSeededRng(42);

    const a = Array.from({ length: 5 }, () => rngA());
    const b = Array.from({ length: 5 }, () => rngB());
    expect(a).toEqual(b);
  });

  it("clamps token positions to 2-98%", () => {
    const rng = makeSeededRng(1);
    const next = computeNextTokenPosition({ x: 1, y: 999 }, rng);
    expect(next.x).toBeGreaterThanOrEqual(2);
    expect(next.x).toBeLessThanOrEqual(98);
    expect(next.y).toBeGreaterThanOrEqual(2);
    expect(next.y).toBeLessThanOrEqual(98);

    expect(clampPercent(Number.NaN)).toBe(2);
  });

  it("computes deterministic dice totals for NdM(+K) expressions", () => {
    const a = computeDiceRollTotal("1d20+2", 77);
    const b = computeDiceRollTotal("1d20+2", 77);
    expect(a).toEqual(b);

    expect(() => computeDiceRollTotal("bad+syntax", 1)).toThrow();
  });

  it("advances run state, objective progress, and completion correctly", () => {
    const result = advanceRunState({
      turn: 0,
      objectiveIndex: 0,
      maxTurns: 2,
      objectiveTarget: 2,
      rollTotals: [5, 12],
      objectiveThreshold: 12,
    });

    expect(result.nextTurn).toBe(1);
    expect(result.nextObjectiveIndex).toBe(1);
    expect(result.objectiveAdvanced).toBe(true);
    expect(result.completed).toBe(false);

    const endByTurns = advanceRunState({
      turn: 1,
      objectiveIndex: 0,
      maxTurns: 2,
      objectiveTarget: 2,
      rollTotals: [1],
      objectiveThreshold: 12,
    });
    expect(endByTurns.completed).toBe(true);

    const endByObjectives = advanceRunState({
      turn: 0,
      objectiveIndex: 1,
      maxTurns: 20,
      objectiveTarget: 2,
      rollTotals: [99],
      objectiveThreshold: 12,
    });
    expect(endByObjectives.nextObjectiveIndex).toBe(2);
    expect(endByObjectives.completed).toBe(true);
  });
});

