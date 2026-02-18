import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { playableWorlds } from "@/lib/ttrpgStudio";
import { useTTGStudioStore } from "@/features/ttgStudio";
import { TrayNav } from "@/components/layout/TrayNav";
import { apiAny, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { useUserSync } from "@/hooks/auth/useUserSync";
import { useAppAuth } from "@/hooks/auth/useAppAuth";

interface LiveWorld {
  _id: string;
  name: string;
  tagline: string;
  genre: string;
  mood: string;
  recommendedPartySize?: string;
  sessionLength?: string;
  visibility: "public" | "private" | "unlisted";
  isPublished: boolean;
}

interface DiscoveryListing {
  _id: string;
  worldId: string;
  title: string;
  description: string;
  tags: string[];
  rating: number;
}

export function Worlds() {
  const convexEnabled = Boolean(((import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "").trim());
  const { authenticated } = useAppAuth();
  const navigate = useNavigate();
  useUserSync();
  const createProjectFromWorld = useTTGStudioStore((state) => state.createProjectFromWorld);
  const createWorld = useConvexMutation(apiAny.vttWorlds.createWorld);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [seedingWorldId, setSeedingWorldId] = useState<string | null>(null);

  const liveWorlds = useConvexQuery(
    apiAny.vttWorlds.listWorlds,
    convexEnabled ? { search: search.trim() || undefined } : "skip",
  ) as LiveWorld[] | undefined;
  const publishedListings = useConvexQuery(
    apiAny.vttDiscovery.listDiscoveryWorlds,
    convexEnabled ? { search: search.trim() || undefined } : "skip",
  ) as DiscoveryListing[] | undefined;

  const listingsByWorldId = useMemo(
    () => new Map((publishedListings ?? []).map((listing) => [listing.worldId, listing])),
    [publishedListings],
  );
  const filteredSeedWorlds = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return playableWorlds;
    return playableWorlds.filter((world) => {
      return (
        world.name.toLowerCase().includes(term) ||
        world.tagline.toLowerCase().includes(term) ||
        world.genre.toLowerCase().includes(term)
      );
    });
  }, [search]);

  const seededLiveWorldIds = useMemo(() => new Set((liveWorlds ?? []).map((world) => world._id)), [liveWorlds]);

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        <header className="paper-panel p-4 md:p-6">
          <h1 className="text-4xl uppercase">World Library</h1>
          <p className="text-sm text-[#121212]/70 mt-1">
            Browse Convex-backed worlds, fork seed templates into Studio, then launch AI-assisted live sessions.
          </p>
          <label className="mt-3 block text-xs uppercase font-bold">Search</label>
          <input
            className="mt-1 w-full md:max-w-xl border-2 border-[#121212] px-3 py-2 bg-white"
            value={search}
            placeholder="Search by name, genre, or tagline"
            onChange={(event) => setSearch(event.target.value)}
          />
          {status ? <p className="text-xs uppercase mt-2">{status}</p> : null}
        </header>

        {convexEnabled ? (
          <section className="space-y-3">
            <h2 className="text-2xl uppercase">Live Convex Worlds</h2>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(liveWorlds ?? []).map((world) => {
                const listing = listingsByWorldId.get(world._id);
                return (
                  <article key={world._id} className="paper-panel p-4 space-y-2">
                    <p className="text-[11px] uppercase text-[#121212]/60">{world.genre}</p>
                    <h3 className="text-2xl">{world.name}</h3>
                    <p className="text-sm text-[#121212]/70">{world.tagline}</p>
                    <p className="text-xs uppercase">Mood: {world.mood}</p>
                    <p className="text-xs uppercase">
                      {listing ? "Published" : `Visibility: ${world.visibility}`}
                    </p>
                    {listing ? (
                      <p className="text-xs uppercase text-[#121212]/70">
                        Discovery Rating: {listing.rating.toFixed(1)}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link to={`/worlds/${world._id}`} className="tcg-button">Details</Link>
                      <Link to={`/table/new?worldId=${world._id}`} className="tcg-button">Open Table</Link>
                    </div>
                  </article>
                );
              })}
            </div>
            {(liveWorlds ?? []).length === 0 ? (
              <p className="paper-panel p-4 text-sm text-[#121212]/70">
                No Convex worlds yet. Seed one from templates below, then start sessions from real world IDs.
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-2xl uppercase">Seed Templates</h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredSeedWorlds.map((world) => (
              <article key={world.id} className="paper-panel p-4 space-y-2">
                <p className="text-[11px] uppercase text-[#121212]/60">{world.genre}</p>
                <h3 className="text-2xl">{world.name}</h3>
                <p className="text-sm text-[#121212]/70">{world.tagline}</p>
                <p className="text-xs uppercase">Mood: {world.mood}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link to={`/worlds/${world.id}`} className="tcg-button">Details</Link>
                  <button
                    className="tcg-button"
                    onClick={() => {
                      const projectId = createProjectFromWorld(world.id);
                      navigate(`/studio?project=${projectId}&tab=builder`);
                    }}
                  >
                    Fork To Studio
                  </button>
                  {convexEnabled ? (
                    <button
                      className="tcg-button"
                      disabled={seedingWorldId === world.id || !authenticated}
                      onClick={async () => {
                        if (!authenticated) {
                          setStatus("Sign in to seed this world into Convex.");
                          return;
                        }

                        setSeedingWorldId(world.id);
                        try {
                          const result = await createWorld({
                            name: world.name,
                            tagline: world.tagline,
                            genre: world.genre,
                            mood: world.mood,
                            visibility: "private",
                            recommendedPartySize: world.recommendedPartySize,
                            sessionLength: world.sessionLength,
                            rules: {
                              name: world.rules.name,
                              summary: world.rules.summary,
                              turnLoop: world.rules.turnLoop,
                              failForwardPolicy: world.rules.failForwardPolicy,
                              escalationTrack: world.rules.escalationTrack,
                            },
                          });
                          const worldId = typeof result?.worldId === "string" ? result.worldId : "";
                          if (seededLiveWorldIds.has(worldId)) {
                            setStatus(`World already exists in Convex: ${world.name}.`);
                          } else {
                            setStatus(`Seeded ${world.name}.`);
                          }
                          if (worldId) navigate(`/worlds/${worldId}`);
                        } catch (error) {
                          setStatus(error instanceof Error ? error.message : "Failed to seed world.");
                        } finally {
                          setSeedingWorldId(null);
                        }
                      }}
                    >
                      {seedingWorldId === world.id ? "Seeding..." : "Seed To Convex"}
                    </button>
                  ) : (
                    <Link to={`/table/new`} className="tcg-button">Open Sandbox Table</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <TrayNav invert={false} />
    </div>
  );
}
