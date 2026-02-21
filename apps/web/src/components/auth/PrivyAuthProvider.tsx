import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { useMemo, type ReactNode } from "react";
import { PRIVY_ENABLED } from "@/lib/auth/privyEnv";
import { AppAuthContext, APP_AUTH_DEFAULT_STATE } from "@/hooks/auth/useAppAuth";

const PRIVY_APP_ID = ((import.meta.env.VITE_PRIVY_APP_ID as string | undefined) ?? "").trim();

function PrivyAuthBridge({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, getAccessToken, linkTelegram } = usePrivy();

  const value = useMemo(
    () => ({
      enabled: true,
      ready,
      authenticated,
      user: user ?? null,
      getAccessToken: async () => {
        try {
          return await getAccessToken();
        } catch {
          return null;
        }
      },
      linkTelegram,
    }),
    [ready, authenticated, user, getAccessToken, linkTelegram],
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_ENABLED) {
    return (
      <AppAuthContext.Provider value={APP_AUTH_DEFAULT_STATE}>{children}</AppAuthContext.Provider>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["email", "telegram", "discord"],
        embeddedWallets: {
          solana: { createOnLogin: "users-without-wallets" },
        },
        appearance: {
          theme: "dark",
          accentColor: "#ffcc00",
        },
      }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}
