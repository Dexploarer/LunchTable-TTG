"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { Shield, Swords, User, X } from "lucide-react";
import type { AttackOption, AttackTarget } from "../hooks/useGameBoard";

interface AttackModalProps {
  isOpen: boolean;
  attacker: AttackOption | null;
  targets: AttackTarget[];
  canDirectAttack: boolean;
  onSelectTarget: (targetId: Id<"cardDefinitions"> | undefined) => void;
  onClose: () => void;
}

export function AttackModal({
  isOpen,
  attacker,
  targets,
  canDirectAttack,
  onSelectTarget,
  onClose,
}: AttackModalProps) {
  if (!attacker) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4"
            aria-labelledby="attack-modal-title"
            aria-describedby="attack-modal-description"
          >
            <div className="bg-[#1a1614] border-2 border-red-500/30 rounded-xl shadow-2xl shadow-red-500/20 p-4 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3
                    id="attack-modal-title"
                    className="font-bold text-base text-red-400 flex items-center gap-2"
                  >
                    <Swords className="h-5 w-5" aria-hidden="true" />
                    Declare Attack
                  </h3>
                  <p id="attack-modal-description" className="text-xs text-[#a89f94] mt-1">
                    Select a target for {attacker.name}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={onClose}
                  className="h-8 w-8 text-[#a89f94] hover:text-[#e8e0d5]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Attacker Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-linear-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/40 mb-4">
                <div className="h-10 w-10 rounded-full bg-red-500/30 flex items-center justify-center">
                  <Swords className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm text-[#e8e0d5]">
                    {attacker.name ?? "Unknown"}
                  </div>
                  <div className="text-xs text-red-400 font-semibold">
                    ⚔️ {attacker.attack ?? 0} ATK
                  </div>
                </div>
              </div>

              {/* Target Selection */}
              <div className="space-y-2" aria-label="Attack target selection">
                <p className="text-sm font-semibold text-[#e8e0d5] mb-2">Choose Target:</p>

                {/* Monster Targets */}
                <div aria-label="Enemy monsters">
                  {targets.map((target) => {
                    const isDefense =
                      target.position === "defense" || target.position === "setDefense";
                    const hasKnownStats =
                      !target.isFaceDown &&
                      target.attack !== undefined &&
                      target.defense !== undefined;
                    const targetStat = hasKnownStats
                      ? isDefense
                        ? target.defense
                        : target.attack
                      : undefined;
                    const attackerWins =
                      hasKnownStats && targetStat !== undefined && attacker.attack !== undefined
                        ? attacker.attack > targetStat
                        : false;
                    const isDraw =
                      hasKnownStats && targetStat !== undefined && attacker.attack !== undefined
                        ? attacker.attack === targetStat
                        : false;

                    return (
                      <Button
                        key={target.instanceId}
                        aria-label={`Attack ${target.name}${hasKnownStats ? `, ${isDefense ? `Defense ${target.defense}` : `Attack ${target.attack}`}` : ", stats hidden"}${hasKnownStats ? `, ${attackerWins ? "you will win" : isDraw ? "will be a draw" : "you will lose"}` : ""}`}
                        className={cn(
                          "w-full justify-start gap-3 h-auto py-3 border-2 transition-all",
                          hasKnownStats &&
                            attackerWins &&
                            "bg-green-500/10 border-green-500/40 hover:bg-green-500/20 hover:border-green-500/60",
                          hasKnownStats &&
                            isDraw &&
                            "bg-yellow-500/10 border-yellow-500/40 hover:bg-yellow-500/20 hover:border-yellow-500/60",
                          hasKnownStats &&
                            !attackerWins &&
                            !isDraw &&
                            "bg-red-500/10 border-red-500/40 hover:bg-red-500/20 hover:border-red-500/60",
                          !hasKnownStats &&
                            "bg-purple-500/10 border-purple-500/40 hover:bg-purple-500/20 hover:border-purple-500/60"
                        )}
                        variant="outline"
                        onClick={() => onSelectTarget(target.instanceId)}
                      >
                        <div
                          className={cn(
                            "h-8 w-8 rounded flex items-center justify-center",
                            isDefense ? "bg-blue-500/20" : "bg-orange-500/20"
                          )}
                        >
                          <Shield
                            className={cn(
                              "h-4 w-4",
                              isDefense ? "text-blue-400" : "text-orange-400"
                            )}
                          />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-sm text-[#e8e0d5]">{target.name}</div>
                          <div className="text-xs text-[#a89f94]">
                            {hasKnownStats
                              ? isDefense
                                ? `🛡️ ${target.defense} DEF`
                                : `⚔️ ${target.attack} ATK`
                              : "❓ Hidden"}
                          </div>
                        </div>
                        {hasKnownStats && (
                          <div className="text-xs font-bold px-2 py-1 rounded">
                            {attackerWins ? (
                              <span className="text-green-400">✓ WIN</span>
                            ) : isDraw ? (
                              <span className="text-yellow-400">= DRAW</span>
                            ) : (
                              <span className="text-red-400">✗ LOSE</span>
                            )}
                          </div>
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* Direct Attack */}
                {canDirectAttack && (
                  <>
                    {targets.length > 0 && (
                      <div className="flex items-center gap-2 my-2">
                        <div className="flex-1 h-px bg-[#3d2b1f]" />
                        <span className="text-[10px] text-[#a89f94] uppercase tracking-wider">
                          Or
                        </span>
                        <div className="flex-1 h-px bg-[#3d2b1f]" />
                      </div>
                    )}
                    <Button
                      className="w-full justify-start gap-3 h-auto py-4 bg-linear-to-r from-red-500/30 to-orange-500/30 border-2 border-red-500/60 hover:from-red-500/40 hover:to-orange-500/40 hover:border-red-500/80"
                      variant="outline"
                      onClick={() => onSelectTarget(undefined)}
                    >
                      <div className="h-8 w-8 rounded-full bg-red-500/40 flex items-center justify-center">
                        <User className="h-5 w-5 text-red-300" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-bold text-sm text-red-300 flex items-center gap-2">
                          Direct Attack
                          <span className="text-[8px] px-1.5 py-0.5 bg-red-500/80 text-white rounded-full font-semibold">
                            UNBLOCKED
                          </span>
                        </div>
                        <div className="text-xs text-red-200/80 font-medium">
                          💥 Deal {attacker.attack} damage directly to opponent
                        </div>
                      </div>
                    </Button>
                  </>
                )}

                {/* No targets available */}
                {targets.length === 0 && !canDirectAttack && (
                  <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <p className="text-sm text-yellow-400 font-medium">No Valid Targets</p>
                    <p className="text-xs text-[#a89f94] mt-1">
                      There are no monsters to attack. Try a different action.
                    </p>
                  </div>
                )}

                {/* Cancel */}
                <Button
                  className="w-full mt-3 bg-[#3d2b1f] hover:bg-[#4d3b2f] text-[#e8e0d5] font-medium"
                  onClick={onClose}
                >
                  Cancel Attack
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
