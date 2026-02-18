"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Layers } from "lucide-react";

export interface QueuedEffect {
  id: string;
  cardName: string;
  effectDescription: string;
  cardImageUrl?: string;
  playerName: string;
  isPlayerEffect: boolean;
  chainLink?: number;
}

interface EffectQueueWidgetProps {
  effects: QueuedEffect[];
  isResolving?: boolean;
  className?: string;
}

export function EffectQueueWidget({
  effects,
  isResolving = false,
  className,
}: EffectQueueWidgetProps) {
  if (effects.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "fixed right-4 top-1/2 -translate-y-1/2 z-30",
        "w-64 max-h-96 overflow-hidden",
        "bg-black/90 backdrop-blur-sm",
        "border-2 border-purple-500/50 rounded-lg shadow-2xl",
        className
      )}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-purple-500/30 bg-purple-900/20">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
            Effect Queue
          </span>
          {isResolving && (
            <div className="ml-auto flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400 animate-spin" />
              <span className="text-[10px] text-purple-400">Resolving</span>
            </div>
          )}
        </div>
      </div>

      {/* Effects List */}
      <div className="overflow-y-auto max-h-80 tcg-scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {effects.map((effect, index) => (
            <EffectQueueItem
              key={effect.id}
              effect={effect}
              position={index + 1}
              isNext={index === 0}
              isResolving={isResolving && index === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-purple-500/30 bg-purple-900/10">
        <p className="text-[10px] text-purple-300/70 text-center">
          {effects.length} effect{effects.length !== 1 ? "s" : ""} in queue
        </p>
      </div>
    </motion.div>
  );
}

function EffectQueueItem({
  effect,
  position,
  isNext,
  isResolving,
}: {
  effect: QueuedEffect;
  position: number;
  isNext: boolean;
  isResolving: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "px-3 py-2 border-b border-purple-500/10",
        "transition-colors duration-200",
        isNext && "bg-purple-500/20",
        isResolving && "animate-pulse"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Position Number */}
        <div
          className={cn(
            "shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
            "text-xs font-bold",
            isNext
              ? "bg-purple-500 text-white"
              : "bg-purple-900/50 text-purple-300 border border-purple-500/30"
          )}
        >
          {effect.chainLink || position}
        </div>

        {/* Card Image (optional) */}
        {effect.cardImageUrl && (
          <div className="shrink-0 w-8 h-11 rounded-sm overflow-hidden border border-purple-500/30">
            <img
              src={effect.cardImageUrl}
              alt={effect.cardName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Effect Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <h4
              className={cn(
                "text-xs font-bold truncate",
                effect.isPlayerEffect ? "text-green-300" : "text-red-300"
              )}
            >
              {effect.cardName}
            </h4>
          </div>
          <p className="text-[10px] text-purple-200/80 leading-tight line-clamp-2">
            {effect.effectDescription}
          </p>
          <p className="text-[9px] text-purple-400/60 mt-0.5">{effect.playerName}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Compact version for mobile
export function EffectQueueBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      className="fixed top-20 right-4 z-30"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center shadow-lg animate-pulse">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">{count}</span>
        </div>
      </div>
    </motion.div>
  );
}
