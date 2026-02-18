"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Shield, Sparkles, Sword, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export interface FloatingNumberProps {
  value: number;
  type: "attack" | "defense" | "damage" | "heal" | "draw" | "generic";
  position: { x: number; y: number };
  id: string;
}

export interface EffectAnimation {
  id: string;
  cardId: string;
  type: "glow" | "flash" | "pulse" | "shake" | "highlight";
  color: "green" | "red" | "blue" | "purple" | "gold" | "white";
  duration?: number;
}

interface EffectFeedbackProps {
  floatingNumbers?: FloatingNumberProps[];
  animations?: EffectAnimation[];
}

export function EffectFeedback({ floatingNumbers = [], animations = [] }: EffectFeedbackProps) {
  return (
    <>
      <FloatingNumbers numbers={floatingNumbers} />
      <AnimationOverlay animations={animations} />
    </>
  );
}

function FloatingNumbers({ numbers }: { numbers: FloatingNumberProps[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {numbers.map((num) => (
          <FloatingNumber key={num.id} {...num} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function FloatingNumber({ value, type, position }: FloatingNumberProps) {
  const isPositive = value > 0;
  const displayValue = Math.abs(value);

  const colors = {
    attack: isPositive ? "text-red-400" : "text-gray-400",
    defense: isPositive ? "text-blue-400" : "text-gray-400",
    damage: "text-red-500",
    heal: "text-green-400",
    draw: "text-purple-400",
    generic: "text-yellow-400",
  };

  const icons = {
    attack: Sword,
    defense: Shield,
    damage: Zap,
    heal: Sparkles,
    draw: Sparkles,
    generic: Sparkles,
  };

  const Icon = icons[type];
  const color = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, x: position.x, y: position.y }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.8],
        y: position.y - 60,
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="absolute flex items-center gap-1"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full bg-black/80 border-2 ${color} font-bold text-sm shadow-lg`}
      >
        {type !== "generic" && (
          <>
            {isPositive && type !== "damage" && <ArrowUp className="w-4 h-4" />}
            {!isPositive && type !== "damage" && type !== "heal" && (
              <ArrowDown className="w-4 h-4" />
            )}
          </>
        )}
        <Icon className="w-4 h-4" />
        <span>
          {isPositive && type !== "damage" ? "+" : ""}
          {displayValue}
        </span>
      </div>
    </motion.div>
  );
}

function AnimationOverlay({ animations }: { animations: EffectAnimation[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <AnimatePresence>
        {animations.map((anim) => (
          <CardAnimationEffect key={anim.id} {...anim} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function CardAnimationEffect({ cardId, type, color, duration = 1000 }: EffectAnimation) {
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement;
    setElement(el);
  }, [cardId]);

  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const position = {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };

  const colorClasses = {
    green: "bg-green-500/30 border-green-400 shadow-green-500/50",
    red: "bg-red-500/30 border-red-400 shadow-red-500/50",
    blue: "bg-blue-500/30 border-blue-400 shadow-blue-500/50",
    purple: "bg-purple-500/30 border-purple-400 shadow-purple-500/50",
    gold: "bg-yellow-500/30 border-yellow-400 shadow-yellow-500/50",
    white: "bg-white/30 border-white shadow-white/50",
  };

  const animations = {
    glow: {
      initial: { opacity: 0, scale: 1 },
      animate: {
        opacity: [0, 0.8, 0],
        scale: [1, 1.05, 1],
      },
    },
    flash: {
      initial: { opacity: 0 },
      animate: {
        opacity: [0, 1, 0, 1, 0],
      },
    },
    pulse: {
      initial: { opacity: 0, scale: 1 },
      animate: {
        opacity: [0, 0.6, 0],
        scale: [1, 1.1, 1],
      },
    },
    shake: {
      initial: { x: 0 },
      animate: {
        x: [0, -5, 5, -5, 5, 0],
      },
    },
    highlight: {
      initial: { opacity: 0, scale: 1 },
      animate: {
        opacity: [0, 1, 0.5, 0],
        scale: [1, 1.15, 1.05, 1],
      },
    },
  };

  const anim = animations[type];

  return (
    <motion.div
      initial={anim.initial}
      animate={anim.animate}
      exit={{ opacity: 0 }}
      transition={{ duration: duration / 1000, ease: "easeInOut" }}
      className={`absolute rounded-md border-2 ${colorClasses[color]} shadow-lg pointer-events-none`}
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        height: position.height,
      }}
    />
  );
}

// Hook to manage effect feedback state
export function useEffectFeedback() {
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumberProps[]>([]);
  const [animations, setAnimations] = useState<EffectAnimation[]>([]);

  const addFloatingNumber = (
    value: number,
    type: FloatingNumberProps["type"],
    position: { x: number; y: number }
  ) => {
    const id = `floating-${Date.now()}-${Math.random()}`;
    setFloatingNumbers((prev) => [...prev, { id, value, type, position }]);

    setTimeout(() => {
      setFloatingNumbers((prev) => prev.filter((n) => n.id !== id));
    }, 1500);
  };

  const addAnimation = (
    cardId: string,
    type: EffectAnimation["type"],
    color: EffectAnimation["color"],
    duration?: number
  ) => {
    const id = `anim-${Date.now()}-${Math.random()}`;
    setAnimations((prev) => [...prev, { id, cardId, type, color, duration }]);

    setTimeout(() => {
      setAnimations((prev) => prev.filter((a) => a.id !== id));
    }, duration || 1000);
  };

  const showStatChange = (
    cardId: string,
    statType: "attack" | "defense",
    change: number,
    element: HTMLElement
  ) => {
    const rect = element.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    addFloatingNumber(change, statType, position);
    addAnimation(cardId, "glow", change > 0 ? "green" : "red");
  };

  const showDamage = (cardId: string, damage: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    addFloatingNumber(damage, "damage", position);
    addAnimation(cardId, "shake", "red", 500);
  };

  const showHeal = (_playerId: string, amount: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    addFloatingNumber(amount, "heal", position);
  };

  const showCardTargeted = (cardId: string) => {
    addAnimation(cardId, "highlight", "purple", 800);
  };

  const showCardActivated = (cardId: string) => {
    addAnimation(cardId, "flash", "gold", 600);
  };

  return {
    floatingNumbers,
    animations,
    showStatChange,
    showDamage,
    showHeal,
    showCardTargeted,
    showCardActivated,
  };
}
