import type { CardDefinition } from "../../types/index.js";

/**
 * Example card set for white-label reference.
 * Demonstrates all card types, effects, and metadata fields.
 */
export const EXAMPLE_CARDS: CardDefinition[] = [
  // Stereotype (monster) — basic attacker
  {
    id: "dropout-brawler",
    name: "Dropout Brawler",
    type: "stereotype",
    description: "A reckless fighter who dropped out to pursue street brawling.",
    rarity: "common",
    attack: 1800,
    defense: 800,
    level: 4,
    attribute: "fire",
    archetype: "dropout",
    viceType: "rage",
    flavorText: "Fists first, questions never.",
    cost: 1,
  },
  // Stereotype — high level, needs tribute
  {
    id: "prep-valedictorian",
    name: "Prep Valedictorian",
    type: "stereotype",
    description: "The overachieving prep who dominates every field.",
    rarity: "epic",
    attack: 2500,
    defense: 2000,
    level: 7,
    attribute: "water",
    archetype: "prep",
    flavorText: "4.0 GPA, zero chill.",
    cost: 2,
    effects: [
      {
        id: "val-draw",
        type: "on_summon",
        description: "Draw 1 card when summoned",
        actions: [{ type: "draw", count: 1 }],
      },
    ],
  },
  // Spell — normal (one-shot)
  {
    id: "cram-session",
    name: "Cram Session",
    type: "spell",
    description: "Draw 2 cards.",
    rarity: "rare",
    spellType: "normal",
    cost: 1,
    effects: [
      {
        id: "cram-draw",
        type: "ignition",
        description: "Draw 2 cards",
        actions: [{ type: "draw", count: 2 }],
      },
    ],
  },
  // Spell — field (class)
  {
    id: "study-hall",
    name: "Study Hall",
    type: "spell",
    description: "All Geek stereotypes gain 300 ATK.",
    rarity: "uncommon",
    spellType: "field",
    archetype: "geek",
    cost: 1,
    effects: [
      {
        id: "study-boost",
        type: "continuous",
        description: "Geek stereotypes gain 300 ATK",
        actions: [{ type: "boost_attack", amount: 300, duration: "permanent" }],
      },
    ],
  },
  // Trap — normal
  {
    id: "pop-quiz",
    name: "Pop Quiz",
    type: "trap",
    description: "Destroy 1 attacking stereotype.",
    rarity: "uncommon",
    trapType: "normal",
    cost: 1,
    effects: [
      {
        id: "quiz-destroy",
        type: "trigger",
        description: "Destroy 1 attacking stereotype",
        actions: [{ type: "destroy", target: "selected" }],
      },
    ],
  },
  // Trap — continuous
  {
    id: "detention",
    name: "Detention",
    type: "trap",
    description: "Opponent's stereotypes lose 500 ATK while this card is face-up.",
    rarity: "rare",
    trapType: "continuous",
    cost: 2,
    effects: [
      {
        id: "detention-debuff",
        type: "continuous",
        description: "Opponent stereotypes lose 500 ATK",
        actions: [{ type: "boost_attack", amount: -500, duration: "permanent" }],
      },
    ],
  },
];
