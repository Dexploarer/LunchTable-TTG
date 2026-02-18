import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useMemo } from "react";
import * as Sentry from "@sentry/react";
import { useIframeMode } from "@/hooks/useIframeMode";

/**
 * Bridges authentication to Convex.
 * Returns the interface expected by ConvexProviderWithAuth.
 *
 * Three auth paths:
 * 1. Iframe + JWT — host sends Privy JWT via postMessage → full Convex auth
 * 2. Iframe + API key — host sends ltcg_ key → spectator mode (no Convex auth)
 * 3. Browser — user logs in via Privy, SDK provides JWT
 *
 * When an ltcg_ API key is received, we skip Convex auth entirely.
 * The spectator components use the HTTP API directly instead.
 */
export function usePrivyAuthForConvex() {
  const { isEmbedded, authToken: iframeToken, isJwt, isApiKey } = useIframeMode();
  const { ready, authenticated, getAccessToken } = usePrivy();

  // Iframe + JWT → full Convex real-time auth
  const hasIframeJwtAuth = isEmbedded && isJwt;

  // Iframe + API key → spectator mode, skip Convex auth
  // The app still mounts with ConvexProviderWithAuth but won't be authenticated.
  // Spectator components use useAgentSpectator (HTTP polling) instead.
  const isSpectatorMode = isEmbedded && isApiKey;

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken: _ }: { forceRefreshToken: boolean }) => {
      // Spectator mode: no Convex auth needed
      if (isSpectatorMode) return null;

      // Iframe + JWT: use host-provided token directly
      if (hasIframeJwtAuth) return iframeToken;

      // Browser mode: get token from Privy
      if (!authenticated) return null;
      try {
        return await getAccessToken();
      } catch (err) {
        Sentry.captureException(err);
        return null;
      }
    },
    [isSpectatorMode, hasIframeJwtAuth, iframeToken, getAccessToken, authenticated],
  );

  return useMemo(
    () => ({
      isLoading: hasIframeJwtAuth || isSpectatorMode ? false : !ready,
      isAuthenticated: hasIframeJwtAuth ? true : isSpectatorMode ? false : authenticated,
      fetchAccessToken,
    }),
    [hasIframeJwtAuth, isSpectatorMode, ready, authenticated, fetchAccessToken],
  );
}
