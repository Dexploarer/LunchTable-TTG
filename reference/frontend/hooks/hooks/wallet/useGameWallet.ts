"use client";

import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { usePrivy } from "@privy-io/react-auth";
import {
  type ConnectedStandardSolanaWallet,
  useCreateWallet,
  useWallets,
} from "@privy-io/react-auth/solana";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../auth/useConvexAuthHook";

/**
 * Wallet type for differentiating between Privy embedded and external wallets
 */
export type WalletType = "privy_embedded" | "external";

/**
 * Return type for the useGameWallet hook
 */
export interface UseGameWalletReturn {
  /** Connected wallet address, or null if not connected */
  walletAddress: string | null;
  /** Type of connected wallet */
  walletType: WalletType | null;
  /** Whether a wallet is connected and synced with backend */
  isConnected: boolean;
  /** Whether a wallet connection operation is in progress */
  isConnecting: boolean;
  /** Whether wallet state is still loading */
  isLoading: boolean;
  /** Connect using Privy's embedded Solana wallet */
  connectEmbeddedWallet: () => Promise<void>;
  /** Connect an external wallet (Phantom, Solflare, etc.) */
  connectExternalWallet: () => Promise<void>;
  /** Disconnect the current wallet from the game account */
  disconnectWallet: () => Promise<void>;
  /** The Privy Solana wallet object for signing transactions */
  solanaWallet: ConnectedStandardSolanaWallet | null;
  /** Any error that occurred during wallet operations */
  error: string | null;
}

/**
 * Check if a wallet is a Privy embedded wallet
 * Privy embedded wallets have 'Privy' in their name or have the isPrivyWallet flag
 */
function isPrivyEmbeddedWallet(wallet: ConnectedStandardSolanaWallet): boolean {
  const standardWallet = wallet.standardWallet;
  // Check for the isPrivyWallet property on the standard wallet
  if ("isPrivyWallet" in standardWallet && standardWallet.isPrivyWallet) {
    return true;
  }
  // Fallback: check if the wallet name contains 'Privy'
  if (standardWallet.name?.toLowerCase().includes("privy")) {
    return true;
  }
  return false;
}

/**
 * Hook for managing wallet connections in LTCG.
 *
 * Integrates Privy wallet management with Convex backend storage.
 * Supports both Privy embedded Solana wallets and external wallets like Phantom.
 *
 * @example
 * ```typescript
 * const {
 *   walletAddress,
 *   walletType,
 *   isConnected,
 *   isConnecting,
 *   connectEmbeddedWallet,
 *   connectExternalWallet,
 *   disconnectWallet,
 *   solanaWallet,
 * } = useGameWallet();
 *
 * // Connect embedded wallet
 * await connectEmbeddedWallet();
 *
 * // Use wallet for signing (later for SPL transfers)
 * if (solanaWallet) {
 *   const { signature } = await solanaWallet.signMessage({ message: encodedMessage });
 * }
 * ```
 */
export function useGameWallet(): UseGameWalletReturn {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { ready: privyReady, connectWallet } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();

  // Local state for connection operations
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex queries and mutations - using helpers to avoid TS2589 errors
  // Only query when explicitly authenticated (not during initial auth check) to avoid "Authentication required" errors
  const savedWallet = useConvexQuery(
    typedApi.wallet.userWallet.getUserWallet,
    isAuthenticated === true && !authLoading ? {} : "skip"
  );
  const saveWalletMutation = useConvexMutation(typedApi.wallet.userWallet.saveConnectedWallet);
  const disconnectWalletMutation = useConvexMutation(typedApi.wallet.userWallet.disconnectWallet);

  // Find embedded wallet (isPrivyWallet flag or name contains 'Privy')
  const embeddedWallet = useMemo(
    () => wallets.find((w) => isPrivyEmbeddedWallet(w)) ?? null,
    [wallets]
  );

  // Find external wallet (any wallet that's not a Privy embedded wallet)
  const externalWallet = useMemo(
    () => wallets.find((w) => !isPrivyEmbeddedWallet(w)) ?? null,
    [wallets]
  );

  // Determine the active wallet based on what's saved in Convex
  const activeWallet = useMemo(() => {
    if (!savedWallet) return null;

    if (savedWallet.walletType === "privy_embedded") {
      return embeddedWallet;
    }
    if (savedWallet.walletType === "external") {
      return externalWallet;
    }
    return null;
  }, [savedWallet, embeddedWallet, externalWallet]);

  // Derived state
  const isLoading = authLoading || !privyReady || !walletsReady || savedWallet === undefined;
  const isConnected = !!savedWallet && !!activeWallet;
  const walletAddress = savedWallet?.walletAddress ?? null;
  const walletType = savedWallet?.walletType ?? null;

  /**
   * Connect using Privy's embedded Solana wallet.
   * Creates the wallet if it doesn't exist, then saves to Convex.
   */
  const connectEmbeddedWallet = useCallback(async () => {
    // Wait for auth to be fully ready (not just authenticated, but also not loading)
    if (!isAuthenticated || authLoading) {
      setError("Must be authenticated to connect wallet");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      let walletAddress = embeddedWallet?.address;

      // Create embedded wallet if it doesn't exist
      if (!walletAddress) {
        const { wallet: createdWallet } = await createWallet();
        walletAddress = createdWallet.address;
      }

      if (!walletAddress) {
        throw new Error("Failed to create embedded wallet");
      }

      // Save wallet to Convex backend
      await saveWalletMutation({
        walletAddress,
        walletType: "privy_embedded",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect embedded wallet";
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [isAuthenticated, authLoading, embeddedWallet, createWallet, saveWalletMutation]);

  /**
   * Connect an external Solana wallet (Phantom, Solflare, etc.).
   * Opens Privy's wallet connection modal, then saves to Convex.
   */
  const connectExternalWallet = useCallback(async () => {
    // Wait for auth to be fully ready (not just authenticated, but also not loading)
    if (!isAuthenticated || authLoading) {
      setError("Must be authenticated to connect wallet");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Open Privy's external wallet connection modal
      await connectWallet({
        suggestedAddress: externalWallet?.address,
      });

      // After connection, find the newly connected external wallet
      // Note: We need to wait a tick for wallets array to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Re-check for external wallet
      const connectedExternal = wallets.find((w) => !isPrivyEmbeddedWallet(w));

      if (!connectedExternal) {
        throw new Error("No external wallet connected");
      }

      // Save wallet to Convex backend
      await saveWalletMutation({
        walletAddress: connectedExternal.address,
        walletType: "external",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect external wallet";
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [isAuthenticated, authLoading, connectWallet, externalWallet, wallets, saveWalletMutation]);

  /**
   * Disconnect the current wallet from the game account.
   * This only removes the database link - the wallet stays linked in Privy.
   */
  const disconnectWalletAction = useCallback(async () => {
    // Wait for auth to be fully ready (not just authenticated, but also not loading)
    if (!isAuthenticated || authLoading) {
      setError("Must be authenticated to disconnect wallet");
      return;
    }

    if (!savedWallet) {
      setError("No wallet connected");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await disconnectWalletMutation({});
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to disconnect wallet";
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [isAuthenticated, authLoading, savedWallet, disconnectWalletMutation]);

  return {
    walletAddress,
    walletType,
    isConnected,
    isConnecting,
    isLoading,
    connectEmbeddedWallet,
    connectExternalWallet,
    disconnectWallet: disconnectWalletAction,
    solanaWallet: activeWallet,
    error,
  };
}
