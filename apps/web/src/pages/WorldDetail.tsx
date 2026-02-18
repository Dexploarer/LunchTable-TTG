import { Link, useParams } from "react-router";
import { playableWorlds } from "@/lib/ttrpgStudio";
import { TrayNav } from "@/components/layout/TrayNav";
import { apiAny, useConvexQuery } from "@/lib/convexHelpers";
import { looksLikeConvexId } from "@/lib/convexId";

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

interface LiveRuleset {
  name: string;
  summary: string;
  turnLoop: string[];
  failForwardPolicy: string;
  escalationTrack: string;
}

interface LiveMap {
  _id: string;
  name: string;
  biome?: string;
}

interface WorldSnapshot {
  world: LiveWorld;
  ruleset: LiveRuleset | null;
  maps: LiveMap[];
}

export function WorldDetail() {
  const { worldId = "" } = useParams();
  const convexEnabled = Boolean(((import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "").trim());
  const isConvexWorld = convexEnabled && looksLikeConvexId(worldId);

  const liveSnapshot = useConvexQuery(
    apiAny.vttWorlds.getWorld,
    isConvexWorld ? { worldId } : "skip",
  ) as WorldSnapshot | null | undefined;
  const seedWorld = playableWorlds.find((entry) => entry.id === worldId);

  if (isConvexWorld && liveSnapshot === undefined) {
    return (
      <div className="min-h-screen bg-[#fdfdfb] p-6 pb-24">
        <div className="paper-panel p-6 max-w-3xl mx-auto">
          <h1 className="text-3xl uppercase">Loading World</h1>
          <p className="text-sm text-[#121212]/70 mt-2">Fetching live world snapshot from Convex.</p>
        </div>
        <TrayNav invert={false} />
      </div>
    );
  }

  if (isConvexWorld && liveSnapshot?.world) {
    const world = liveSnapshot.world;
    const ruleset = liveSnapshot.ruleset;

    return (
      <div className="min-h-screen bg-[#fdfdfb] pb-24">
        <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
          <header className="paper-panel p-5 space-y-2">
            <p className="text-xs uppercase text-[#121212]/60">{world.genre}</p>
            <h1 className="text-4xl uppercase">{world.name}</h1>
            <p className="text-sm text-[#121212]/75">{world.tagline}</p>
            <p className="text-xs uppercase">
              Recommended party: {world.recommendedPartySize ?? "Custom"}
            </p>
            <p className="text-xs uppercase">Session length: {world.sessionLength ?? "Flexible"}</p>
            <p className="text-xs uppercase">
              Visibility: {world.visibility} • {world.isPublished ? "Published" : "Unpublished"}
            </p>
          </header>

          <section className="grid md:grid-cols-2 gap-3">
            <div className="paper-panel p-4">
              <h2 className="text-xl uppercase mb-2">Rules</h2>
              {ruleset ? (
                <>
                  <p className="text-sm">{ruleset.summary}</p>
                  <ul className="mt-3 text-sm list-disc pl-5 space-y-1">
                    {ruleset.turnLoop.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-[#121212]/70">No ruleset attached yet.</p>
              )}
            </div>
            <div className="paper-panel p-4">
              <h2 className="text-xl uppercase mb-2">Session Profile</h2>
              <p className="text-sm">Mood: {world.mood}</p>
              {ruleset ? (
                <>
                  <p className="text-sm mt-1">Fail Forward: {ruleset.failForwardPolicy}</p>
                  <p className="text-sm mt-1">Escalation: {ruleset.escalationTrack}</p>
                </>
              ) : null}
            </div>
          </section>

          <section className="paper-panel p-4">
            <h2 className="text-xl uppercase mb-3">Maps</h2>
            {liveSnapshot.maps.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-2 text-sm">
                {liveSnapshot.maps.map((map) => (
                  <div key={map._id} className="paper-panel-flat p-3">
                    <p className="font-black uppercase">{map.name}</p>
                    <p className="text-[#121212]/70">{map.biome ?? "Custom biome"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#121212]/70">No maps added to this world yet.</p>
            )}
          </section>

          <div className="flex flex-wrap gap-2">
            <Link className="tcg-button" to="/worlds">Back To Worlds</Link>
            <Link className="tcg-button" to={`/table/new?worldId=${world._id}`}>Start Live Session</Link>
          </div>
        </main>
        <TrayNav invert={false} />
      </div>
    );
  }

  if (!seedWorld) {
    return (
      <div className="min-h-screen bg-[#fdfdfb] p-6 pb-24">
        <div className="paper-panel p-6 max-w-3xl mx-auto">
          <h1 className="text-3xl uppercase">World Not Found</h1>
          <p className="text-sm text-[#121212]/70 mt-2">This world id is not available in the current seed library.</p>
          <Link className="tcg-button mt-4 inline-block" to="/worlds">Back To Worlds</Link>
        </div>
        <TrayNav invert={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        <header className="paper-panel p-5 space-y-2">
          <p className="text-xs uppercase text-[#121212]/60">{seedWorld.genre}</p>
          <h1 className="text-4xl uppercase">{seedWorld.name}</h1>
          <p className="text-sm text-[#121212]/75">{seedWorld.tagline}</p>
          <p className="text-xs uppercase">Recommended party: {seedWorld.recommendedPartySize}</p>
          <p className="text-xs uppercase">Session length: {seedWorld.sessionLength}</p>
        </header>

        <section className="grid md:grid-cols-2 gap-3">
          <div className="paper-panel p-4">
            <h2 className="text-xl uppercase mb-2">Rules</h2>
            <p className="text-sm">{seedWorld.rules.summary}</p>
            <ul className="mt-3 text-sm list-disc pl-5 space-y-1">
              {seedWorld.rules.turnLoop.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
          <div className="paper-panel p-4">
            <h2 className="text-xl uppercase mb-2">Agent Templates</h2>
            <ul className="text-sm space-y-2">
              {seedWorld.playerAgentTemplates.map((agent) => (
                <li key={agent.id}>
                  <p className="font-black uppercase">{agent.name}</p>
                  <p className="text-[#121212]/70">{agent.voice}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="paper-panel p-4">
          <h2 className="text-xl uppercase mb-3">Maps</h2>
          <div className="grid md:grid-cols-3 gap-2 text-sm">
            {seedWorld.maps.map((map) => (
              <div key={map.id} className="paper-panel-flat p-3">
                <p className="font-black uppercase">{map.name}</p>
                <p className="text-[#121212]/70">{map.biome}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link className="tcg-button" to="/worlds">Back To Worlds</Link>
          <Link className="tcg-button" to={`/table/new`}>Launch Sandbox Table</Link>
        </div>
      </main>
      <TrayNav invert={false} />
    </div>
  );
}
