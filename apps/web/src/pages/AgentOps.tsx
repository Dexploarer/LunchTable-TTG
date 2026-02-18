import { AgentOpsTab } from "@/features/ttgStudio/tabs/AgentOpsTab";
import { TrayNav } from "@/components/layout/TrayNav";

export function AgentOps() {
  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <header className="paper-panel p-4">
          <h1 className="text-4xl uppercase">Agent Ops</h1>
          <p className="text-sm text-[#121212]/70 mt-1">
            Configure narrator + player agents and run deterministic playtest sessions.
          </p>
        </header>
        <AgentOpsTab />
      </main>
      <TrayNav invert={false} />
    </div>
  );
}
