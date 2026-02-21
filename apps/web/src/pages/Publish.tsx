import { useEffect, useMemo, useState } from "react";
import { PublishTab } from "@/features/ttgStudio/tabs/PublishTab";
import { TrayNav } from "@/components/layout/TrayNav";
import { apiAny, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { useUserSync } from "@/hooks/auth/useUserSync";
import { useAppAuth } from "@/hooks/auth/useAppAuth";

interface CurrentUser {
  _id: string;
}

interface WorldSummary {
  _id: string;
  ownerUserId: string;
  name: string;
  tagline: string;
  genre: string;
  mood: string;
  isPublished: boolean;
}

interface PublishListing {
  _id: string;
  worldId: string;
  title: string;
  description: string;
  tags: string[];
  moderationStatus: "approved" | "needs_review" | "rejected";
  isVisible: boolean;
  rating: number;
}

export function Publish() {
  const convexEnabled = Boolean(
    ((import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "").trim(),
  );
  const { authenticated } = useAppAuth();
  useUserSync();

  const currentUser = useConvexQuery(apiAny.auth.currentUser, convexEnabled ? {} : "skip") as
    | CurrentUser
    | null
    | undefined;
  const worlds = useConvexQuery(apiAny.vttWorlds.listWorlds, convexEnabled ? {} : "skip") as
    | WorldSummary[]
    | undefined;
  const ownedWorlds = useMemo(() => {
    if (!currentUser) return [];
    return (worlds ?? []).filter((world) => world.ownerUserId === currentUser._id);
  }, [currentUser, worlds]);
  const listings = useConvexQuery(
    apiAny.vttPublish.listPublishedWorlds,
    convexEnabled ? {} : "skip",
  ) as PublishListing[] | undefined;
  const publishWorld = useConvexMutation(apiAny.vttPublish.publishWorld);

  const [worldId, setWorldId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (worldId || ownedWorlds.length === 0) return;
    const firstWorld = ownedWorlds[0];
    if (!firstWorld) return;
    setWorldId(firstWorld._id);
    setTitle(firstWorld.name);
    setDescription(firstWorld.tagline);
    setTags([firstWorld.genre, firstWorld.mood].join(", "));
  }, [ownedWorlds, worldId]);

  const selectedWorld = useMemo(
    () => ownedWorlds.find((world) => world._id === worldId) ?? null,
    [ownedWorlds, worldId],
  );

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <header className="paper-panel p-4">
          <h1 className="text-4xl uppercase">Publish Console</h1>
          <p className="text-sm text-[#121212]/70 mt-1">
            Run preflight, moderation checks, and package export before discovery indexing.
          </p>
        </header>

        {convexEnabled ? (
          <section className="paper-panel p-4 md:p-6 space-y-4">
            <h2 className="text-2xl uppercase">Live Publish To Discovery</h2>
            <p className="text-xs uppercase text-[#121212]/70">
              {authenticated
                ? "Authenticated: publish ready."
                : "Sign in required for publish actions."}
            </p>

            <div className="grid md:grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs uppercase font-bold">World</span>
                <select
                  className="w-full border-2 border-[#121212] px-3 py-2 bg-white"
                  value={worldId}
                  onChange={(event) => {
                    const nextWorldId = event.target.value;
                    setWorldId(nextWorldId);
                    const world = ownedWorlds.find((entry) => entry._id === nextWorldId);
                    if (world) {
                      setTitle(world.name);
                      setDescription(world.tagline);
                      setTags([world.genre, world.mood].join(", "));
                    }
                  }}
                >
                  {ownedWorlds.map((world) => (
                    <option key={world._id} value={world._id}>
                      {world.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase font-bold">Title</span>
                <input
                  className="w-full border-2 border-[#121212] px-3 py-2 bg-white"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Listing title"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs uppercase font-bold">Description</span>
                <textarea
                  className="w-full border-2 border-[#121212] px-3 py-2 bg-white min-h-24"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe this world pack"
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs uppercase font-bold">Tags (comma separated)</span>
                <input
                  className="w-full border-2 border-[#121212] px-3 py-2 bg-white"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="horror, mystery, one-shot"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                className="tcg-button"
                disabled={!authenticated || isPublishing || !worldId}
                onClick={async () => {
                  if (!authenticated) {
                    setStatus("Sign in required.");
                    return;
                  }
                  if (!worldId) {
                    setStatus("Select a world first.");
                    return;
                  }
                  setIsPublishing(true);
                  try {
                    const result = await publishWorld({
                      worldId,
                      title: title.trim() || undefined,
                      description: description.trim() || undefined,
                      tags: tags
                        .split(",")
                        .map((entry) => entry.trim())
                        .filter(Boolean),
                    });
                    setStatus(
                      `Publish result: ${result.moderationStatus} (${result.visible ? "visible" : "not visible"})`,
                    );
                  } catch (error) {
                    setStatus(error instanceof Error ? error.message : "Publish failed.");
                  } finally {
                    setIsPublishing(false);
                  }
                }}
              >
                {isPublishing ? "Publishing..." : "Publish World"}
              </button>
              {selectedWorld?.isPublished ? (
                <p className="text-xs uppercase text-[#177245]">
                  Selected world already published.
                </p>
              ) : null}
            </div>
            {status ? <p className="text-xs uppercase">{status}</p> : null}

            <div className="space-y-2">
              <h3 className="text-xl uppercase">Visible Listings</h3>
              {(listings ?? []).length === 0 ? (
                <p className="text-sm text-[#121212]/70">No visible listings yet.</p>
              ) : (
                <div className="space-y-2">
                  {(listings ?? []).map((listing) => (
                    <article key={listing._id} className="paper-panel-flat p-3">
                      <p className="text-xs uppercase text-[#121212]/60">
                        {listing.moderationStatus}
                      </p>
                      <h4 className="text-lg uppercase">{listing.title}</h4>
                      <p className="text-sm text-[#121212]/75">{listing.description}</p>
                      <p className="text-xs uppercase mt-1">
                        {listing.tags.join(" • ")} • rating {listing.rating.toFixed(1)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section className="paper-panel p-4 md:p-6">
          <h2 className="text-2xl uppercase mb-3">Studio Package Workflow</h2>
          <PublishTab />
        </section>
      </main>
      <TrayNav invert={false} />
    </div>
  );
}
