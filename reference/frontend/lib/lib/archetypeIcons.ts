/**
 * Archetype Icon Mappings
 *
 * Maps archetype identifiers to their brand icon assets.
 * Icons are located in /public/brand/icons/archetypes/
 */

export type ArchetypeId = "dropout" | "prep" | "geek" | "freak" | "nerd" | "goodie_two_shoes";

/**
 * Get the icon path for a given archetype
 * @param archetype - The archetype identifier
 * @returns Path to the archetype icon, or a fallback icon if not found
 */
export function getArchetypeIcon(archetype: string): string {
  // Normalize archetype name
  const normalizedArchetype = archetype.toLowerCase().replace(/\s+/g, "_");

  // Available archetype icons
  const availableIcons: Set<string> = new Set([
    "dropout",
    "prep",
    "geek",
    "freak",
    "nerd",
    "goodie_two_shoes",
  ]);

  if (availableIcons.has(normalizedArchetype)) {
    return `/brand/icons/archetypes/${normalizedArchetype}.png`;
  }

  // Fallback to freak for unknown archetypes (purple/chaos)
  return "/brand/icons/archetypes/freak.png";
}

/**
 * Get all available archetype icons
 * @returns Array of archetype identifiers and their icon paths
 */
export function getAllArchetypeIcons(): Array<{ id: string; path: string; name: string }> {
  const archetypes = [
    { id: "dropout", name: "Dropout" },
    { id: "prep", name: "Prep" },
    { id: "geek", name: "Geek" },
    { id: "freak", name: "Freak" },
    { id: "nerd", name: "Nerd" },
    { id: "goodie_two_shoes", name: "Goodie Two-Shoes" },
  ];

  return archetypes.map((archetype) => ({
    ...archetype,
    path: `/brand/icons/archetypes/${archetype.id}.png`,
  }));
}

/**
 * Format archetype name for display
 * @param archetype - The archetype identifier
 * @returns Human-readable archetype name
 */
export function formatArchetypeName(archetype: string): string {
  return archetype
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
