import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { Stage } from "@/features/vttCanvas/Stage";
import type { VttToken } from "@/features/vttCanvas/TokenLayer";
import type { VttWall } from "@/features/vttCanvas/WallLayer";
import { ChatPanel, type SessionMessage } from "@/features/vttSession/ChatPanel";
import { DicePanel, type DiceResult } from "@/features/vttSession/DicePanel";
import { InitiativePanel } from "@/features/vttSession/InitiativePanel";
import { JournalPanel } from "@/features/vttSession/JournalPanel";
import { TrayNav } from "@/components/layout/TrayNav";

const START_TOKENS: VttToken[] = [
  { id: "gm", name: "Narrator", x: 18, y: 24, color: "#ffcc00" },
  { id: "p1", name: "Player A", x: 50, y: 55, color: "#33ccff" },
  { id: "p2", name: "Player B", x: 70, y: 42, color: "#f97316" },
];

const START_WALLS: VttWall[] = [
  { id: "w1", x1: 10, y1: 20, x2: 80, y2: 20 },
  { id: "w2", x1: 40, y1: 20, x2: 40, y2: 80 },
  { id: "w3", x1: 20, y1: 70, x2: 85, y2: 70 },
];

export function Table() {
  const { sessionId = "new" } = useParams();
  const [tokens, setTokens] = useState<VttToken[]>(START_TOKENS);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [diceHistory, setDiceHistory] = useState<DiceResult[]>([]);

  const initiative = useMemo(
    () =>
      tokens.map((token, index) => ({
        id: token.id,
        name: token.name,
        initiative: 20 - index * 2,
      })),
    [tokens],
  );

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-[1280px] mx-auto p-3 md:p-5 space-y-3">
        <header className="paper-panel p-4 flex flex-wrap items-center gap-2 justify-between">
          <div>
            <p className="text-xs uppercase text-[#121212]/60">Live Session</p>
            <h1 className="text-3xl uppercase">Table {sessionId}</h1>
          </div>
          <button className="tcg-button" onClick={() => setFogEnabled((value) => !value)}>
            {fogEnabled ? "Disable Fog" : "Enable Fog"}
          </button>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-3 items-start">
          <Stage
            tokens={tokens}
            walls={START_WALLS}
            fogEnabled={fogEnabled}
            onTokenMove={(tokenId, x, y) => {
              setTokens((current) =>
                current.map((token) => (token.id === tokenId ? { ...token, x, y } : token)),
              );
            }}
          />

          <div className="space-y-3">
            <ChatPanel
              messages={messages}
              onSend={(text) => {
                setMessages((current) => [
                  ...current,
                  {
                    id: `msg-${Date.now()}`,
                    sender: "GM",
                    text,
                    createdAt: Date.now(),
                  },
                ]);
              }}
            />
            <DicePanel
              history={diceHistory}
              onRoll={(expression, total) => {
                setDiceHistory((current) => [{ expression, total }, ...current].slice(0, 20));
              }}
            />
            <InitiativePanel entries={initiative} />
            <JournalPanel />
          </div>
        </div>
      </main>

      <TrayNav invert={false} />
    </div>
  );
}
