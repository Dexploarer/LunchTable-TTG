import { useState } from "react";

export interface SessionMessage {
  id: string;
  sender: string;
  text: string;
  createdAt: number;
}

interface ChatPanelProps {
  messages: SessionMessage[];
  onSend: (text: string) => void;
}

export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  return (
    <section className="paper-panel p-3 space-y-3">
      <h3 className="text-lg uppercase">Chat</h3>
      <div className="paper-panel-flat p-2 max-h-52 overflow-auto space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-[#121212]/60">No messages yet.</p>
        ) : null}
        {messages.map((message) => (
          <div key={message.id}>
            <p className="text-[10px] uppercase text-[#121212]/60">{message.sender}</p>
            <p className="text-sm">{message.text}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border-2 border-[#121212] px-2 py-1 bg-white"
          placeholder="Narrate or coordinate..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            const text = draft.trim();
            if (!text) return;
            onSend(text);
            setDraft("");
          }}
        />
        <button
          className="tcg-button"
          onClick={() => {
            const text = draft.trim();
            if (!text) return;
            onSend(text);
            setDraft("");
          }}
        >
          Send
        </button>
      </div>
    </section>
  );
}
