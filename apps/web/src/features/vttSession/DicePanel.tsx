import { useState } from "react";

export interface DiceResult {
  expression: string;
  total: number;
}

interface DicePanelProps {
  history: DiceResult[];
  onRoll: (expression: string, total: number) => void;
}

function rollExpression(expression: string) {
  const normalized = expression.trim().toLowerCase();
  const match = normalized.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error("Use format NdM(+K), e.g. 1d20+3");
  }

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const mod = Number(match[3] ?? 0);

  let total = mod;
  for (let i = 0; i < count; i += 1) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

export function DicePanel({ history, onRoll }: DicePanelProps) {
  const [expression, setExpression] = useState("1d20+2");
  const [error, setError] = useState("");

  return (
    <section className="paper-panel p-3 space-y-3">
      <h3 className="text-lg uppercase">Dice</h3>
      <div className="flex gap-2">
        <input
          className="flex-1 border-2 border-[#121212] px-2 py-1 bg-white"
          value={expression}
          onChange={(event) => {
            setExpression(event.target.value);
            setError("");
          }}
        />
        <button
          className="tcg-button"
          onClick={() => {
            try {
              const total = rollExpression(expression);
              onRoll(expression, total);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Roll failed");
            }
          }}
        >
          Roll
        </button>
      </div>
      {error ? <p className="text-xs text-[#b42318]">{error}</p> : null}
      <div className="paper-panel-flat p-2 max-h-32 overflow-auto space-y-1 text-sm">
        {history.length === 0 ? <p className="text-xs text-[#121212]/60">No rolls yet.</p> : null}
        {history.map((roll, index) => (
          <p key={`${roll.expression}-${index}`}>
            {roll.expression} = {roll.total}
          </p>
        ))}
      </div>
    </section>
  );
}
