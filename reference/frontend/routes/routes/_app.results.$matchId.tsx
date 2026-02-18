import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { typedApi, useConvexQuery } from "@/lib/convexHelpers";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Crown,
  Loader2,
  Skull,
  Swords,
  Trophy,
} from "lucide-react";
import { useConvexAuth } from "convex/react";

export const Route = createFileRoute("/_app/results/$matchId")({
  component: ResultsPage,
});

function ResultsPage() {
  const { matchId } = Route.useParams() as { matchId: Id<"gameLobbies"> };
  const { isAuthenticated } = useConvexAuth();

  const lobby = useConvexQuery(
    typedApi.games.getLobbyDetails,
    isAuthenticated ? { lobbyId: matchId } : "skip"
  );

  if (!lobby) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background scanner-noise">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const isCompleted = lobby.status === "completed" || lobby.status === "forfeited";
  if (!isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background scanner-noise">
        <div className="text-center p-8 bg-white border-zine shadow-zine">
          <Swords className="w-12 h-12 mx-auto mb-4 text-primary/40" />
          <h2 className="text-2xl font-black uppercase mb-2">Game In Progress</h2>
          <p className="text-black/60 font-bold mb-6">This game hasn't finished yet.</p>
          <Link to="/play/$matchId" params={{ matchId }}>
            <Button className="h-12 bg-primary text-white border-zine font-black uppercase shadow-zine-sm hover:shadow-zine hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              Go to Game
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const winnerId = lobby.winnerId;
  const isWinner = winnerId === lobby.hostId;
  const winnerName = isWinner ? lobby.hostUsername : (lobby.opponentUsername ?? "Opponent");
  const loserName = isWinner ? (lobby.opponentUsername ?? "Opponent") : lobby.hostUsername;

  return (
    <div className="min-h-screen bg-background scanner-noise pt-12">
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23121212' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-2xl">
        {/* Result Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <div
            className={cn(
              "w-24 h-24 mx-auto mb-6 border-zine shadow-zine flex items-center justify-center",
              winnerId ? "bg-amber-400" : "bg-slate-400"
            )}
          >
            {winnerId ? (
              <Crown className="w-12 h-12 text-white" />
            ) : (
              <Swords className="w-12 h-12 text-white" />
            )}
          </div>
          <h1 className="text-5xl font-black text-black uppercase tracking-tighter ink-bleed-advanced">
            {lobby.status === "forfeited" ? "Game Forfeited" : "Game Over"}
          </h1>
        </motion.div>

        {/* Match Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-8 bg-white border-zine shadow-zine ink-wash mb-8"
        >
          <div className="flex items-center justify-between gap-4">
            {/* Winner */}
            <div className="text-center flex-1">
              <div className="w-16 h-16 mx-auto bg-amber-100 border-zine flex items-center justify-center mb-3">
                <Trophy className="w-8 h-8 text-amber-600" />
              </div>
              <p className="font-black text-black uppercase text-lg">{winnerName}</p>
              <Badge className="bg-green-100 text-green-700 border-green-500 border-2 font-black uppercase text-xs rounded-none mt-1">
                Winner
              </Badge>
            </div>

            {/* VS */}
            <div className="text-4xl font-black text-black/20 uppercase">VS</div>

            {/* Loser */}
            <div className="text-center flex-1">
              <div className="w-16 h-16 mx-auto bg-slate-100 border-zine flex items-center justify-center mb-3">
                <Skull className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-black text-black/60 uppercase text-lg">{loserName}</p>
              <Badge className="bg-red-100 text-red-700 border-red-500 border-2 font-black uppercase text-xs rounded-none mt-1">
                Defeated
              </Badge>
            </div>
          </div>

          {/* Match Info */}
          <div className="mt-8 pt-6 border-t-2 border-dashed border-black/10 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs font-black text-black/40 uppercase tracking-wider">Mode</p>
              <p className="text-lg font-black text-black uppercase">{lobby.mode}</p>
            </div>
            <div>
              <p className="text-xs font-black text-black/40 uppercase tracking-wider">Turns</p>
              <p className="text-lg font-black text-black uppercase">{lobby.turnNumber ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-black text-black/40 uppercase tracking-wider">Result</p>
              <p className="text-lg font-black text-black uppercase">
                {lobby.status === "forfeited" ? "Forfeit" : "KO"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4 justify-center"
        >
          <Link to="/lunchtable">
            <Button
              variant="outline"
              className="h-14 px-8 border-zine font-black uppercase tracking-wider text-lg hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Table
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
