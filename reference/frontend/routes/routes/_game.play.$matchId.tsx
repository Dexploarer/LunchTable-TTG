import { GameBoard } from "@/components/game/GameBoard";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_game/play/$matchId")({
  component: PlayMatchPage,
});

function PlayMatchPage() {
  const { matchId } = Route.useParams() as { matchId: Id<"gameLobbies"> };
  return <GameBoard lobbyId={matchId} />;
}
