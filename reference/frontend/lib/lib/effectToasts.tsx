import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Ban,
  Heart,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export type EffectCategory =
  | "summon"
  | "destroy"
  | "damage"
  | "heal"
  | "draw"
  | "search"
  | "boost"
  | "debuff"
  | "protect"
  | "target"
  | "negate"
  | "special_summon"
  | "battle"
  | "generic";

interface EffectToastOptions {
  cardName: string;
  description: string;
  category?: EffectCategory;
  success?: boolean;
  duration?: number;
}

const CATEGORY_CONFIG: Record<
  EffectCategory,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    borderColor: string;
  }
> = {
  summon: {
    icon: Sparkles,
    color: "text-green-400",
    borderColor: "border-l-green-500",
  },
  special_summon: {
    icon: Sparkles,
    color: "text-purple-400",
    borderColor: "border-l-purple-500",
  },
  destroy: {
    icon: Trash2,
    color: "text-red-400",
    borderColor: "border-l-red-500",
  },
  damage: {
    icon: Zap,
    color: "text-orange-400",
    borderColor: "border-l-orange-500",
  },
  heal: {
    icon: Heart,
    color: "text-pink-400",
    borderColor: "border-l-pink-500",
  },
  draw: {
    icon: Sparkles,
    color: "text-blue-400",
    borderColor: "border-l-blue-500",
  },
  search: {
    icon: Target,
    color: "text-cyan-400",
    borderColor: "border-l-cyan-500",
  },
  boost: {
    icon: ArrowUp,
    color: "text-green-400",
    borderColor: "border-l-green-500",
  },
  debuff: {
    icon: ArrowDown,
    color: "text-red-400",
    borderColor: "border-l-red-500",
  },
  protect: {
    icon: Shield,
    color: "text-amber-400",
    borderColor: "border-l-amber-500",
  },
  target: {
    icon: Target,
    color: "text-purple-400",
    borderColor: "border-l-purple-500",
  },
  negate: {
    icon: Ban,
    color: "text-red-400",
    borderColor: "border-l-red-500",
  },
  battle: {
    icon: Swords,
    color: "text-orange-400",
    borderColor: "border-l-orange-500",
  },
  generic: {
    icon: Sparkles,
    color: "text-purple-400",
    borderColor: "border-l-purple-500",
  },
};

export function showEffectToast({
  cardName,
  description,
  category = "generic",
  success = true,
  duration = 3000,
}: EffectToastOptions) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  if (success) {
    toast(cardName, {
      description,
      icon: <Icon className={`h-4 w-4 ${config.color}`} />,
      duration,
      className: `border-l-4 ${config.borderColor}`,
    });
  } else {
    toast.error(cardName, {
      description,
      icon: <AlertTriangle className="h-4 w-4" />,
      duration,
    });
  }
}

export function showEffectActivated(cardName: string, effectDescription: string) {
  showEffectToast({
    cardName: `${cardName} activated!`,
    description: effectDescription,
    category: "generic",
  });
}

export function showEffectResolved(
  cardName: string,
  effectDescription: string,
  category?: EffectCategory
) {
  showEffectToast({
    cardName: `${cardName} resolved`,
    description: effectDescription,
    category,
  });
}

export function showCardDestroyed(cardName: string, byBattle = false) {
  showEffectToast({
    cardName: `${cardName} destroyed!`,
    description: byBattle ? "Destroyed by battle" : "Destroyed by card effect",
    category: "destroy",
  });
}

export function showDamageDealt(targetName: string, damage: number) {
  showEffectToast({
    cardName: "Damage Dealt",
    description: `${targetName} took ${damage} damage`,
    category: "damage",
  });
}

export function showCardSummoned(cardName: string, isSpecial = false) {
  showEffectToast({
    cardName: `${cardName} summoned!`,
    description: isSpecial ? "Special Summoned" : "Normal Summoned",
    category: isSpecial ? "special_summon" : "summon",
  });
}

export function showCardDrawn(count: number) {
  showEffectToast({
    cardName: "Card Draw",
    description: `Drew ${count} card${count !== 1 ? "s" : ""}`,
    category: "draw",
  });
}

export function showCardSearched(cardName: string, location: string) {
  showEffectToast({
    cardName: "Card Search",
    description: `Added ${cardName} from ${location} to hand`,
    category: "search",
  });
}

export function showStatBoost(cardName: string, stat: "ATK" | "DEF", change: number) {
  const isBoost = change > 0;
  showEffectToast({
    cardName: `${cardName}`,
    description: `${stat} ${isBoost ? "increased" : "decreased"} by ${Math.abs(change)}`,
    category: isBoost ? "boost" : "debuff",
  });
}

export function showProtectionApplied(cardName: string, protectionType: string) {
  showEffectToast({
    cardName: `${cardName} protected`,
    description: protectionType,
    category: "protect",
  });
}

export function showEffectNegated(cardName: string) {
  showEffectToast({
    cardName: "Effect Negated",
    description: `${cardName}'s effect was negated`,
    category: "negate",
  });
}

// Auto-categorize based on effect description
export function categorizeEffect(effectDescription: string): EffectCategory {
  const desc = effectDescription.toLowerCase();

  if (desc.includes("summon") && desc.includes("special")) return "special_summon";
  if (desc.includes("summon")) return "summon";
  if (desc.includes("destroy")) return "destroy";
  if (desc.includes("damage") || desc.includes("lose")) return "damage";
  if (desc.includes("heal") || (desc.includes("gain") && desc.includes("lp"))) return "heal";
  if (desc.includes("draw")) return "draw";
  if (desc.includes("search") || (desc.includes("add") && desc.includes("hand"))) return "search";
  if (
    desc.includes("increase") ||
    (desc.includes("gain") && (desc.includes("atk") || desc.includes("def")))
  )
    return "boost";
  if (
    desc.includes("decrease") ||
    (desc.includes("lose") && (desc.includes("atk") || desc.includes("def")))
  )
    return "debuff";
  if (
    desc.includes("cannot be destroyed") ||
    desc.includes("cannot be targeted") ||
    desc.includes("protect")
  )
    return "protect";
  if (desc.includes("target")) return "target";
  if (desc.includes("negate")) return "negate";
  if (desc.includes("attack") || desc.includes("battle")) return "battle";

  return "generic";
}
