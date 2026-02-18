"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Coins, Star, Trophy, Zap } from "lucide-react";

interface StoryBattleCompleteDialogProps {
  open: boolean;
  onClose: () => void;
  result: {
    won: boolean;
    rewards: {
      gold: number;
      xp: number;
      cards?: Array<{
        id: string;
        name: string;
        rarity: string;
      }>;
    };
    starsEarned: number;
    levelUp?: {
      newLevel: number;
      oldLevel: number;
    } | null;
    newBadges?: Array<{
      badgeId: string;
      displayName: string;
      description: string;
    }>;
    cardsReceived?: Array<{
      cardDefinitionId: string;
      name: string;
      rarity: string;
      imageUrl?: string;
    }>;
  };
  chapterName?: string;
}

export function StoryBattleCompleteDialog({
  open,
  onClose,
  result,
  chapterName,
}: StoryBattleCompleteDialogProps) {
  const { won, rewards, starsEarned, levelUp, newBadges, cardsReceived } = result;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-[#3d2b1f] max-w-2xl">
        <DialogTitle className="sr-only">{won ? "Victory!" : "Defeat"}</DialogTitle>

        {/* Victory/Defeat Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center mb-6"
        >
          <div className={cn("text-6xl font-bold mb-2", won ? "text-[#d4af37]" : "text-gray-500")}>
            {won ? "VICTORY" : "DEFEAT"}
          </div>
          {chapterName && <p className="text-[#a89f94] text-lg">{chapterName}</p>}
        </motion.div>

        {won ? (
          <div className="space-y-6">
            {/* Stars Earned */}
            <div className="p-6 text-center zine-border bg-card">
              <div
                className="flex items-center justify-center gap-2 mb-3"
                data-testid="stage-stars"
              >
                {[1, 2, 3].map((star) => (
                  <motion.div
                    key={star}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + star * 0.15, type: "spring" }}
                  >
                    <Star
                      className={cn(
                        "w-10 h-10",
                        star <= starsEarned ? "fill-yellow-400 text-yellow-400" : "text-gray-600"
                      )}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-sm text-[#a89f94]" data-testid="story-dialogue">
                {starsEarned === 3
                  ? "Perfect Victory!"
                  : starsEarned === 2
                    ? "Excellent Performance!"
                    : "Victory!"}
              </p>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 flex items-center gap-3 zine-border bg-card">
                <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-[#d4af37]" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#d4af37]">+{rewards.gold}</div>
                  <div className="text-xs text-[#a89f94]">Gold</div>
                </div>
              </div>

              <div className="p-4 flex items-center gap-3 zine-border bg-card">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">+{rewards.xp}</div>
                  <div className="text-xs text-[#a89f94]">XP</div>
                </div>
              </div>
            </div>

            {/* Level Up */}
            {levelUp && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="p-4 text-center zine-border bg-linear-to-br from-purple-900/40 to-blue-900/40">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="w-6 h-6 text-[#d4af37]" />
                    <div className="text-2xl font-bold text-[#d4af37]">LEVEL UP!</div>
                    <Trophy className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <p className="text-[#a89f94]">
                    Level {levelUp.oldLevel} → Level {levelUp.newLevel}
                  </p>
                </div>
              </motion.div>
            )}

            {/* New Badges */}
            {newBadges && newBadges.length > 0 && (
              <div className="p-4 relative overflow-hidden zine-border bg-card">
                {/* Gold Metal Texture Background */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "url(/assets/textures/gold-metal.png)",
                    backgroundSize: "512px 512px",
                    backgroundRepeat: "repeat",
                  }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-[#d4af37]" />
                    <div className="text-lg font-bold text-[#e8e0d5]">New Badges Earned!</div>
                  </div>
                  <div className="space-y-2">
                    {newBadges.map((badge) => (
                      <motion.div
                        key={badge.badgeId}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center gap-3 p-2 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 backdrop-blur-sm"
                      >
                        <Trophy className="w-5 h-5 text-[#d4af37]" />
                        <div>
                          <div className="text-sm font-bold text-[#e8e0d5]">
                            {badge.displayName}
                          </div>
                          <div className="text-xs text-[#a89f94]">{badge.description}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cards Received */}
            {cardsReceived && cardsReceived.length > 0 && (
              <div className="p-4 zine-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-[#d4af37]" />
                  <div className="text-lg font-bold text-[#e8e0d5]">Cards Received</div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {cardsReceived.map((card, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-[#d4af37]/50"
                    >
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center p-2">
                          <span className="text-xs text-center text-white">{card.name}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Continue Button */}
            <Button
              onClick={onClose}
              className="w-full bg-[#d4af37] hover:bg-[#f9e29f] text-[#1a1614] font-bold py-3 flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <p className="text-[#a89f94] text-lg">You were defeated. Try again to earn rewards!</p>

            <Button
              onClick={onClose}
              className="w-full bg-[#3d2b1f] hover:bg-[#5d3b2f] text-[#e8e0d5]"
            >
              Return to Chapter
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
