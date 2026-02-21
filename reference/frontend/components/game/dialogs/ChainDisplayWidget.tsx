"use client";

import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Layers, Zap } from "lucide-react";

interface ChainLink {
  chainPosition: number;
  cardId: Id<"cardDefinitions">;
  cardName: string;
  effectName: string;
  spellSpeed: 1 | 2 | 3;
  playerId: Id<"users">;
  imageUrl?: string;
}

interface ChainDisplayWidgetProps {
  chain: ChainLink[];
  currentPlayerId?: Id<"users">;
  isResolving?: boolean;
  className?: string;
}

const SPELL_SPEED_COLORS = {
  1: "border-green-500/50 bg-green-500/10",
  2: "border-yellow-500/50 bg-yellow-500/10",
  3: "border-red-500/50 bg-red-500/10",
};

const SPELL_SPEED_TEXT = {
  1: "text-green-400",
  2: "text-yellow-400",
  3: "text-red-400",
};

export function ChainDisplayWidget({
  chain,
  currentPlayerId,
  isResolving,
  className,
}: ChainDisplayWidgetProps) {
  if (chain.length === 0) return null;

  // Display chain in reverse order (newest at top, resolves top-down)
  const displayChain = [...chain].reverse();

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={cn(
        "fixed right-2 top-1/2 -translate-y-1/2 z-40",
        "w-48 max-h-[60vh] overflow-y-auto",
        "bg-background/95 backdrop-blur-md border-2 border-purple-500/50 rounded-xl",
        "shadow-2xl shadow-purple-500/20 p-2",
        className
      )}
      data-testid="chain-display"
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Layers className="h-4 w-4 text-purple-400" />
        <span className="font-semibold text-xs text-purple-400">Chain Stack ({chain.length})</span>
        {isResolving && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded animate-pulse">
            Resolving
          </span>
        )}
      </div>

      {/* Chain Links */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {displayChain.map((link, index) => {
            const isYours = link.playerId === currentPlayerId;
            const isTopOfChain = index === 0;

            return (
              <motion.div
                key={`${link.cardId}-${link.chainPosition}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
                className={cn(
                  "relative p-1.5 rounded-lg border-2 transition-all",
                  SPELL_SPEED_COLORS[link.spellSpeed],
                  isTopOfChain &&
                    isResolving &&
                    "ring-2 ring-purple-400 ring-offset-1 ring-offset-background"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {/* Chain Number */}
                  <div className="shrink-0 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                    {link.chainPosition}
                  </div>

                  {/* Card Thumbnail */}
                  <div className="w-6 h-8 rounded border bg-slate-800 shrink-0 overflow-hidden">
                    {link.imageUrl ? (
                      <Image
                        src={link.imageUrl}
                        alt={link.cardName}
                        width={24}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Zap className="w-3 h-3 text-purple-300" />
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium truncate">{link.cardName}</div>
                    <div className="flex items-center gap-1">
                      <span className={cn("text-[8px]", SPELL_SPEED_TEXT[link.spellSpeed])}>
                        SS{link.spellSpeed}
                      </span>
                      <span className="text-[8px] text-muted-foreground">
                        {isYours ? "(You)" : "(Opp)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Effect Name */}
                <div className="mt-1 text-[9px] text-muted-foreground truncate pl-6">
                  {link.effectName}
                </div>

                {/* Resolution Arrow (for non-last items) */}
                {index < displayChain.length - 1 && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
                    <ArrowDown className="h-3 w-3 text-purple-400" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Resolution Order Note */}
      <div className="mt-2 pt-1.5 border-t border-purple-500/30">
        <p className="text-[8px] text-muted-foreground text-center">Chain resolves top to bottom</p>
      </div>
    </motion.div>
  );
}
