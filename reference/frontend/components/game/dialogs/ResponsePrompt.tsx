"use client";

import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, X, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { CardInZone } from "../hooks/useGameBoard";

interface ResponseCard {
  cardId: Id<"cardDefinitions">;
  effectName: string;
  effectIndex: number;
  speed: 1 | 2 | 3;
  card?: CardInZone;
}

interface ResponsePromptProps {
  isOpen: boolean;
  actionType: string;
  responseCards: ResponseCard[];
  timeRemaining: number;
  onActivate: (cardId: Id<"cardDefinitions">, effectIndex: number) => void;
  onPass: () => void;
}

export function ResponsePrompt({
  isOpen,
  actionType,
  responseCards,
  timeRemaining: initialTimeRemaining,
  onActivate,
  onPass,
}: ResponsePromptProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);

  useEffect(() => {
    setTimeRemaining(initialTimeRemaining);
  }, [initialTimeRemaining]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          onPass();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onPass]);

  const handleActivate = useCallback(
    (card: ResponseCard) => {
      onActivate(card.cardId, card.effectIndex);
    },
    [onActivate]
  );

  const seconds = Math.ceil(timeRemaining / 1000);
  const progressPercent = (timeRemaining / 30000) * 100;
  const singleResponseCard = responseCards[0];

  const getPromptMessage = () => {
    switch (actionType) {
      case "chain_response":
        return "Chain opportunity! Respond?";
      case "attack_response":
        return "Attack declared! Activate a trap?";
      case "summon_response":
        return "Monster summoned! Respond?";
      case "damage_response":
        return "Damage step! Modify ATK/DEF?";
      default:
        return "Activate a response?";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 pointer-events-none"
          />

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-2 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-2"
          >
            <div
              className="bg-background/95 backdrop-blur-md border-2 border-yellow-500/50 rounded-xl shadow-2xl shadow-yellow-500/20 p-3"
              data-testid="response-prompt"
            >
              {/* Header with timer */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    {seconds <= 5 && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                    )}
                  </div>
                  <span className="font-semibold text-sm">{getPromptMessage()}</span>
                </div>
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    seconds <= 5 ? "text-red-500" : "text-yellow-500"
                  )}
                >
                  {seconds}s
                </span>
              </div>

              {/* Timer progress bar */}
              <div className="h-1 bg-slate-700 rounded-full mb-3 overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full transition-colors",
                    seconds <= 5 ? "bg-red-500" : "bg-yellow-500"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Response cards */}
              {responseCards.length > 0 ? (
                <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
                  {responseCards.map((response) => (
                    <button
                      type="button"
                      key={`${response.cardId}-${response.effectIndex}`}
                      onClick={() => handleActivate(response)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-lg border-2 transition-all",
                        "border-slate-700 bg-slate-800/50 hover:border-yellow-500/50 hover:bg-slate-800"
                      )}
                      data-testid="chain-link"
                    >
                      <div className="w-8 h-11 rounded border bg-linear-to-br from-purple-600 to-purple-800 shrink-0 overflow-hidden">
                        {response.card?.imageUrl ? (
                          <Image
                            src={response.card.imageUrl}
                            alt={response.effectName}
                            width={32}
                            height={44}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Zap className="w-3 h-3 text-purple-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-left">
                        <div className="font-medium text-xs flex items-center gap-1.5">
                          {response.effectName}
                          <span className="text-[8px] px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                            Speed {response.speed}
                          </span>
                        </div>
                        {response.card?.name && (
                          <div className="text-[10px] text-muted-foreground">
                            {response.card.name}
                          </div>
                        )}
                      </div>

                      <Zap className="w-4 h-4 text-yellow-500" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3 mb-3">
                  No available responses
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={onPass} size="sm">
                  <X className="w-3 h-3 mr-1" />
                  Pass
                </Button>

                {responseCards.length === 1 && (
                  <Button
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={() => {
                      if (singleResponseCard) {
                        handleActivate(singleResponseCard);
                      }
                    }}
                    size="sm"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Activate
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
