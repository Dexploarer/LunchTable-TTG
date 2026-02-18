/**
 * Feature Flags Configuration
 *
 * This module provides feature flag functionality using a hybrid approach:
 * 1. Hypertune - Type-safe feature flags with visual dashboard (when configured)
 * 2. Edge Config - Fallback for simple feature flags and runtime config
 *
 * Hypertune Setup:
 * 1. Create flags in the Hypertune dashboard (https://app.hypertune.com)
 * 2. Run `npx hypertune` to generate types in the `generated/` directory
 * 3. Update this file to use the generated types
 *
 * Until Hypertune flags are configured, we use Edge Config as the primary source.
 */

import "server-only";
import { type FeatureFlags, getFeatureFlags } from "./edge-config";

// =============================================================================
// Feature Flag Types
// =============================================================================

/**
 * All feature flags available in the application
 * These map to Edge Config featureFlags and will be synced with Hypertune
 */
export interface AppFeatureFlags {
  /** Enable maintenance mode across the app */
  maintenanceMode: boolean;
  /** Enable story mode gameplay */
  storyModeEnabled: boolean;
  /** Enable marketplace/trading features */
  marketplaceEnabled: boolean;
  /** Enable ranked matches */
  rankedEnabled: boolean;
  /** Enable AI opponents */
  aiOpponentsEnabled: boolean;
  /** Maximum concurrent games per user */
  maxConcurrentGames: number;
  /** Enable new pack opening animation */
  newPackAnimation: boolean;
}

/**
 * Default values for all flags
 */
export const FLAG_DEFAULTS: AppFeatureFlags = {
  maintenanceMode: false,
  storyModeEnabled: true,
  marketplaceEnabled: true,
  rankedEnabled: true,
  aiOpponentsEnabled: true,
  maxConcurrentGames: 3,
  newPackAnimation: false,
};

// =============================================================================
// Flag Getters (Server-side)
// =============================================================================

/**
 * Get all feature flags (server-side only)
 * Uses Edge Config with Hypertune sync when available
 */
export async function getFlags(): Promise<AppFeatureFlags> {
  try {
    const edgeFlags = await getFeatureFlags();
    return {
      maintenanceMode: edgeFlags.maintenanceMode ?? FLAG_DEFAULTS.maintenanceMode,
      storyModeEnabled: edgeFlags.storyModeEnabled ?? FLAG_DEFAULTS.storyModeEnabled,
      marketplaceEnabled: edgeFlags.marketplaceEnabled ?? FLAG_DEFAULTS.marketplaceEnabled,
      rankedEnabled: edgeFlags.rankedEnabled ?? FLAG_DEFAULTS.rankedEnabled,
      aiOpponentsEnabled: edgeFlags.aiOpponentsEnabled ?? FLAG_DEFAULTS.aiOpponentsEnabled,
      maxConcurrentGames: edgeFlags.maxConcurrentGames ?? FLAG_DEFAULTS.maxConcurrentGames,
      newPackAnimation: edgeFlags.newPackAnimation ?? FLAG_DEFAULTS.newPackAnimation,
    };
  } catch {
    return FLAG_DEFAULTS;
  }
}

/**
 * Get a single feature flag value (server-side only)
 */
export async function getFlag<K extends keyof AppFeatureFlags>(
  key: K
): Promise<AppFeatureFlags[K]> {
  const flags = await getFlags();
  return flags[key];
}

// =============================================================================
// Hypertune Integration (placeholder)
// =============================================================================

/**
 * HYPERTUNE SETUP INSTRUCTIONS:
 *
 * Once you have created flags in the Hypertune dashboard:
 *
 * 1. Run: npx hypertune
 *    This generates type-safe code in the `generated/` directory
 *
 * 2. Import the generated code:
 *    import { createSource, flagDefinitions, flagFallbacks } from "@/generated/hypertune";
 *
 * 3. Create the Hypertune adapter:
 *    import { createHypertuneAdapter } from "@flags-sdk/hypertune";
 *    import { createEdgeConfigClient } from "@vercel/edge-config";
 *
 *    const edgeConfigClient = createEdgeConfigClient(process.env.EDGE_CONFIG);
 *
 *    export const hypertuneAdapter = createHypertuneAdapter({
 *      createSource,
 *      flagDefinitions,
 *      flagFallbacks,
 *      identify: async () => ({
 *        context: {
 *          environment: process.env.NODE_ENV,
 *        },
 *      }),
 *      edgeConfigClient,
 *      edgeConfigItemKey: process.env.EXPERIMENTATION_CONFIG_ITEM_KEY,
 *    });
 *
 * 4. Define individual flags using the adapter:
 *    import { flag } from "flags/next";
 *
 *    export const storyModeEnabled = flag({
 *      key: "storyModeEnabled",
 *      ...hypertuneAdapter.declarations.storyModeEnabled,
 *    });
 *
 * 5. Use flags in components:
 *    const isStoryModeEnabled = await storyModeEnabled();
 */

// Export the Edge Config types for backwards compatibility
export type { FeatureFlags };
