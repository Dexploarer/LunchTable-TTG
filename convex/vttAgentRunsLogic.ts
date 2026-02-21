export type SeededRng = () => number;

export function makeSeededRng(seed: number): SeededRng {
  let state = seed >>> 0 || 1;
  return () => {
    // Mulberry32 PRNG
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clampPercent(value: number, min = 2, max = 98): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function computeNextTokenPosition(
  current: { x: number; y: number },
  rng: SeededRng,
): { x: number; y: number } {
  const jitter = () => (rng() * 2 - 1) * 6; // [-6, 6)
  return {
    x: clampPercent(current.x + jitter()),
    y: clampPercent(current.y + jitter()),
  };
}

export function computeDiceRollTotal(
  expression: string,
  seed: number,
): { expression: string; rolls: number[]; modifier: number; total: number } {
  const normalized = expression.replace(/\s+/g, "").toLowerCase();
  const match = normalized.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(`Invalid dice expression: ${expression}`);
  }

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifier = Number(match[3] ?? 0);

  if (!Number.isFinite(count) || !Number.isFinite(sides) || count <= 0 || sides <= 0) {
    throw new Error(`Invalid dice expression: ${expression}`);
  }

  const rng = makeSeededRng(seed);
  const rolls: number[] = [];
  let total = modifier;

  for (let i = 0; i < count; i += 1) {
    const roll = Math.floor(rng() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }

  return { expression, rolls, modifier, total };
}

export function advanceRunState(params: {
  turn: number;
  objectiveIndex: number;
  maxTurns: number;
  objectiveTarget: number;
  rollTotals: number[];
  objectiveThreshold: number;
}): {
  nextTurn: number;
  nextObjectiveIndex: number;
  completed: boolean;
  objectiveAdvanced: boolean;
} {
  const nextTurn = params.turn + 1;
  const hitObjective = params.rollTotals.some((total) => total >= params.objectiveThreshold);

  const nextObjectiveIndex =
    hitObjective && params.objectiveIndex < params.objectiveTarget
      ? params.objectiveIndex + 1
      : params.objectiveIndex;

  const completed = nextTurn >= params.maxTurns || nextObjectiveIndex >= params.objectiveTarget;

  return {
    nextTurn,
    nextObjectiveIndex,
    completed,
    objectiveAdvanced: nextObjectiveIndex > params.objectiveIndex,
  };
}
