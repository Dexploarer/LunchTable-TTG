import { useMemo, useState } from "react";
import { apiAny, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { looksLikeConvexId } from "@/lib/convexId";
import {
  normalizeAgentRunFormState,
  type AgentRunProvider,
} from "./agentMasterPanelLogic";

interface AgentMasterPanelProps {
  sessionId: string;
  isGm: boolean;
  activeMapId: string;
}

interface AgentRunRecord {
  _id: string;
  provider: AgentRunProvider;
  status: "running" | "stopped" | "completed" | "failed";
  turn: number;
  maxTurns: number;
  objectiveIndex: number;
  lastError?: string;
}

export function AgentMasterPanel({ sessionId, isGm, activeMapId }: AgentMasterPanelProps) {
  const [provider, setProvider] = useState<AgentRunProvider>("eliza");
  const [seed, setSeed] = useState(42);
  const [playerCount, setPlayerCount] = useState(2);
  const [maxTurns, setMaxTurns] = useState(8);
  const [tickIntervalMs, setTickIntervalMs] = useState(3500);
  const [status, setStatus] = useState("");

  const run = useConvexQuery(
    apiAny.vttAgentRuns.getRunForSession,
    looksLikeConvexId(sessionId) ? { sessionId } : "skip",
  ) as AgentRunRecord | null | undefined;

  const startRun = useConvexMutation(apiAny.vttAgentRuns.startRun);
  const stopRun = useConvexMutation(apiAny.vttAgentRuns.stopRun);
  const stepRun = useConvexMutation(apiAny.vttAgentRuns.stepRun);

  const summary = useMemo(() => {
    if (!run) return "No active run.";
    return `${run.status} • turn ${run.turn}/${run.maxTurns} • objectives ${run.objectiveIndex}/2${
      run.lastError ? ` • ${run.lastError}` : ""
    }`;
  }, [run]);

  if (!isGm || !looksLikeConvexId(sessionId)) {
    return null;
  }

  return (
    <section className="paper-panel p-3 space-y-3">
      <h3 className="text-lg uppercase">Agent Master</h3>
      <p className="text-xs uppercase text-[#121212]/70">
        Active map: {looksLikeConvexId(activeMapId) ? activeMapId : "none"}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold">Provider</span>
          <select
            className="border-2 border-[#121212] px-2 py-1 bg-white text-xs uppercase"
            value={provider}
            onChange={(event) => setProvider(event.target.value as AgentRunProvider)}
          >
            <option value="openai">openai</option>
            <option value="anthropic">anthropic</option>
            <option value="eliza">eliza</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold">Seed</span>
          <input
            className="border-2 border-[#121212] px-2 py-1 bg-white text-sm"
            type="number"
            value={seed}
            onChange={(event) => setSeed(Number(event.target.value) || 42)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold">Players</span>
          <input
            className="border-2 border-[#121212] px-2 py-1 bg-white text-sm"
            type="number"
            min={1}
            max={3}
            value={playerCount}
            onChange={(event) => setPlayerCount(Number(event.target.value) || 2)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold">Max Turns</span>
          <input
            className="border-2 border-[#121212] px-2 py-1 bg-white text-sm"
            type="number"
            min={1}
            max={20}
            value={maxTurns}
            onChange={(event) => setMaxTurns(Number(event.target.value) || 8)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase font-bold">Tick Interval (ms)</span>
        <input
          className="border-2 border-[#121212] px-2 py-1 bg-white text-sm"
          type="number"
          min={500}
          max={30000}
          value={tickIntervalMs}
          onChange={(event) => setTickIntervalMs(Number(event.target.value) || 3500)}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          className="tcg-button"
          onClick={async () => {
            try {
              const normalized = normalizeAgentRunFormState({
                provider,
                seed,
                playerCount,
                maxTurns,
                tickIntervalMs,
              });
              await startRun({
                sessionId,
                provider: normalized.provider,
                seed: normalized.seed,
                playerCount: normalized.playerCount,
                maxTurns: normalized.maxTurns,
                tickIntervalMs: normalized.tickIntervalMs,
              });
              setStatus("AI one-shot started.");
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "Failed to start AI one-shot.");
            }
          }}
        >
          Start
        </button>
        <button
          className="tcg-button"
          disabled={!run || run.status === "running"}
          onClick={async () => {
            if (!run) return;
            try {
              await stepRun({ runId: run._id });
              setStatus("Queued one tick.");
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "Failed to step run.");
            }
          }}
        >
          Step
        </button>
        <button
          className="tcg-button"
          disabled={!run}
          onClick={async () => {
            if (!run) return;
            try {
              await stopRun({ runId: run._id });
              setStatus("AI one-shot stopped.");
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "Failed to stop run.");
            }
          }}
        >
          Stop
        </button>
      </div>

      <p className="text-xs uppercase text-[#121212]/70">{summary}</p>
      {status ? <p className="text-xs uppercase">{status}</p> : null}
    </section>
  );
}
