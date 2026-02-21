"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback } from "react";

/**
 * Bridges Privy authentication to Convex.
 * Returns the interface expected by ConvexProviderWithAuth.
 *
 * This hook provides:
 * - isLoading: true while Privy is initializing
 * - isAuthenticated: true when user is logged in with Privy
 * - fetchAccessToken: function to get the Privy JWT for Convex
 */
export function usePrivyAuthForConvex() {
  const { ready, authenticated, getAccessToken } = usePrivy();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken: _forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!authenticated) {
        return null;
      }

      try {
        return await getAccessToken();
      } catch {
        return null;
      }
    },
    [getAccessToken, authenticated]
  );

  return {
    isLoading: !ready,
    isAuthenticated: authenticated,
    fetchAccessToken,
  };
}
