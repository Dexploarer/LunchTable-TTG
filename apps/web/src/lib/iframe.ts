const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3334",
  "https://milaidy.app",
  "https://app.milaidy.xyz",
  "file://",
];

export type AppToHostMessage =
  | { type: "TTG_READY" }
  | { type: "SESSION_STARTED"; sessionId: string }
  | { type: "SESSION_ENDED"; sessionId: string; reason: "completed" | "abandoned" }
  | { type: "REQUEST_WALLET" };

export type HostToAppMessage =
  | { type: "TTG_AUTH"; authToken: string; agentId?: string }
  | { type: "OPEN_SESSION"; sessionId: string }
  | { type: "WALLET_CONNECTED"; address: string; chain: string };

function isAllowedOrigin(origin: string) {
  const customOrigin = import.meta.env.VITE_MILAIDY_ORIGIN as string | undefined;
  if (customOrigin && origin === customOrigin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

export function postToHost(message: AppToHostMessage) {
  if (window.self === window.top) return;
  window.parent.postMessage(message, "*");
}

export function onHostMessage(handler: (message: HostToAppMessage) => void) {
  const listener = (event: MessageEvent) => {
    if (!isAllowedOrigin(event.origin)) return;

    const data = event.data;
    if (!data || typeof data.type !== "string") return;

    if (
      data.type === "TTG_AUTH" ||
      data.type === "OPEN_SESSION" ||
      data.type === "WALLET_CONNECTED"
    ) {
      handler(data as HostToAppMessage);
    }
  };

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

export function signalReady() {
  postToHost({ type: "TTG_READY" });
}
