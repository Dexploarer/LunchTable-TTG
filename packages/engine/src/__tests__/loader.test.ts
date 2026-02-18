import { describe, it, expect } from "vitest";
import { loadCardsFromJSON, loadCardsFromArray } from "../loader.js";
import sampleCards from "./fixtures/sample-cards.json";

describe("loadCardsFromArray", () => {
  it("loads and validates an array of card objects", () => {
    const lookup = loadCardsFromArray(sampleCards);
    expect(Object.keys(lookup)).toHaveLength(3);
    expect(lookup["test-warrior"]?.attack).toBe(1500);
    expect(lookup["test-spell"]?.spellType).toBe("normal");
    expect(lookup["test-trap"]?.trapType).toBe("normal");
  });

  it("rejects invalid cards in array", () => {
    expect(() =>
      loadCardsFromArray([{ id: "bad", name: "Bad", type: "stereotype", description: "", rarity: "common" }])
    ).toThrow("must have attack and defense");
  });

  it("merges multiple arrays", () => {
    const set1 = [
      { id: "a", name: "A", type: "spell" as const, description: "", rarity: "common" as const, spellType: "normal" as const },
    ];
    const set2 = [
      { id: "b", name: "B", type: "trap" as const, description: "", rarity: "common" as const, trapType: "normal" as const },
    ];
    const lookup = loadCardsFromArray([...set1, ...set2]);
    expect(Object.keys(lookup)).toHaveLength(2);
  });
});

describe("loadCardsFromJSON", () => {
  it("loads cards from a JSON string", () => {
    const json = JSON.stringify(sampleCards);
    const lookup = loadCardsFromJSON(json);
    expect(Object.keys(lookup)).toHaveLength(3);
  });

  it("throws on invalid JSON", () => {
    expect(() => loadCardsFromJSON("not json")).toThrow();
  });

  it("throws on non-array JSON", () => {
    expect(() => loadCardsFromJSON('{"id":"test"}')).toThrow("must be an array");
  });
});
