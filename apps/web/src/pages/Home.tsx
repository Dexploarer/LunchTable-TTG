import { Link } from "react-router";
import { TrayNav } from "@/components/layout/TrayNav";

const CARDS = [
  {
    title: "Studio",
    description: "Design worlds, rulesets, maps, prompts, and agent directives.",
    to: "/studio",
  },
  {
    title: "Worlds",
    description: "Browse published and seeded worlds, then fork to your workspace.",
    to: "/worlds",
  },
  {
    title: "Live Table",
    description: "Run map + tokens + dice + chat + fog in a shared session.",
    to: "/table/new",
  },
  {
    title: "LFG",
    description: "Discover open games and fill seats with humans or agents.",
    to: "/lfg",
  },
  {
    title: "Publish",
    description: "Moderate and publish creator packs into discovery surfaces.",
    to: "/publish",
  },
  {
    title: "Agent Ops",
    description: "Configure GM/NPC agent behavior and playtest loops.",
    to: "/agent-ops",
  },
];

export function Home() {
  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <header className="paper-panel p-5 md:p-7">
          <p className="text-xs uppercase text-[#121212]/60">LunchTable TTG</p>
          <h1 className="text-5xl uppercase leading-none">AI-Native Tabletop Fabrication</h1>
          <p className="mt-2 text-sm text-[#121212]/70 max-w-3xl">
            Build complete game systems, generate worlds with AI, run live sessions, and ship publishable creator packs with discoverability and LFG built in.
          </p>
        </header>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {CARDS.map((card) => (
            <Link key={card.to} to={card.to} className="paper-panel p-4 hover:-translate-y-0.5 transition-transform">
              <h2 className="text-2xl uppercase">{card.title}</h2>
              <p className="text-sm text-[#121212]/70 mt-1">{card.description}</p>
            </Link>
          ))}
        </section>
      </main>

      <TrayNav invert={false} />
    </div>
  );
}
