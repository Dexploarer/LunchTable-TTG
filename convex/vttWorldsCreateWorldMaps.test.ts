import { describe, expect, it } from "vitest";
import { buildWorldVersionSnapshot } from "./vttWorlds";

describe("vttWorlds snapshot builder", () => {
  it("includes provided maps in order", () => {
    const json = buildWorldVersionSnapshot({
      name: "Test World",
      tagline: "Tagline",
      genre: "Genre",
      mood: "Mood",
      rules: null,
      maps: [
        {
          name: "Map A",
          biome: "Biome A",
          camera: "topdown",
          lightingPreset: "day",
          ambience: ["wind"],
          objectives: ["Find clue"],
        },
        {
          name: "Map B",
          biome: "Biome B",
          camera: "isometric",
          lightingPreset: "night",
          ambience: ["rain"],
          objectives: ["Escape"],
        },
      ],
    });

    const parsed = JSON.parse(json) as { maps: Array<{ name: string; biome: string }> };
    expect(parsed.maps.map((map) => map.name)).toEqual(["Map A", "Map B"]);
    expect(parsed.maps.map((map) => map.biome)).toEqual(["Biome A", "Biome B"]);
  });

  it("supports default map snapshots", () => {
    const json = buildWorldVersionSnapshot({
      name: "Default World",
      tagline: "Tagline",
      genre: "Genre",
      mood: "Mood",
      rules: null,
    });

    const parsed = JSON.parse(json) as { maps: Array<{ name: string }> };
    expect(parsed.maps[0]?.name).toBe("Scene 1");
  });
});
