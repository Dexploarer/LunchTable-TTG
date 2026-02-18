import { useState } from "react";

interface JournalPanelProps {
  initialText?: string;
}

export function JournalPanel({ initialText = "" }: JournalPanelProps) {
  const [text, setText] = useState(initialText);

  return (
    <section className="paper-panel p-3 space-y-2">
      <h3 className="text-lg uppercase">Journal</h3>
      <textarea
        className="w-full min-h-40 border-2 border-[#121212] bg-white p-2 text-sm"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Session notes, NPC cues, and fail-forward branches..."
      />
    </section>
  );
}
