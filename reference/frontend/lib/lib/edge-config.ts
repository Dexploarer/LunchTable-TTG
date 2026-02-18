/**
 * Vercel Edge Config Utilities
 *
 * Edge Config provides ultra-fast, globally distributed configuration
 * that can be read at the edge with sub-millisecond latency.
 *
 * Use cases:
 * - Feature flags
 * - A/B testing configurations
 * - Maintenance mode toggles
 * - Rate limiting rules
 * - Redirect rules
 * - Blocked user lists
 */

import { type EdgeConfigItems, get, getAll, has } from "@vercel/edge-config";

// =============================================================================
// Types
// =============================================================================

/**
 * Feature flags configuration
 */
export interface FeatureFlags {
  /** Enable maintenance mode across the app */
  maintenanceMode?: boolean;
  /** Message to show during maintenance */
  maintenanceMessage?: string;
  /** Enable new pack opening animation */
  newPackAnimation?: boolean;
  /** Enable story mode */
  storyModeEnabled?: boolean;
  /** Enable marketplace */
  marketplaceEnabled?: boolean;
  /** Enable ranked matches */
  rankedEnabled?: boolean;
  /** Enable AI opponents */
  aiOpponentsEnabled?: boolean;
  /** Maximum concurrent games per user */
  maxConcurrentGames?: number;
}

/**
 * Rate limiting configuration
 */
export interface RateLimits {
  /** API requests per minute */
  apiRequestsPerMinute?: number;
  /** Pack opens per hour */
  packOpensPerHour?: number;
  /** Marketplace listings per day */
  listingsPerDay?: number;
}

/**
 * Game configuration
 */
export interface GameConfig {
  /** Default starting gold for new players */
  startingGold?: number;
  /** Default starting gems for new players */
  startingGems?: number;
  /** XP multiplier for events */
  xpMultiplier?: number;
  /** Gold multiplier for events */
  goldMultiplier?: number;
}

// =============================================================================
// Edge Config Keys
// =============================================================================

export const CONFIG_KEYS = {
  FEATURE_FLAGS: "featureFlags",
  RATE_LIMITS: "rateLimits",
  GAME_CONFIG: "gameConfig",
  BLOCKED_USERS: "blockedUsers",
  ANNOUNCEMENT: "announcement",
} as const;

// =============================================================================
// Getters
// =============================================================================

/**
 * Get feature flags from Edge Config
 * Returns defaults if not configured
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  try {
    const flags = await get<FeatureFlags>(CONFIG_KEYS.FEATURE_FLAGS);
    return {
      maintenanceMode: false,
      storyModeEnabled: true,
      marketplaceEnabled: true,
      rankedEnabled: true,
      aiOpponentsEnabled: true,
      maxConcurrentGames: 3,
      ...flags,
    };
  } catch {
    // Return defaults if Edge Config is not available
    return {
      maintenanceMode: false,
      storyModeEnabled: true,
      marketplaceEnabled: true,
      rankedEnabled: true,
      aiOpponentsEnabled: true,
      maxConcurrentGames: 3,
    };
  }
}

/**
 * Get rate limits from Edge Config
 */
export async function getRateLimits(): Promise<RateLimits> {
  try {
    const limits = await get<RateLimits>(CONFIG_KEYS.RATE_LIMITS);
    return {
      apiRequestsPerMinute: 60,
      packOpensPerHour: 100,
      listingsPerDay: 50,
      ...limits,
    };
  } catch {
    return {
      apiRequestsPerMinute: 60,
      packOpensPerHour: 100,
      listingsPerDay: 50,
    };
  }
}

/**
 * Get game configuration from Edge Config
 */
export async function getGameConfig(): Promise<GameConfig> {
  try {
    const config = await get<GameConfig>(CONFIG_KEYS.GAME_CONFIG);
    return {
      startingGold: 1000,
      startingGems: 100,
      xpMultiplier: 1,
      goldMultiplier: 1,
      ...config,
    };
  } catch {
    return {
      startingGold: 1000,
      startingGems: 100,
      xpMultiplier: 1,
      goldMultiplier: 1,
    };
  }
}

/**
 * Get list of blocked user IDs
 */
export async function getBlockedUsers(): Promise<string[]> {
  try {
    const blocked = await get<string[]>(CONFIG_KEYS.BLOCKED_USERS);
    return blocked || [];
  } catch {
    return [];
  }
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(userId: string): Promise<boolean> {
  try {
    const blocked = await getBlockedUsers();
    return blocked.includes(userId);
  } catch {
    return false;
  }
}

/**
 * Get announcement message (for banners, etc.)
 */
export async function getAnnouncement(): Promise<string | null> {
  try {
    const announcement = await get<string>(CONFIG_KEYS.ANNOUNCEMENT);
    return announcement ?? null;
  } catch {
    return null;
  }
}

/**
 * Check if a specific config key exists
 */
export async function hasConfig(key: string): Promise<boolean> {
  try {
    return await has(key);
  } catch {
    return false;
  }
}

/**
 * Get all Edge Config values
 */
export async function getAllConfig(): Promise<EdgeConfigItems> {
  try {
    return await getAll();
  } catch {
    return {};
  }
}

/**
 * Get a specific config value by key
 */
export async function getConfig<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key);
  } catch {
    return undefined;
  }
}
