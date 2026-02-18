"use client";

import type { AppFeatureFlags } from "@/lib/flags";
import { useCallback, useEffect, useState } from "react";

/**
 * Default flag values (matches server-side defaults)
 */
const DEFAULT_FLAGS: AppFeatureFlags = {
  maintenanceMode: false,
  storyModeEnabled: true,
  marketplaceEnabled: true,
  rankedEnabled: true,
  aiOpponentsEnabled: true,
  maxConcurrentGames: 3,
  newPackAnimation: false,
};

/**
 * Cache for feature flags to avoid redundant fetches
 */
let flagsCache: AppFeatureFlags | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 60 seconds

/**
 * Hook to access feature flags on the client side
 *
 * @returns Feature flags object with loading state
 *
 * @example
 * ```tsx
 * function StoryModeButton() {
 *   const { flags, isLoading } = useFeatureFlags();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!flags.storyModeEnabled) return null;
 *
 *   return <Button>Play Story Mode</Button>;
 * }
 * ```
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<AppFeatureFlags>(flagsCache ?? DEFAULT_FLAGS);
  const [isLoading, setIsLoading] = useState(!flagsCache);
  const [error, setError] = useState<Error | null>(null);

  const fetchFlags = useCallback(async () => {
    // Use cache if still valid
    const now = Date.now();
    if (flagsCache && now - cacheTimestamp < CACHE_TTL) {
      setFlags(flagsCache);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/flags");

      if (!response.ok) {
        throw new Error(`Failed to fetch flags: ${response.status}`);
      }

      const data = await response.json();

      // Update cache
      flagsCache = data;
      cacheTimestamp = now;

      setFlags(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch feature flags:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      // Keep using cached or default values
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return {
    flags,
    isLoading,
    error,
    refetch: fetchFlags,
  };
}

/**
 * Hook to check a single feature flag
 *
 * @param flagKey - The flag to check
 * @returns The flag value and loading state
 *
 * @example
 * ```tsx
 * function MarketplaceTab() {
 *   const { enabled, isLoading } = useFeatureFlag("marketplaceEnabled");
 *
 *   if (!enabled) return null;
 *   return <MarketplaceContent />;
 * }
 * ```
 */
export function useFeatureFlag<K extends keyof AppFeatureFlags>(flagKey: K) {
  const { flags, isLoading, error } = useFeatureFlags();

  return {
    enabled: flags[flagKey],
    value: flags[flagKey],
    isLoading,
    error,
  };
}

/**
 * Type-safe access to individual flag values
 */
export type { AppFeatureFlags };
