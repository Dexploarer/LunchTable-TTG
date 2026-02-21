"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameLobby } from "@/hooks/game/useGameLobby";
import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Clock,
  Copy,
  Gamepad2,
  Loader2,
  Play,
  Plus,
  Swords,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/lunchtable")({
  component: LunchtablePage,
});

function LunchtablePage() {
  const navigate = useNavigate();
  const {
    waitingLobbies,
    myLobby,
    privateLobby,
    incomingChallenge,
    isLoading,
    hasActiveLobby,
    createLobby,
    joinLobby,
    joinByCode,
    cancelLobby,
    declineChallenge,
  } = useGameLobby();

  const activeGame = useConvexQuery(typedApi.games.checkForActiveGame, {});

  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"casual" | "ranked">("casual");
  const [isPrivate, setIsPrivate] = useState(false);
  const [cpuDifficulty, setCpuDifficulty] = useState<"easy" | "medium" | "hard" | "boss">("easy");
  const [isStartingCPU, setIsStartingCPU] = useState(false);
  const quickPlayMutation = useConvexMutation(
    typedApi.progression.storyBattle.quickPlayStoryBattle
  );

  // Auto-navigate host to game when opponent joins (lobby becomes active)
  const hasNavigated = useRef(false);
  useEffect(() => {
    if (myLobby && myLobby.status === "active" && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate({ to: "/play/$matchId", params: { matchId: myLobby._id } });
    }
    if (!myLobby || myLobby.status !== "active") {
      hasNavigated.current = false;
    }
  }, [myLobby, navigate]);

  const handleCreateLobby = useCallback(async () => {
    setIsCreating(true);
    try {
      await createLobby(selectedMode, isPrivate);
    } catch {
      // Error handled by hook
    } finally {
      setIsCreating(false);
    }
  }, [createLobby, selectedMode, isPrivate]);

  const handleJoinLobby = useCallback(
    async (lobbyId: Id<"gameLobbies">) => {
      setIsJoining(true);
      try {
        const result = await joinLobby(lobbyId);
        navigate({ to: "/play/$matchId", params: { matchId: result.lobbyId } });
      } catch {
        // Error handled by hook
      } finally {
        setIsJoining(false);
      }
    },
    [joinLobby, navigate]
  );

  const handleJoinByCode = useCallback(async () => {
    if (!joinCodeInput.trim()) return;
    setIsJoining(true);
    try {
      const result = await joinByCode(joinCodeInput.trim().toUpperCase());
      navigate({ to: "/play/$matchId", params: { matchId: result.lobbyId } });
    } catch {
      // Error handled by hook
    } finally {
      setIsJoining(false);
    }
  }, [joinByCode, joinCodeInput, navigate]);

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Join code copied!");
  }, []);

  const handleStartCPUGame = useCallback(async () => {
    setIsStartingCPU(true);
    try {
      const result = await quickPlayMutation({ difficulty: cpuDifficulty });
      navigate({ to: "/play/$matchId", params: { matchId: result.lobbyId } });
    } catch (error) {
      console.error("Failed to start CPU game:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start game");
    } finally {
      setIsStartingCPU(false);
    }
  }, [quickPlayMutation, cpuDifficulty, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background scanner-noise">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background scanner-noise pt-12">
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23121212' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-5xl">
        {/* Header */}
        <div className="text-center sm:text-left mb-12">
          <h1 className="text-6xl font-black text-black uppercase tracking-tighter ink-bleed-advanced relative z-10">
            The Table
          </h1>
          <p className="text-primary/60 font-bold uppercase tracking-widest text-sm mt-2 border-l-4 border-primary pl-4">
            Find an opponent. Prove yourself.
          </p>
        </div>

        {/* Active Game Banner (Task 5) */}
        {activeGame?.hasActiveGame && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-amber-50 border-zine shadow-zine ink-wash"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 border-zine flex items-center justify-center">
                  <Swords className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight">
                    Active Game
                  </h3>
                  <p className="text-sm font-bold text-black/60">
                    vs {activeGame.opponentUsername} — Turn {activeGame.turnNumber}
                    {activeGame.isYourTurn ? " (Your Turn)" : " (Opponent's Turn)"}
                  </p>
                </div>
              </div>
              <Button
                onClick={() =>
                  navigate({
                    to: "/play/$matchId",
                    params: { matchId: activeGame.lobbyId },
                  })
                }
                className="h-12 px-8 bg-amber-500 hover:bg-amber-600 text-white font-black text-lg uppercase tracking-wider border-2 border-primary shadow-zine hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-zine-sm transition-all"
              >
                <Play className="w-5 h-5 mr-2" />
                Resume Game
              </Button>
            </div>
          </motion.div>
        )}

        {/* Incoming Challenge */}
        {incomingChallenge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 bg-indigo-50 border-zine shadow-zine ink-wash"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 border-zine flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight">
                    Incoming Challenge!
                  </h3>
                  <p className="text-sm font-bold text-black/60">
                    {incomingChallenge.hostUsername} ({incomingChallenge.hostRank}) wants to battle —{" "}
                    {incomingChallenge.mode}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => declineChallenge()}
                  className="h-10 border-zine font-black uppercase rounded-none"
                >
                  Decline
                </Button>
                <Button
                  onClick={() =>
                    handleJoinLobby(incomingChallenge._id)
                  }
                  className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white border-zine font-black uppercase shadow-zine-sm hover:shadow-zine hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  Accept
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* My Active Lobby */}
        {hasActiveLobby && myLobby && myLobby.status === "waiting" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-green-50 border-zine shadow-zine ink-wash"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500 border-zine flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight">
                    Waiting for Opponent
                  </h3>
                  <p className="text-sm font-bold text-black/60">
                    {myLobby.mode} {myLobby.isPrivate ? "(Private)" : "(Public)"} lobby
                  </p>
                  {myLobby.joinCode && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="bg-white border-zine font-mono font-black text-lg px-3 py-1 tracking-widest"
                      >
                        {myLobby.joinCode}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCopyCode(myLobby.joinCode!)}
                        className="h-8 w-8 rounded-none"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => cancelLobby()}
                className="h-10 border-zine font-black uppercase rounded-none hover:bg-red-50 hover:text-red-600 hover:border-red-600 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Lobby */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 bg-white border-zine shadow-zine ink-wash">
              <h2 className="text-2xl font-black text-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6" />
                Create Game
              </h2>

              {/* Mode Selector */}
              <div className="space-y-3 mb-6">
                <label className="text-xs font-black text-black uppercase tracking-wider">
                  Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMode("casual")}
                    className={cn(
                      "p-4 border-zine text-center transition-all font-black uppercase text-sm",
                      selectedMode === "casual"
                        ? "bg-primary text-white shadow-zine -translate-x-0.5 -translate-y-0.5"
                        : "bg-white text-black shadow-zine-sm hover:shadow-zine hover:-translate-y-0.5"
                    )}
                  >
                    <Gamepad2 className="w-5 h-5 mx-auto mb-1" />
                    Casual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMode("ranked")}
                    className={cn(
                      "p-4 border-zine text-center transition-all font-black uppercase text-sm",
                      selectedMode === "ranked"
                        ? "bg-primary text-white shadow-zine -translate-x-0.5 -translate-y-0.5"
                        : "bg-white text-black shadow-zine-sm hover:shadow-zine hover:-translate-y-0.5"
                    )}
                  >
                    <Trophy className="w-5 h-5 mx-auto mb-1" />
                    Ranked
                  </button>
                </div>
              </div>

              {/* Private Toggle */}
              <div className="flex items-center justify-between mb-6 p-3 border-2 border-dashed border-black/20">
                <span className="text-xs font-black text-black uppercase tracking-wider">
                  Private Game
                </span>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={cn(
                    "w-12 h-6 border-2 border-black transition-colors relative",
                    isPrivate ? "bg-primary" : "bg-slate-200"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 bg-white border border-black absolute top-0.5 transition-all",
                      isPrivate ? "left-6" : "left-0.5"
                    )}
                  />
                </button>
              </div>

              <Button
                onClick={handleCreateLobby}
                disabled={isCreating || hasActiveLobby}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-wider border-2 border-primary shadow-zine hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-zine-sm transition-all ink-wash"
              >
                {isCreating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Swords className="w-5 h-5 mr-2" />
                )}
                Create Lobby
              </Button>
            </div>

            {/* Join by Code */}
            <div className="p-6 bg-white border-zine shadow-zine ink-wash">
              <h2 className="text-xl font-black text-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Join by Code
              </h2>
              <div className="flex gap-2">
                <Input
                  placeholder="ENTER CODE"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
                  className="h-12 border-zine rounded-none shadow-zine-sm focus-visible:ring-0 focus-visible:shadow-zine uppercase font-mono font-black text-lg tracking-widest"
                  maxLength={6}
                />
                <Button
                  onClick={handleJoinByCode}
                  disabled={!joinCodeInput.trim() || isJoining}
                  className="h-12 px-6 bg-black text-white border-zine font-black uppercase shadow-zine-sm hover:shadow-zine hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
                </Button>
              </div>
            </div>

            {/* Play vs CPU */}
            <div className="p-6 bg-white border-zine shadow-zine ink-wash">
              <h2 className="text-xl font-black text-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Play vs CPU
              </h2>

              {/* Difficulty Selector */}
              <div className="space-y-3 mb-4">
                <label className="text-xs font-black text-black uppercase tracking-wider">
                  Difficulty
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["easy", "medium", "hard", "boss"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setCpuDifficulty(diff)}
                      className={cn(
                        "p-3 border-zine text-center transition-all font-black uppercase text-xs",
                        cpuDifficulty === diff
                          ? "bg-primary text-white shadow-zine -translate-x-0.5 -translate-y-0.5"
                          : "bg-white text-black shadow-zine-sm hover:shadow-zine hover:-translate-y-0.5"
                      )}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStartCPUGame}
                disabled={isStartingCPU}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-wider border-2 border-indigo-600 shadow-zine hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-zine-sm transition-all"
              >
                {isStartingCPU ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Bot className="w-5 h-5 mr-2" />
                )}
                Start Battle
              </Button>
            </div>
          </div>

          {/* Open Lobbies */}
          <div className="lg:col-span-2">
            <div className="p-6 bg-white border-zine shadow-zine ink-wash">
              <h2 className="text-2xl font-black text-black uppercase tracking-tighter mb-6 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Open Tables
                {waitingLobbies && waitingLobbies.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-reputation text-primary border-2 border-primary ml-2 px-2 font-bold shadow-zine-sm"
                  >
                    {waitingLobbies.length}
                  </Badge>
                )}
              </h2>

              {!waitingLobbies || waitingLobbies.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 border-zine rounded-full flex items-center justify-center mx-auto mb-4 transform -rotate-6">
                    <Swords className="w-8 h-8 text-primary/40" />
                  </div>
                  <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">
                    No Open Tables
                  </h3>
                  <p className="text-black/60 font-bold max-w-sm mx-auto">
                    Be the first to create a lobby and wait for a challenger!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {waitingLobbies.map((lobby) => (
                    <motion.div
                      key={lobby.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between gap-4 p-4 border-zine shadow-zine-sm hover:shadow-zine hover:-translate-y-0.5 transition-all bg-white group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-slate-100 border-zine flex items-center justify-center font-black text-lg uppercase">
                          {lobby.hostUsername[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-black uppercase truncate">
                            {lobby.hostUsername}
                          </p>
                          <div className="flex items-center gap-2 text-xs font-bold text-black/50 uppercase">
                            <Badge
                              variant="outline"
                              className="border-primary/30 text-primary/70 font-black text-[10px] px-1.5 rounded-none"
                            >
                              {lobby.hostRank}
                            </Badge>
                            <span>{lobby.hostRating} ELO</span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(lobby.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn(
                            "font-black uppercase text-xs rounded-none border-2",
                            lobby.mode === "ranked"
                              ? "bg-amber-100 text-amber-700 border-amber-500"
                              : "bg-slate-100 text-slate-700 border-slate-400"
                          )}
                        >
                          {lobby.mode}
                        </Badge>
                        <Button
                          onClick={() => handleJoinLobby(lobby.id)}
                          disabled={isJoining || hasActiveLobby}
                          size="sm"
                          className="h-9 px-4 bg-primary text-white border-zine font-black uppercase text-xs shadow-zine-sm hover:shadow-zine hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Swords className="w-3 h-3 mr-1" />
                          Fight
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
