/**
 * Auth hooks re-export
 * Uses Privy for authentication with Convex for data storage
 */

// Re-export auth state hook from convex/react
export { useConvexAuth as useAuth } from "convex/react";

// Re-export Privy hooks for auth actions
export { usePrivy, useLogin, useLogout } from "@privy-io/react-auth";

// Re-export our custom hook for Convex integration
export { usePrivyAuthForConvex } from "./usePrivyAuthForConvex";
