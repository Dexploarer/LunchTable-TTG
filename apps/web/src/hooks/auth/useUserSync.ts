import { useConvexAuth } from "convex/react";
import * as Sentry from "@sentry/react";
import { useEffect, useRef, useState } from "react";
import { apiAny, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { useAppAuth } from "@/hooks/auth/useAppAuth";

export function useUserSync() {
  const { enabled: authEnabled, authenticated, user: privyUser } = useAppAuth();
  const { isAuthenticated: convexReady } = useConvexAuth();

  const syncUser = useConvexMutation(apiAny.auth.syncUser);
  const onboardingStatus = useConvexQuery(
    apiAny.auth.getOnboardingStatus,
    convexReady ? {} : "skip",
  );

  const synced = useRef(false);
  const [syncInFlight, setSyncInFlight] = useState(false);

  useEffect(() => {
    if (!authEnabled || !authenticated || !convexReady || synced.current || syncInFlight) return;
    if (onboardingStatus === undefined) return;

    if (onboardingStatus?.exists) {
      synced.current = true;
      return;
    }

    setSyncInFlight(true);
    syncUser({ email: privyUser?.email?.address })
      .then(() => {
        synced.current = true;
      })
      .catch((error: unknown) => {
        Sentry.captureException(error);
      })
      .finally(() => {
        setSyncInFlight(false);
      });
  }, [
    authEnabled,
    authenticated,
    convexReady,
    onboardingStatus,
    syncUser,
    privyUser,
    syncInFlight,
  ]);

  const isLoading =
    authEnabled && authenticated && convexReady && (onboardingStatus === undefined || syncInFlight);

  return {
    isLoading,
    needsOnboarding: false,
    isReady: Boolean(onboardingStatus?.exists),
    onboardingStatus,
  };
}
