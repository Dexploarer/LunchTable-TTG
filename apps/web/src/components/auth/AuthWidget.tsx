import { useLogin, useLogout } from "@privy-io/react-auth";
import { useAppAuth } from "@/hooks/auth/useAppAuth";

function userLabel(user: ReturnType<typeof useAppAuth>["user"]) {
  const email = user?.email?.address?.trim();
  if (email) return email;
  return "Signed in";
}

export function AuthWidget({ invert = false }: { invert?: boolean }) {
  const { enabled, ready, authenticated, user } = useAppAuth();

  if (!enabled) {
    return (
      <span
        className="px-3 py-1 border-2 border-[#121212] bg-white text-[11px] uppercase font-black whitespace-nowrap"
        style={{ filter: invert ? "invert(1)" : "none" }}
        title="Set VITE_PRIVY_APP_ID to enable authentication."
      >
        Auth disabled
      </span>
    );
  }

  return (
    <AuthWidgetEnabled
      invert={invert}
      ready={ready}
      authenticated={authenticated}
      label={userLabel(user)}
    />
  );
}

function AuthWidgetEnabled({
  invert,
  ready,
  authenticated,
  label,
}: {
  invert: boolean;
  ready: boolean;
  authenticated: boolean;
  label: string;
}) {
  const { login } = useLogin();
  const { logout } = useLogout();

  if (!ready) {
    return (
      <span
        className="px-3 py-1 border-2 border-[#121212] bg-white text-[11px] uppercase font-black whitespace-nowrap"
        style={{ filter: invert ? "invert(1)" : "none" }}
      >
        Auth...
      </span>
    );
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        className="px-3 py-1 border-2 border-[#121212] bg-white text-[11px] uppercase font-black whitespace-nowrap"
        style={{ filter: invert ? "invert(1)" : "none" }}
        onClick={() => login()}
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="px-3 py-1 border-2 border-[#121212] bg-white text-[11px] uppercase font-black whitespace-nowrap"
        style={{ filter: invert ? "invert(1)" : "none" }}
        title={label}
      >
        {label}
      </span>
      <button
        type="button"
        className="px-3 py-1 border-2 border-[#121212] bg-white text-[11px] uppercase font-black whitespace-nowrap"
        style={{ filter: invert ? "invert(1)" : "none" }}
        onClick={() => void logout()}
      >
        Sign out
      </button>
    </div>
  );
}
