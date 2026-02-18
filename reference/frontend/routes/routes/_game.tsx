import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_game")({
  component: GameLayout,
});

function GameLayout() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Outlet />
    </div>
  );
}
