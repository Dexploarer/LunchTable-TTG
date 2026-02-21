import { useNavigate } from "react-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useUserSync } from "@/hooks/auth/useUserSync";
import { useAppAuth } from "@/hooks/auth/useAppAuth";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const convexEnabled = Boolean(((import.meta.env.VITE_CONVEX_URL as string | undefined) ?? "").trim());
  const { enabled: authEnabled } = useAppAuth();

  if (!authEnabled || !convexEnabled) return <AuthGuardDisabled />;
  return <AuthGuardEnabled>{children}</AuthGuardEnabled>;
}

function AuthGuardDisabled() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return <AuthLoadingScreen message="Auth disabled in local mode..." />;
}

function AuthGuardEnabled({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const { ready, authenticated } = useAppAuth();
  const { isLoading } = useUserSync();

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      navigate("/", { replace: true });
    }
  }, [ready, authenticated, navigate]);

  if (!ready || isLoading) {
    return <AuthLoadingScreen message="Checking sign-in..." />;
  }

  if (!authenticated) return null;

  return <>{children}</>;
}

function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0a09]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#ffcc00] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#a89f94] text-sm uppercase tracking-widest font-bold">{message}</p>
      </div>
    </div>
  );
}
