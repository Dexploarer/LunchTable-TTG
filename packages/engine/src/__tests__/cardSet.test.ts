import { describe, it, expect } from "vitest";
import { defineCardSet, mergeCardSets } from "../cardSet.js";

describe("defineCardSet", () => {
  it("creates a card set with metadata", () => {
    const set = defineCardSet({
      id: "core",
      name: "Core Set",
      cards: [
        {
          id: "warrior-1",
          name: "Warrior",
          type: "stereotype",
          description: "A warrior",
          rarity: "common",
          attack: 1500,
          defense: 1200,
          level: 4,
        },
      ],
    });
    expect(set.id).toBe("core");
    expect(set.name).toBe("Core Set");
    expect(set.cardCount).toBe(1);
    expect(set.lookup["warrior-1"]?.name).toBe("Warrior");
  });

  it("validates all cards in the set", () => {
    expect(() =>
      defineCardSet({
        id: "bad",
        name: "Bad Set",
        cards: [
          { id: "x", name: "X", type: "stereotype", description: "", rarity: "common" },
        ],
      })
    ).toThrow("must have attack and defense");
  });
});

describe("mergeCardSets", () => {
  it("merges multiple sets into one lookup", () => {
    const set1 = defineCardSet({
      id: "core",
      name: "Core",
      cards: [
        { id: "a", name: "A", type: "spell", description: "", rarity: "common", spellType: "normal" },
      ],
    });
    const set2 = defineCardSet({
      id: "exp1",
      name: "Expansion 1",
      cards: [
        { id: "b", name: "B", type: "trap", description: "", rarity: "common", trapType: "normal" },
      ],
    });
    const merged = mergeCardSets([set1, set2]);
    expect(Object.keys(merged)).toHaveLength(2);
    expect(merged["a"]).toBeDefined();
    expect(merged["b"]).toBeDefined();
  });

  it("rejects sets with duplicate card IDs", () => {
    const set1 = defineCardSet({
      id: "core",
      name: "Core",
      cards: [
        { id: "a", name: "A", type: "spell", description: "", rarity: "common", spellType: "normal" },
      ],
    });
    const set2 = defineCardSet({
      id: "exp1",
      name: "Expansion 1",
      cards: [
        { id: "a", name: "A Copy", type: "spell", description: "", rarity: "common", spellType: "normal" },
      ],
    });
    expect(() => mergeCardSets([set1, set2])).toThrow('Duplicate card ID "a"');
  });
});
