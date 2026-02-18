import { Link, useParams } from "react-router";
import { playableWorlds } from "@/lib/ttrpgStudio";
import { TrayNav } from "@/components/layout/TrayNav";

export function WorldDetail() {
  const { worldId = "" } = useParams();
  const world = playableWorlds.find((entry) => entry.id === worldId);

  if (!world) {
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
          <p className="text-xs uppercase text-[#121212]/60">{world.genre}</p>
          <h1 className="text-4xl uppercase">{world.name}</h1>
          <p className="text-sm text-[#121212]/75">{world.tagline}</p>
          <p className="text-xs uppercase">Recommended party: {world.recommendedPartySize}</p>
          <p className="text-xs uppercase">Session length: {world.sessionLength}</p>
        </header>

        <section className="grid md:grid-cols-2 gap-3">
          <div className="paper-panel p-4">
            <h2 className="text-xl uppercase mb-2">Rules</h2>
            <p className="text-sm">{world.rules.summary}</p>
            <ul className="mt-3 text-sm list-disc pl-5 space-y-1">
              {world.rules.turnLoop.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
          <div className="paper-panel p-4">
            <h2 className="text-xl uppercase mb-2">Agent Templates</h2>
            <ul className="text-sm space-y-2">
              {world.playerAgentTemplates.map((agent) => (
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
            {world.maps.map((map) => (
              <div key={map.id} className="paper-panel-flat p-3">
                <p className="font-black uppercase">{map.name}</p>
                <p className="text-[#121212]/70">{map.biome}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link className="tcg-button" to="/worlds">Back To Worlds</Link>
          <Link className="tcg-button" to={`/table/${world.id}-sandbox`}>Launch Table</Link>
        </div>
      </main>
      <TrayNav invert={false} />
    </div>
  );
}
