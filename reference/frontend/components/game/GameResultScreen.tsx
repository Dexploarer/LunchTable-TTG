"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Coins,
  Crown,
  Home,
  RotateCcw,
  Shield,
  Skull,
  Star,
  Swords,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

type GameResult = "victory" | "defeat" | "draw";

interface GameStats {
  damageDealt: number;
  damageReceived: number;
  cardsPlayed: number;
  stereotypesDestroyed: number;
  spellsCast: number;
  turnsPlayed: number;
  matchDuration: number;
}

interface Rewards {
  gold: number;
  xp: number;
  rankChange?: number;
  newRank?: string;
  bonuses?: { name: string; amount: number }[];
}

interface GameResultScreenProps {
  result: GameResult;
  playerName: string;
  opponentName: string;
  stats: GameStats;
  rewards: Rewards;
  gameMode: "story" | "ranked" | "casual" | "practice";
  onPlayAgain?: () => void;
  onReturnToMenu?: () => void;
  isOpen: boolean;
}

export function GameResultScreen({
  result,
  opponentName,
  stats,
  rewards,
  gameMode,
  onPlayAgain,
  onReturnToMenu,
  isOpen,
}: GameResultScreenProps) {
  const navigate = useNavigate();
  const [showRewards, setShowRewards] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  const isVictory = result === "victory";
  const isDraw = result === "draw";

  useEffect(() => {
    if (isOpen) {
      setShowRewards(false);
      setShowStats(false);
      setAnimationComplete(false);

      const rewardsTimer = setTimeout(() => setShowRewards(true), 1500);
      const statsTimer = setTimeout(() => setShowStats(true), 2500);
      const completeTimer = setTimeout(() => setAnimationComplete(true), 3500);

      return () => {
        clearTimeout(rewardsTimer);
        clearTimeout(statsTimer);
        clearTimeout(completeTimer);
      };
    }
    return undefined;
  }, [isOpen]);

  const handlePlayAgain = () => {
    if (onPlayAgain) {
      onPlayAgain();
    } else {
      navigate({ to: "/lunchtable" });
    }
  };

  const handleReturnToMenu = () => {
    if (onReturnToMenu) {
      onReturnToMenu();
    } else {
      navigate({ to: "/" });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md overflow-y-auto py-8"
      >
        <div
          className={cn(
            "absolute inset-0",
            isVictory
              ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-900/30 via-transparent to-transparent"
              : isDraw
                ? "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent"
                : "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/30 via-transparent to-transparent"
          )}
        />

        <div className="relative w-full max-w-2xl mx-4">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="text-center mb-8"
          >
            <div
              className={cn(
                "inline-flex items-center justify-center w-24 h-24 rounded-full mb-4",
                isVictory
                  ? "bg-yellow-500/20 border-4 border-yellow-500"
                  : isDraw
                    ? "bg-blue-500/20 border-4 border-blue-500"
                    : "bg-red-500/20 border-4 border-red-500"
              )}
            >
              {isVictory ? (
                <Trophy className="w-12 h-12 text-yellow-400" />
              ) : isDraw ? (
                <Shield className="w-12 h-12 text-blue-400" />
              ) : (
                <Skull className="w-12 h-12 text-red-400" />
              )}
            </div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                "text-5xl font-black uppercase tracking-tighter mb-2",
                isVictory ? "text-yellow-400" : isDraw ? "text-blue-400" : "text-red-400"
              )}
            >
              {isVictory ? "Victory!" : isDraw ? "Draw!" : "Defeat"}
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[#a89f94] text-lg"
            >
              {isVictory
                ? `You defeated ${opponentName}!`
                : isDraw
                  ? `Match ended in a draw against ${opponentName}`
                  : `${opponentName} has bested you`}
            </motion.p>
          </motion.div>

          <AnimatePresence>
            {showRewards && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div
                  className="p-6 rounded-xl bg-black/60 border border-[#3d2b1f]"
                  data-testid="battle-rewards"
                >
                  <h2 className="text-lg font-bold text-[#e8e0d5] mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#d4af37]" />
                    Rewards Earned
                  </h2>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
                    >
                      <Coins className="w-8 h-8 text-yellow-400" />
                      <div>
                        <p className="text-sm text-yellow-300/60">Gold</p>
                        <p className="text-2xl font-black text-yellow-400">+{rewards.gold}</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30"
                    >
                      <Zap className="w-8 h-8 text-blue-400" />
                      <div>
                        <p className="text-sm text-blue-300/60">Experience</p>
                        <p className="text-2xl font-black text-blue-400">+{rewards.xp} XP</p>
                      </div>
                    </motion.div>
                  </div>

                  {gameMode === "ranked" && rewards.rankChange !== undefined && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className={cn(
                        "flex items-center justify-center gap-3 p-3 rounded-lg",
                        rewards.rankChange > 0
                          ? "bg-green-500/10 border border-green-500/30"
                          : rewards.rankChange < 0
                            ? "bg-red-500/10 border border-red-500/30"
                            : "bg-gray-500/10 border border-gray-500/30"
                      )}
                    >
                      {rewards.rankChange > 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : rewards.rankChange < 0 ? (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      ) : null}
                      <span
                        className={cn(
                          "font-bold",
                          rewards.rankChange > 0
                            ? "text-green-400"
                            : rewards.rankChange < 0
                              ? "text-red-400"
                              : "text-gray-400"
                        )}
                      >
                        {rewards.rankChange > 0 ? "+" : ""}
                        {rewards.rankChange} Rating
                      </span>
                      {rewards.newRank && (
                        <span className="flex items-center gap-1 text-[#d4af37]">
                          <Crown className="w-4 h-4" />
                          {rewards.newRank}
                        </span>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="p-6 rounded-xl bg-black/40 border border-[#3d2b1f]">
                  <h2 className="text-lg font-bold text-[#e8e0d5] mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#d4af37]" />
                    Match Statistics
                  </h2>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
                    <div>
                      <Swords className="w-5 h-5 mx-auto mb-1 text-red-400" />
                      <p className="text-xl font-bold text-[#e8e0d5]">{stats.damageDealt}</p>
                      <p className="text-xs text-[#a89f94]">Damage</p>
                    </div>
                    <div>
                      <Shield className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                      <p className="text-xl font-bold text-[#e8e0d5]">{stats.damageReceived}</p>
                      <p className="text-xs text-[#a89f94]">Taken</p>
                    </div>
                    <div>
                      <Star className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                      <p className="text-xl font-bold text-[#e8e0d5]">{stats.cardsPlayed}</p>
                      <p className="text-xs text-[#a89f94]">Cards</p>
                    </div>
                    <div>
                      <Skull className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                      <p className="text-xl font-bold text-[#e8e0d5]">
                        {stats.stereotypesDestroyed}
                      </p>
                      <p className="text-xs text-[#a89f94]">Slain</p>
                    </div>
                    <div>
                      <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                      <p className="text-xl font-bold text-[#e8e0d5]">{stats.spellsCast}</p>
                      <p className="text-xs text-[#a89f94]">Spells</p>
                    </div>
                    <div>
                      <Clock className="w-5 h-5 mx-auto mb-1 text-green-400" />
                      <p className="text-xl font-bold text-[#e8e0d5]">
                        {formatDuration(stats.matchDuration)}
                      </p>
                      <p className="text-xs text-[#a89f94]">Time</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {animationComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button
                  onClick={handlePlayAgain}
                  className="w-full sm:w-auto bg-linear-to-r from-[#8b4513] via-[#d4af37] to-[#8b4513] text-white font-bold px-8 py-6"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Play Again
                </Button>
                <Button
                  onClick={handleReturnToMenu}
                  variant="outline"
                  className="w-full sm:w-auto border-[#3d2b1f] text-[#a89f94] hover:text-[#e8e0d5] px-8 py-6"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Menu
                </Button>
                {gameMode === "story" && isVictory && (
                  <Button
                    onClick={() => navigate({ to: "/play/story" })}
                    variant="ghost"
                    className="w-full sm:w-auto text-[#d4af37]"
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Next Stage
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
