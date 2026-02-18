import { Link } from "react-router";
import { playableWorlds } from "@/lib/ttrpgStudio";
import { TrayNav } from "@/components/layout/TrayNav";

export function Lfg() {
  const posts = playableWorlds.slice(0, 3).map((world, index) => ({
    id: `${world.id}-${index}`,
    worldName: world.name,
    title: `${world.name} - Session ${index + 1}`,
    seatsOpen: 4 - index,
    tags: [world.genre, world.mood],
  }));

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        <header className="paper-panel p-5">
          <h1 className="text-4xl uppercase">Looking For Group</h1>
          <p className="text-sm text-[#121212]/70 mt-1">Find live tables, fill seats, and jump into sessions.</p>
        </header>

        <section className="space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="paper-panel p-4 flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-[#121212]/60">{post.worldName}</p>
                <h2 className="text-2xl">{post.title}</h2>
                <p className="text-sm">Seats Open: {post.seatsOpen}</p>
                <p className="text-xs uppercase mt-1">{post.tags.join(" • ")}</p>
              </div>
              <div className="flex items-center">
                <Link className="tcg-button" to={`/table/${post.id}`}>Join Table</Link>
              </div>
            </article>
          ))}
        </section>
      </main>

      <TrayNav invert={false} />
    </div>
  );
}
