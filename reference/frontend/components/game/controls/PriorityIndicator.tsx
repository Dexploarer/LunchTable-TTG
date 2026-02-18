"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ResponseWindowType =
  | "summon"
  | "attack_declaration"
  | "spell_activation"
  | "trap_activation"
  | "effect_activation"
  | "damage_calculation"
  | "end_phase"
  | "open";

interface PriorityIndicatorProps {
  isOpen: boolean;
  windowType: ResponseWindowType;
  hasPriority: boolean;
  isChainOpen: boolean;
  timeRemaining?: number; // milliseconds
  onPass: () => void;
  className?: string;
}

const WINDOW_LABELS: Record<ResponseWindowType, string> = {
  summon: "Summon Response",
  attack_declaration: "Attack Declaration",
  spell_activation: "Spell Activation",
  trap_activation: "Trap Activation",
  effect_activation: "Effect Activation",
  damage_calculation: "Damage Calculation",
  end_phase: "End Phase",
  open: "Open Priority",
};

const WINDOW_ICONS: Record<ResponseWindowType, React.ElementType> = {
  summon: ShieldCheck,
  attack_declaration: AlertCircle,
  spell_activation: ShieldCheck,
  trap_activation: ShieldCheck,
  effect_activation: ShieldCheck,
  damage_calculation: AlertCircle,
  end_phase: Clock,
  open: ShieldCheck,
};

export function PriorityIndicator({
  isOpen,
  windowType,
  hasPriority,
  isChainOpen,
  timeRemaining: initialTime,
  onPass,
  className,
}: PriorityIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime ?? 0);

  useEffect(() => {
    if (initialTime !== undefined) {
      setTimeRemaining(initialTime);
    }
  }, [initialTime]);

  useEffect(() => {
    if (!isOpen || !hasPriority || !initialTime) return;

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
  }, [isOpen, hasPriority, initialTime, onPass]);

  const handlePass = useCallback(() => {
    onPass();
  }, [onPass]);

  const Icon = WINDOW_ICONS[windowType];
  const seconds = Math.ceil(timeRemaining / 1000);
  const progressPercent = initialTime ? (timeRemaining / initialTime) * 100 : 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "fixed top-16 left-1/2 -translate-x-1/2 z-40",
            "bg-background/95 backdrop-blur-md border-2 rounded-xl",
            "shadow-lg px-3 py-2",
            hasPriority
              ? "border-green-500/50 shadow-green-500/20"
              : "border-slate-500/50 shadow-slate-500/20",
            className
          )}
          data-testid="priority-indicator"
        >
          <div className="flex items-center gap-3">
            {/* Icon & Status */}
            <div
              className={cn(
                "flex items-center gap-1.5",
                hasPriority ? "text-green-400" : "text-slate-400"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{WINDOW_LABELS[windowType]}</span>
            </div>

            {/* Separator */}
            <div className="h-4 w-px bg-border" />

            {/* Priority Status */}
            <div className="flex items-center gap-1.5">
              {hasPriority ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-green-400">Your Priority</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-xs font-medium text-slate-400">
                    Opponent&apos;s Priority
                  </span>
                </>
              )}
            </div>

            {/* Chain Status */}
            {isChainOpen && (
              <>
                <div className="h-4 w-px bg-border" />
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                  Chain Building
                </span>
              </>
            )}

            {/* Timer (if applicable) */}
            {hasPriority && initialTime && (
              <>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        seconds <= 5 ? "bg-red-500" : "bg-green-500"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums w-6 text-right",
                      seconds <= 5 ? "text-red-500" : "text-muted-foreground"
                    )}
                  >
                    {seconds}s
                  </span>
                </div>
              </>
            )}

            {/* Pass Button (only when you have priority) */}
            {hasPriority && (
              <>
                <div className="h-4 w-px bg-border" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePass}
                  className="h-7 text-xs px-2"
                >
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Pass
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
