import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { TrayNav } from "@/components/layout/TrayNav";
import { apiAny, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { useUserSync } from "@/hooks/auth/useUserSync";
import { useAppAuth } from "@/hooks/auth/useAppAuth";

interface LfgPost {
  _id: string;
  worldId: string;
  worldName?: string | null;
  sessionId?: string;
  title: string;
  description: string;
  seatsOpen: number;
  status: "open" | "filled" | "closed";
  tags: string[];
  updatedAt: number;
}

interface WorldRecord {
  _id: string;
  name: string;
}

interface SessionRecord {
  _id: string;
  worldId: string;
  title: string;
}

export function Lfg() {
  const convexEnabled = Boolean(
    ((import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "").trim(),
  );
  const { authenticated } = useAppAuth();
  useUserSync();

  const [filter, setFilter] = useState<"open" | "filled" | "closed">("open");
  const [selectedWorldId, setSelectedWorldId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [seatsOpen, setSeatsOpen] = useState(4);
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("");

  const posts = useConvexQuery(
    apiAny.vttDiscovery.listLfgPosts,
    convexEnabled ? { status: filter } : "skip",
  ) as LfgPost[] | undefined;
  const worlds = useConvexQuery(apiAny.vttWorlds.listWorlds, convexEnabled ? {} : "skip") as
    | WorldRecord[]
    | undefined;
  const sessions = useConvexQuery(
    apiAny.vttSessions.listActiveSessions,
    convexEnabled ? {} : "skip",
  ) as SessionRecord[] | undefined;
  const createLfgPost = useConvexMutation(apiAny.vttDiscovery.createLfgPost);

  useEffect(() => {
    if (selectedWorldId) return;
    const fallbackWorldId = worlds?.[0]?._id;
    if (fallbackWorldId) setSelectedWorldId(fallbackWorldId);
  }, [selectedWorldId, worlds]);

  const worldNameById = useMemo(
    () => new Map((worlds ?? []).map((world) => [world._id, world.name])),
    [worlds],
  );
  const sessionOptions = useMemo(() => {
    return (sessions ?? []).filter((session) => {
      if (!selectedWorldId) return true;
      return session.worldId === selectedWorldId;
    });
  }, [sessions, selectedWorldId]);

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        <header className="paper-panel p-5">
          <h1 className="text-4xl uppercase">Looking For Group</h1>
          <p className="text-sm text-[#121212]/70 mt-1">
            Find live tables, fill seats, and jump into sessions.
          </p>
        </header>

        {convexEnabled ? (
          <section className="paper-panel p-4 space-y-3">
            <h2 className="text-2xl uppercase">Create LFG Post</h2>
            <p className="text-xs uppercase text-[#121212]/70">
              {authenticated ? "Authenticated: ready to post." : "Sign in to create posts."}
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs uppercase font-bold">World</span>
                <select
                  className="w-full border-2 border-[#121212] px-2 py-2 bg-white"
                  value={selectedWorldId}
                  onChange={(event) => {
                    setSelectedWorldId(event.target.value);
                    setSelectedSessionId("");
                  }}
                >
                  {(worlds ?? []).map((world) => (
                    <option key={world._id} value={world._id}>
                      {world.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase font-bold">
                  Attach Active Session (Optional)
                </span>
                <select
                  className="w-full border-2 border-[#121212] px-2 py-2 bg-white"
                  value={selectedSessionId}
                  onChange={(event) => setSelectedSessionId(event.target.value)}
                >
                  <option value="">No session attached</option>
                  {sessionOptions.map((session) => (
                    <option key={session._id} value={session._id}>
                      {session.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs uppercase font-bold">Title</span>
                <input
                  className="w-full border-2 border-[#121212] px-2 py-2 bg-white"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Tonight's session title"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs uppercase font-bold">Description</span>
                <textarea
                  className="w-full border-2 border-[#121212] px-2 py-2 bg-white min-h-20"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What kind of table is this?"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase font-bold">Seats Open</span>
                <input
                  type="number"
                  min={1}
                  max={7}
                  className="w-full border-2 border-[#121212] px-2 py-2 bg-white"
                  value={seatsOpen}
                  onChange={(event) => setSeatsOpen(Number(event.target.value) || 1)}
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase font-bold">Tags</span>
                <input
                  className="w-full border-2 border-[#121212] px-2 py-2 bg-white"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="horror, one-shot, gm-led"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                className="tcg-button"
                disabled={!authenticated}
                onClick={async () => {
                  if (!authenticated) {
                    setStatus("Sign in to create an LFG post.");
                    return;
                  }
                  if (!selectedWorldId || !title.trim() || !description.trim()) {
                    setStatus("World, title, and description are required.");
                    return;
                  }
                  try {
                    await createLfgPost({
                      worldId: selectedWorldId,
                      sessionId: selectedSessionId || undefined,
                      title: title.trim(),
                      description: description.trim(),
                      seatsOpen: Math.max(1, Math.min(7, seatsOpen)),
                      tags: tags
                        .split(",")
                        .map((entry) => entry.trim())
                        .filter(Boolean),
                    });
                    setStatus("LFG post created.");
                    setTitle("");
                    setDescription("");
                    setTags("");
                    setSeatsOpen(4);
                  } catch (error) {
                    setStatus(
                      error instanceof Error ? error.message : "Failed to create LFG post.",
                    );
                  }
                }}
              >
                Create Post
              </button>
              {status ? <p className="text-xs uppercase">{status}</p> : null}
            </div>
          </section>
        ) : null}

        <section className="paper-panel p-4 flex flex-wrap gap-2 items-center">
          <label className="text-xs uppercase font-bold" htmlFor="lfg-status-filter">
            Filter
          </label>
          <select
            id="lfg-status-filter"
            className="border-2 border-[#121212] px-2 py-1 bg-white"
            value={filter}
            onChange={(event) => setFilter(event.target.value as "open" | "filled" | "closed")}
          >
            <option value="open">Open</option>
            <option value="filled">Filled</option>
            <option value="closed">Closed</option>
          </select>
        </section>

        <section className="space-y-3">
          {(posts ?? []).map((post) => (
            <article
              key={post._id}
              className="paper-panel p-4 flex flex-wrap justify-between gap-3"
            >
              <div>
                <p className="text-xs uppercase text-[#121212]/60">
                  {post.worldName ?? worldNameById.get(post.worldId) ?? "Unknown world"}
                </p>
                <h2 className="text-2xl">{post.title}</h2>
                <p className="text-sm text-[#121212]/70">{post.description}</p>
                <p className="text-sm">Seats Open: {post.seatsOpen}</p>
                <p className="text-xs uppercase mt-1">
                  {post.tags.length > 0 ? post.tags.join(" • ") : "untagged"}
                </p>
              </div>
              <div className="flex items-center">
                {post.sessionId ? (
                  <Link className="tcg-button" to={`/table/${post.sessionId}`}>
                    Join Table
                  </Link>
                ) : (
                  <Link className="tcg-button" to={`/table/new?worldId=${post.worldId}`}>
                    Start Session
                  </Link>
                )}
              </div>
            </article>
          ))}
          {(posts ?? []).length === 0 ? (
            <article className="paper-panel p-4 text-sm text-[#121212]/70">
              No posts for this filter yet.
            </article>
          ) : null}
        </section>
      </main>

      <TrayNav invert={false} />
    </div>
  );
}
