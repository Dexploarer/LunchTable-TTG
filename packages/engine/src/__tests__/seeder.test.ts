import { describe, it, expect } from "vitest";
import { toConvexCardRows } from "../seeder.js";
import type { CardDefinition } from "../types/index.js";

describe("toConvexCardRows", () => {
  it("maps a stereotype to Convex row format", () => {
    const card: CardDefinition = {
      id: "warrior-1",
      name: "Test Warrior",
      type: "stereotype",
      description: "A test card",
      rarity: "common",
      attack: 1500,
      defense: 1200,
      level: 4,
      attribute: "fire",
      archetype: "dropout",
      viceType: "gambling",
      flavorText: "Flavor",
      cost: 1,
    };
    const rows = toConvexCardRows([card]);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.name).toBe("Test Warrior");
    expect(row.cardType).toBe("stereotype");
    expect(row.rarity).toBe("common");
    expect(row.attack).toBe(1500);
    expect(row.defense).toBe(1200);
    expect(row.level).toBe(4);
    expect(row.attribute).toBe("fire");
    expect(row.archetype).toBe("dropout");
    expect(row.viceType).toBe("gambling");
    expect(row.flavorText).toBe("Flavor");
    expect(row.cost).toBe(1);
    expect(row.isActive).toBe(true);
    expect(typeof row.createdAt).toBe("number");
  });

  it("maps a spell to Convex row format", () => {
    const card: CardDefinition = {
      id: "spell-1",
      name: "Test Spell",
      type: "spell",
      description: "A test spell",
      rarity: "rare",
      spellType: "continuous",
      cost: 2,
    };
    const rows = toConvexCardRows([card]);
    const row = rows[0]!;
    expect(row.cardType).toBe("spell");
    expect(row.spellType).toBe("continuous");
    expect(row.attack).toBeUndefined();
    expect(row.cost).toBe(2);
  });

  it("includes effects as ability JSON", () => {
    const card: CardDefinition = {
      id: "effect-card",
      name: "Effect Card",
      type: "spell",
      description: "Has effects",
      rarity: "common",
      spellType: "normal",
      effects: [
        {
          id: "eff1",
          type: "ignition",
          description: "Draw 2",
          actions: [{ type: "draw", count: 2 }],
        },
      ],
    };
    const rows = toConvexCardRows([card]);
    expect(rows[0]!.ability).toEqual(card.effects);
  });
});
