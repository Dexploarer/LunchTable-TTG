interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
}

interface InitiativePanelProps {
  entries: InitiativeEntry[];
}

export function InitiativePanel({ entries }: InitiativePanelProps) {
  const sorted = [...entries].sort((a, b) => b.initiative - a.initiative);

  return (
    <section className="paper-panel p-3 space-y-2">
      <h3 className="text-lg uppercase">Initiative</h3>
      <div className="paper-panel-flat p-2 space-y-1 text-sm">
        {sorted.length === 0 ? (
          <p className="text-xs text-[#121212]/60">No turn order yet.</p>
        ) : null}
        {sorted.map((entry, index) => (
          <p key={entry.id}>
            {index + 1}. {entry.name} ({entry.initiative})
          </p>
        ))}
      </div>
    </section>
  );
}
