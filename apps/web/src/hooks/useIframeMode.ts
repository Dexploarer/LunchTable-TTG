import { useEffect, useRef, useState } from "react";
import { onHostMessage, signalReady, type HostToAppMessage } from "@/lib/iframe";

export function useIframeMode() {
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;
  const hasEmbedParam =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("embedded") === "true";
  const isEmbedded = isInIframe || hasEmbedParam;

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const signaled = useRef(false);

  useEffect(() => {
    if (!isEmbedded) return;

    if (isInIframe && !signaled.current) {
      signalReady();
      signaled.current = true;
    }

    return onHostMessage((message: HostToAppMessage) => {
      if (message.type === "TTG_AUTH") {
        setAuthToken(message.authToken);
        if (message.agentId) setAgentId(message.agentId);
      }
    });
  }, [isEmbedded, isInIframe]);

  const isApiKey = authToken?.startsWith("ttg_") ?? false;
  const isJwt = authToken ? looksLikeJWT(authToken) : false;

  return {
    isEmbedded,
    authToken,
    agentId,
    isApiKey,
    isJwt,
  };
}

function looksLikeJWT(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const base64urlPattern = /^[A-Za-z0-9_-]+$/;
  return parts.every((part) => base64urlPattern.test(part));
}
