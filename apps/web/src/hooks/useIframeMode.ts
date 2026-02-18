import { useEffect, useRef, useState } from "react";
import { signalReady, onHostMessage, type HostToGame } from "@/lib/iframe";

/**
 * Detect if the app is running inside an iframe (milaidy) or with
 * ?embedded=true query param, and manage the postMessage handshake.
 *
 * Auth tokens are classified:
 * - JWT (3 dot-separated base64 segments) → used for Convex real-time auth
 * - ltcg_ API key → used for HTTP API spectator mode
 */
export function useIframeMode() {
  const isInIframe =
    typeof window !== "undefined" && window.self !== window.top;
  const hasEmbedParam =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("embedded") === "true";
  const isEmbedded = isInIframe || hasEmbedParam;

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const signaled = useRef(false);

  useEffect(() => {
    if (!isEmbedded) return;

    // Signal ready once (only meaningful inside an iframe)
    if (isInIframe && !signaled.current) {
      signalReady();
      signaled.current = true;
    }

    // Listen for auth from host
    return onHostMessage((msg: HostToGame) => {
      if (msg.type === "LTCG_AUTH") {
        setAuthToken(msg.authToken);
        if (msg.agentId) setAgentId(msg.agentId);
      }
    });
  }, [isEmbedded, isInIframe]);

  // Classify the token type
  const isApiKey = authToken?.startsWith("ltcg_") ?? false;
  const isJwt = authToken ? looksLikeJWT(authToken) : false;

  return {
    isEmbedded,
    authToken,
    agentId,
    /** True when the token is an ltcg_ API key (spectator mode) */
    isApiKey,
    /** True when the token is a Privy JWT (full Convex auth) */
    isJwt,
  };
}

/** Check if a token looks like a JWT (3 dot-separated base64 segments) */
function looksLikeJWT(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const base64urlPattern = /^[A-Za-z0-9_-]+$/;
  return parts.every((part) => base64urlPattern.test(part));
}
