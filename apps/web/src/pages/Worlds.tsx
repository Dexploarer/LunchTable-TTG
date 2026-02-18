import { Link, useNavigate } from "react-router";
import { playableWorlds } from "@/lib/ttrpgStudio";
import { useTTGStudioStore } from "@/features/ttgStudio";
import { TrayNav } from "@/components/layout/TrayNav";

export function Worlds() {
  const navigate = useNavigate();
  const createProjectFromWorld = useTTGStudioStore((state) => state.createProjectFromWorld);

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        <header className="paper-panel p-4 md:p-6">
          <h1 className="text-4xl uppercase">World Library</h1>
          <p className="text-sm text-[#121212]/70 mt-1">
            Browse worlds, fork seeds into studio projects, then launch sessions with AI-assisted narration.
          </p>
        </header>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {playableWorlds.map((world) => (
            <article key={world.id} className="paper-panel p-4 space-y-2">
              <p className="text-[11px] uppercase text-[#121212]/60">{world.genre}</p>
              <h2 className="text-2xl">{world.name}</h2>
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
                <Link to={`/table/${world.id}-sandbox`} className="tcg-button">Open Table</Link>
              </div>
            </article>
          ))}
        </section>
      </main>
      <TrayNav invert={false} />
    </div>
  );
}
