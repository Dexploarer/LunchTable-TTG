/**
 * Archetype theme definitions for visual styling
 *
 * Maps archetype identifiers to their visual properties (gradients, icons, colors).
 * These are used by story chapter cards and other UI components to provide
 * consistent archetype-based theming.
 */

export interface ArchetypeTheme {
  /** Tailwind gradient classes (e.g., "from-red-500 to-orange-500") */
  gradient: string;
  /** Emoji or icon character (fallback) */
  icon: string;
  /** Path to the archetype PNG icon */
  iconPath: string;
  /** Primary color name for Tailwind classes */
  color: string;
  /** Border/accent color class */
  borderColor: string;
  /** Glow/shadow color for effects */
  glowColor: string;
}

/**
 * Theme configurations for each archetype
 *
 * Used by StoryChapterCard and other components to derive visual styling
 * from the archetype field returned by the database.
 */
export const ARCHETYPE_THEMES: Record<string, ArchetypeTheme> = {
  // Dropout - Red aggro (rebellious, aggressive, fast)
  dropout: {
    gradient: "from-red-600 via-red-500 to-orange-500",
    icon: "🔥",
    iconPath: "/brand/icons/archetypes/dropout.png",
    color: "red",
    borderColor: "border-red-500/50",
    glowColor: "shadow-red-500/30",
  },

  // Prep - Blue midrange (popular, balanced, adaptable)
  prep: {
    gradient: "from-blue-600 via-blue-500 to-cyan-500",
    icon: "🎉",
    iconPath: "/brand/icons/archetypes/prep.png",
    color: "blue",
    borderColor: "border-blue-500/50",
    glowColor: "shadow-blue-500/30",
  },

  // Geek - Yellow combo (tech-savvy, synergy-focused)
  geek: {
    gradient: "from-yellow-600 via-yellow-500 to-amber-400",
    icon: "🧠",
    iconPath: "/brand/icons/archetypes/geek.png",
    color: "yellow",
    borderColor: "border-yellow-500/50",
    glowColor: "shadow-yellow-500/30",
  },

  // Freak - Purple chaos (unpredictable, random effects)
  freak: {
    gradient: "from-purple-600 via-purple-500 to-fuchsia-500",
    icon: "🧪",
    iconPath: "/brand/icons/archetypes/freak.png",
    color: "purple",
    borderColor: "border-purple-500/50",
    glowColor: "shadow-purple-500/30",
  },

  // Nerd - Green control (studious, defensive, calculated)
  nerd: {
    gradient: "from-green-700 via-green-500 to-emerald-400",
    icon: "📐",
    iconPath: "/brand/icons/archetypes/nerd.png",
    color: "green",
    borderColor: "border-green-500/50",
    glowColor: "shadow-green-500/30",
  },

  // Goodie Two-Shoes - White attrition (rule-following, grindy)
  goodie_two_shoes: {
    gradient: "from-gray-300 via-gray-200 to-white",
    icon: "🙏",
    iconPath: "/brand/icons/archetypes/goodie_two_shoes.png",
    color: "gray",
    borderColor: "border-gray-400/50",
    glowColor: "shadow-gray-400/30",
  },
};

/**
 * Default theme for unknown archetypes
 */
export const DEFAULT_ARCHETYPE_THEME: ArchetypeTheme = {
  gradient: "from-purple-600 via-indigo-500 to-blue-500",
  icon: "🎴",
  iconPath: "/brand/icons/archetypes/freak.png",
  color: "purple",
  borderColor: "border-purple-500/50",
  glowColor: "shadow-purple-500/30",
};

/**
 * Get the theme for a given archetype
 *
 * @param archetype - The archetype identifier (e.g., "dropout", "prep", "geek")
 * @returns The theme object with gradient, icon, color, borderColor, and glowColor
 *
 * @example
 * ```tsx
 * const theme = getArchetypeTheme(chapter.archetype);
 * <div className={`bg-gradient-to-r ${theme.gradient}`}>
 *   <span>{theme.icon}</span>
 * </div>
 * ```
 */
export function getArchetypeTheme(archetype: string | undefined): ArchetypeTheme {
  if (!archetype) return DEFAULT_ARCHETYPE_THEME;
  return ARCHETYPE_THEMES[archetype] ?? DEFAULT_ARCHETYPE_THEME;
}

/**
 * Get Tailwind text color class for an archetype
 *
 * @param archetype - The archetype identifier
 * @returns Tailwind text color class (e.g., "text-red-400")
 */
export function getArchetypeTextColor(archetype: string | undefined): string {
  const theme = getArchetypeTheme(archetype);
  return `text-${theme.color}-400`;
}

/**
 * Get Tailwind background color class for an archetype
 *
 * @param archetype - The archetype identifier
 * @returns Tailwind background color class (e.g., "bg-red-500/20")
 */
export function getArchetypeBgColor(archetype: string | undefined): string {
  const theme = getArchetypeTheme(archetype);
  return `bg-${theme.color}-500/20`;
}
