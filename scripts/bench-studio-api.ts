import { playableWorlds } from "../apps/web/src/lib/ttrpgStudio/worlds";
import { createDraftFromWorld, validateDraft } from "../apps/web/src/lib/ttrpgStudio/studioApi";

type BenchMetrics = {
  name: string;
  iterations: number;
  ops: number;
  totalMs: number;
  meanMs: number;
  p95Ms: number;
};

const iterations = Number.parseInt(process.env.BENCH_ITERATIONS ?? "25", 10);
const warmup = Number.parseInt(process.env.BENCH_WARMUP ?? "3", 10);

const worldIds = playableWorlds.map((world) => world.id);

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[index] ?? 0;
}

function benchCreateDraft(): BenchMetrics {
  const timings: number[] = [];
  for (let w = 0; w < warmup; w += 1) {
    for (const id of worldIds) {
      createDraftFromWorld(id);
    }
  }

  for (let i = 0; i < iterations; i += 1) {
    for (const id of worldIds) {
      const start = performance.now();
      createDraftFromWorld(id);
      timings.push(performance.now() - start);
    }
  }

  const totalMs = timings.reduce((sum, value) => sum + value, 0);
  return {
    name: "createDraftFromWorld",
    iterations,
    ops: timings.length,
    totalMs,
    meanMs: totalMs / Math.max(1, timings.length),
    p95Ms: percentile(timings, 0.95),
  };
}

function benchValidateDraft(): BenchMetrics {
  const drafts = worldIds.map((id) => createDraftFromWorld(id));
  const timings: number[] = [];

  for (let w = 0; w < warmup; w += 1) {
    for (const draft of drafts) {
      validateDraft(draft);
    }
  }

  for (let i = 0; i < iterations; i += 1) {
    for (const draft of drafts) {
      const start = performance.now();
      validateDraft(draft);
      timings.push(performance.now() - start);
    }
  }

  const totalMs = timings.reduce((sum, value) => sum + value, 0);
  return {
    name: "validateDraft",
    iterations,
    ops: timings.length,
    totalMs,
    meanMs: totalMs / Math.max(1, timings.length),
    p95Ms: percentile(timings, 0.95),
  };
}

const results = {
  timestamp: new Date().toISOString(),
  bun: process.versions?.bun ?? "unknown",
  node: process.versions?.node ?? "unknown",
  worlds: worldIds.length,
  metrics: [benchCreateDraft(), benchValidateDraft()],
};

console.log(JSON.stringify(results, null, 2));
