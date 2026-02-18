import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Stage } from "@/features/vttCanvas/Stage";
import type { VttToken } from "@/features/vttCanvas/TokenLayer";
import type { VttWall } from "@/features/vttCanvas/WallLayer";
import { ChatPanel, type SessionMessage } from "@/features/vttSession/ChatPanel";
import { DicePanel, type DiceResult } from "@/features/vttSession/DicePanel";
import { InitiativePanel } from "@/features/vttSession/InitiativePanel";
import { JournalPanel } from "@/features/vttSession/JournalPanel";
import { TrayNav } from "@/components/layout/TrayNav";
import { apiAny, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { looksLikeConvexId } from "@/lib/convexId";
import { useUserSync } from "@/hooks/auth/useUserSync";
import { useAppAuth } from "@/hooks/auth/useAppAuth";

interface TableToken extends VttToken {
  layer: "ground" | "mid" | "air";
}

interface CurrentUser {
  _id: string;
}

interface WorldRecord {
  _id: string;
  name: string;
}

interface SessionRecord {
  _id: string;
  worldId: string;
  title: string;
  status: "waiting" | "active" | "ended";
}

interface SessionParticipant {
  _id: string;
  userId: string;
  role: "gm" | "player" | "observer" | "npc";
}

interface SessionEvent {
  _id: string;
  actorUserId: string;
  eventType: string;
  payload: unknown;
  createdAt: number;
}

interface SessionDiceRoll {
  _id: string;
  expression: string;
  total: number;
}

interface SessionView {
  session: SessionRecord;
  participants: SessionParticipant[];
  events: SessionEvent[];
  diceRolls: SessionDiceRoll[];
}

interface MapRecord {
  _id: string;
  worldId: string;
  name: string;
}

interface MapStateToken {
  _id: string;
  name: string;
  x: number;
  y: number;
  layer: "ground" | "mid" | "air";
  color?: string;
}

interface MapState {
  tokens: MapStateToken[];
  fog: { enabled?: boolean } | null;
}

const START_TOKENS: TableToken[] = [
  { id: "seed-gm", name: "Narrator", x: 18, y: 24, color: "#ffcc00", layer: "mid" },
  { id: "seed-p1", name: "Player A", x: 50, y: 55, color: "#33ccff", layer: "mid" },
  { id: "seed-p2", name: "Player B", x: 70, y: 42, color: "#f97316", layer: "mid" },
];

const START_WALLS: VttWall[] = [
  { id: "w1", x1: 10, y1: 20, x2: 80, y2: 20 },
  { id: "w2", x1: 40, y1: 20, x2: 40, y2: 80 },
  { id: "w3", x1: 20, y1: 70, x2: 85, y2: 70 },
];

export function Table() {
  const convexEnabled = Boolean(((import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "").trim());
  const navigate = useNavigate();
  const { sessionId = "new" } = useParams();
  const [searchParams] = useSearchParams();
  const { authenticated } = useAppAuth();
  useUserSync();

  const currentUser = useConvexQuery(
    apiAny.auth.currentUser,
    convexEnabled ? {} : "skip",
  ) as CurrentUser | null | undefined;
  const worlds = useConvexQuery(
    apiAny.vttWorlds.listWorlds,
    convexEnabled ? {} : "skip",
  ) as WorldRecord[] | undefined;

  const requestedWorldId = searchParams.get("worldId");
  const [selectedWorldId, setSelectedWorldId] = useState(
    looksLikeConvexId(requestedWorldId) ? requestedWorldId : "",
  );
  const [selectedWorldTitle, setSelectedWorldTitle] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tokens, setTokens] = useState<TableToken[]>(START_TOKENS);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [localMessages, setLocalMessages] = useState<SessionMessage[]>([]);
  const [localDiceHistory, setLocalDiceHistory] = useState<DiceResult[]>([]);

  const createSession = useConvexMutation(apiAny.vttSessions.createSession);
  const joinSession = useConvexMutation(apiAny.vttSessions.joinSession);
  const postCommand = useConvexMutation(apiAny.vttSessions.postCommand);
  const rollDice = useConvexMutation(apiAny.vttSessions.rollDice);
  const upsertToken = useConvexMutation(apiAny.vttMaps.upsertToken);
  const updateFog = useConvexMutation(apiAny.vttMaps.updateFog);

  const convexSessionId = looksLikeConvexId(sessionId) ? sessionId : null;
  const sessionView = useConvexQuery(
    apiAny.vttSessions.getSessionView,
    convexEnabled && convexSessionId ? { sessionId: convexSessionId } : "skip",
  ) as SessionView | null | undefined;
  const sessionWorldId = sessionView?.session?.worldId;

  const maps = useConvexQuery(
    apiAny.vttMaps.listMaps,
    convexEnabled && convexSessionId && looksLikeConvexId(sessionWorldId)
      ? { worldId: sessionWorldId, sessionId: convexSessionId }
      : "skip",
  ) as MapRecord[] | undefined;

  const [activeMapId, setActiveMapId] = useState("");
  const mapState = useConvexQuery(
    apiAny.vttMaps.getSessionMapState,
    convexEnabled && convexSessionId && looksLikeConvexId(activeMapId)
      ? { sessionId: convexSessionId, mapId: activeMapId }
      : "skip",
  ) as MapState | null | undefined;

  useEffect(() => {
    if (!selectedWorldId && looksLikeConvexId(requestedWorldId)) {
      setSelectedWorldId(requestedWorldId);
    }
  }, [requestedWorldId, selectedWorldId]);

  useEffect(() => {
    if (selectedWorldId || !worlds || worlds.length === 0) return;
    const firstWorld = worlds[0];
    if (!firstWorld) return;
    setSelectedWorldId(firstWorld._id);
  }, [selectedWorldId, worlds]);

  useEffect(() => {
    if (activeMapId || !maps || maps.length === 0) return;
    const firstMap = maps[0];
    if (!firstMap) return;
    setActiveMapId(firstMap._id);
  }, [activeMapId, maps]);

  useEffect(() => {
    if (mapState?.tokens && mapState.tokens.length > 0) {
      setTokens(
        mapState.tokens.map((token) => ({
          id: token._id,
          name: token.name,
          x: token.x,
          y: token.y,
          color: token.color ?? "#ffcc00",
          layer: token.layer,
        })),
      );
      return;
    }

    if (!convexSessionId) {
      setTokens(START_TOKENS);
    }
  }, [convexSessionId, mapState?.tokens]);

  useEffect(() => {
    if (mapState?.fog && typeof mapState.fog.enabled === "boolean") {
      setFogEnabled(Boolean(mapState.fog.enabled));
    }
  }, [mapState?.fog]);

  useEffect(() => {
    if (!selectedWorldId || !worlds) return;
    const world = worlds.find((item) => item._id === selectedWorldId);
    setSelectedWorldTitle(world?.name ?? "");
  }, [selectedWorldId, worlds]);

  const participantsByUserId = useMemo(() => {
    const entries = sessionView?.participants ?? [];
    return new Map(entries.map((participant) => [participant.userId, participant]));
  }, [sessionView?.participants]);

  const messages = useMemo<SessionMessage[]>(() => {
    if (!sessionView?.events) return localMessages;
    return sessionView.events
      .filter((event) => event.eventType === "CHAT_MESSAGE")
      .map((event) => {
        const payload = event.payload && typeof event.payload === "object"
          ? (event.payload as Record<string, unknown>)
          : {};
        const senderFromPayload = typeof payload.sender === "string" ? payload.sender : null;
        const senderFromParticipant = participantsByUserId.get(event.actorUserId)?.role?.toUpperCase() ?? "TABLE";
        const text = typeof payload.text === "string"
          ? payload.text
          : JSON.stringify(payload);

        return {
          id: event._id,
          sender: senderFromPayload ?? senderFromParticipant,
          text,
          createdAt: event.createdAt,
        };
      });
  }, [localMessages, participantsByUserId, sessionView?.events]);

  const diceHistory = useMemo<DiceResult[]>(() => {
    if (!sessionView?.diceRolls) return localDiceHistory;
    return sessionView.diceRolls
      .slice()
      .reverse()
      .map((roll) => ({ expression: roll.expression, total: roll.total }));
  }, [localDiceHistory, sessionView?.diceRolls]);

  const isParticipant = Boolean(
    currentUser && sessionView?.participants?.some((participant) => participant.userId === currentUser._id),
  );
  const currentParticipantRole =
    currentUser && sessionView?.participants
      ? sessionView.participants.find((participant) => participant.userId === currentUser._id)?.role ?? null
      : null;

  const initiative = useMemo(
    () =>
      tokens.map((token, index) => ({
        id: token.id,
        name: token.name,
        initiative: 20 - index * 2,
      })),
    [tokens],
  );

  if (sessionId === "new") {
    return (
      <div className="min-h-screen bg-[#fdfdfb] pb-24">
        <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
          <header className="paper-panel p-5 space-y-2">
            <p className="text-xs uppercase text-[#121212]/60">Live Session</p>
            <h1 className="text-4xl uppercase">Create Session</h1>
            <p className="text-sm text-[#121212]/70">
              Create a live table from a Convex world or run a local sandbox if Convex is not configured.
            </p>
          </header>

          {convexEnabled ? (
            <section className="paper-panel p-4 space-y-3">
              <label className="block text-xs uppercase font-bold">World</label>
              <select
                className="w-full border-2 border-[#121212] px-3 py-2 bg-white"
                value={selectedWorldId}
                onChange={(event) => setSelectedWorldId(event.target.value)}
              >
                {(worlds ?? []).map((world) => (
                  <option key={world._id} value={world._id}>
                    {world.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <button
                  className="tcg-button"
                  disabled={isSubmitting || !selectedWorldId}
                  onClick={async () => {
                    if (!authenticated) {
                      setStatus("Sign in to create a Convex session.");
                      return;
                    }
                    if (!selectedWorldId) {
                      setStatus("Select a world first.");
                      return;
                    }
                    setIsSubmitting(true);
                    try {
                      const result = await createSession({
                        worldId: selectedWorldId,
                        title: selectedWorldTitle ? `${selectedWorldTitle} Session` : undefined,
                      });
                      const nextSessionId = typeof result?.sessionId === "string" ? result.sessionId : "";
                      if (!nextSessionId) {
                        setStatus("Session created but no id returned.");
                        return;
                      }
                      navigate(`/table/${nextSessionId}`);
                    } catch (error) {
                      setStatus(error instanceof Error ? error.message : "Failed to create session.");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  {isSubmitting ? "Creating..." : "Create Convex Session"}
                </button>
                <button
                  className="tcg-button"
                  onClick={() => {
                    setStatus("Switched to local sandbox mode.");
                    navigate("/table/local-sandbox");
                  }}
                >
                  Open Local Sandbox
                </button>
              </div>
              {status ? <p className="text-xs uppercase">{status}</p> : null}
            </section>
          ) : (
            <section className="paper-panel p-4 space-y-3">
              <p className="text-sm text-[#121212]/70">
                Convex is not configured in this environment. Running local sandbox mode.
              </p>
              <button className="tcg-button" onClick={() => navigate("/table/local-sandbox")}>
                Open Local Sandbox
              </button>
            </section>
          )}
        </main>

        <TrayNav invert={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-[1280px] mx-auto p-3 md:p-5 space-y-3">
        <header className="paper-panel p-4 flex flex-wrap items-center gap-2 justify-between">
          <div>
            <p className="text-xs uppercase text-[#121212]/60">Live Session</p>
            <h1 className="text-3xl uppercase">Table {sessionId}</h1>
            {sessionView?.session ? (
              <p className="text-xs uppercase text-[#121212]/70">
                Status: {sessionView.session.status} • Participants: {sessionView.participants.length}
              </p>
            ) : null}
          </div>
          <button
            className="tcg-button"
            disabled={Boolean(convexSessionId) && (!isParticipant || currentParticipantRole !== "gm")}
            onClick={async () => {
              if (convexSessionId && (!isParticipant || currentParticipantRole !== "gm")) {
                setStatus("Only the GM can toggle fog in a Convex session.");
                return;
              }
              const nextValue = !fogEnabled;
              setFogEnabled(nextValue);
              if (!convexSessionId || !looksLikeConvexId(activeMapId)) return;
              if (!isParticipant) return;
              try {
                await updateFog({
                  sessionId: convexSessionId,
                  mapId: activeMapId,
                  fog: { enabled: nextValue },
                });
              } catch (error) {
                setStatus(error instanceof Error ? error.message : "Failed to sync fog state.");
              }
            }}
          >
            {fogEnabled ? "Disable Fog" : "Enable Fog"}
          </button>
        </header>

        {maps && maps.length > 0 ? (
          <section className="paper-panel p-3 flex flex-wrap items-center gap-2">
            <label className="text-xs uppercase font-bold" htmlFor="active-map">
              Active Map
            </label>
            <select
              id="active-map"
              className="border-2 border-[#121212] px-2 py-1 bg-white"
              value={activeMapId}
              onChange={(event) => setActiveMapId(event.target.value)}
            >
              {maps.map((map) => (
                <option key={map._id} value={map._id}>
                  {map.name}
                </option>
              ))}
            </select>
            {currentUser && !isParticipant && sessionView?.session ? (
              <button
                className="tcg-button"
                onClick={async () => {
                  try {
                    await joinSession({
                      sessionId: sessionView.session._id,
                      role: "player",
                    });
                    setStatus("Joined session.");
                  } catch (error) {
                    setStatus(error instanceof Error ? error.message : "Failed to join session.");
                  }
                }}
              >
                Join Session
              </button>
            ) : null}
            {status ? <p className="text-xs uppercase">{status}</p> : null}
          </section>
        ) : null}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-3 items-start">
          <Stage
            tokens={tokens}
            walls={START_WALLS}
            fogEnabled={fogEnabled}
            onTokenMove={async (tokenId, x, y, options) => {
              const token = tokens.find((entry) => entry.id === tokenId);
              setTokens((current) =>
                current.map((token) => (token.id === tokenId ? { ...token, x, y } : token)),
              );

              if (options?.commit === false) return;
              if (!token) return;
              if (!convexSessionId || !looksLikeConvexId(activeMapId) || !looksLikeConvexId(sessionWorldId)) {
                return;
              }
              if (!isParticipant) return;

              try {
                const response = await upsertToken({
                  worldId: sessionWorldId,
                  mapId: activeMapId,
                  sessionId: convexSessionId,
                  tokenId: looksLikeConvexId(tokenId) ? tokenId : undefined,
                  name: token.name,
                  x,
                  y,
                  layer: token.layer,
                  color: token.color,
                });

                if (!looksLikeConvexId(tokenId) && typeof response?.tokenId === "string") {
                  const nextId = response.tokenId;
                  setTokens((current) =>
                    current.map((entry) =>
                      entry.id === tokenId ? { ...entry, id: nextId } : entry,
                    ),
                  );
                }
              } catch (error) {
                setStatus(error instanceof Error ? error.message : "Failed to sync token movement.");
              }
            }}
          />

          <div className="space-y-3">
            <ChatPanel
              messages={messages}
              onSend={async (text) => {
                if (!convexSessionId || !isParticipant) {
                  setLocalMessages((current) => [
                    ...current,
                    {
                      id: `local-msg-${Date.now()}`,
                      sender: "LOCAL",
                      text,
                      createdAt: Date.now(),
                    },
                  ]);
                  return;
                }

                try {
                  await postCommand({
                    sessionId: convexSessionId,
                    command: "CHAT_MESSAGE",
                    payload: {
                      sender: "PLAYER",
                      text,
                    },
                  });
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Failed to send chat message.");
                }
              }}
            />
            <DicePanel
              history={diceHistory}
              onRoll={async (expression, total) => {
                if (!convexSessionId || !isParticipant) {
                  setLocalDiceHistory((current) => [{ expression, total }, ...current].slice(0, 20));
                  return;
                }
                try {
                  await rollDice({
                    sessionId: convexSessionId,
                    expression,
                    total,
                    result: { total },
                  });
                } catch (error) {
                  setStatus(error instanceof Error ? error.message : "Failed to persist dice roll.");
                }
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
