"use client";

import { useTokenBalance } from "@/hooks/economy/useTokenBalance";
import { useGameWallet } from "@/hooks/wallet/useGameWallet";
import { typedApi, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import type { Id } from "@convex/_generated/dataModel";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type PurchaseStep = "confirm" | "signing" | "waiting" | "success" | "error";

export interface TokenPurchaseListing {
  _id: Id<"marketplaceListings">;
  tokenPrice: number;
  [key: string]: unknown; // Other listing details
}

export interface UseTokenPurchaseOptions {
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

const PLATFORM_FEE_PERCENT = 0.05;

export function useTokenPurchase(
  listing: TokenPurchaseListing,
  open: boolean,
  options: UseTokenPurchaseOptions
) {
  const { onSuccess, onOpenChange } = options;

  const [step, setStep] = useState<PurchaseStep>("confirm");
  const [error, setError] = useState<string | null>(null);
  const [pendingPurchaseId, setPendingPurchaseId] = useState<Id<"pendingTokenPurchases"> | null>(
    null
  );
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hooks
  const { rawBalance, isLoading: balanceLoading, refresh: refreshBalance } = useTokenBalance();
  const { solanaWallet, isConnected: walletConnected } = useGameWallet();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  // Convex mutations
  const initiatePurchase = useConvexMutation(
    typedApi.economy.tokenMarketplace.initiateTokenPurchase
  );
  const submitSignedTransaction = useConvexMutation(
    typedApi.economy.tokenMarketplace.submitSignedTransaction
  );
  const cancelPendingPurchase = useConvexMutation(
    typedApi.economy.tokenMarketplace.cancelPendingPurchase
  );

  // Query pending purchases to poll for status
  const pendingPurchases = useConvexQuery(
    typedApi.economy.tokenMarketplace.getUserPendingPurchases,
    walletConnected ? {} : "skip"
  );

  // Calculate price breakdown
  const tokenPrice = listing.tokenPrice;
  const platformFee = Math.floor(tokenPrice * PLATFORM_FEE_PERCENT);
  const totalCost = tokenPrice; // Buyer pays full price, fee comes from seller
  const hasSufficientBalance = rawBalance !== null && rawBalance >= totalCost;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep("confirm");
      setError(null);
      setPendingPurchaseId(null);
    } else {
      // Clear any auto-close timer
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
        autoCloseTimer.current = null;
      }
    }
  }, [open]);

  // Poll for purchase confirmation
  useEffect(() => {
    if (step !== "waiting" || !pendingPurchaseId || !pendingPurchases) {
      return;
    }

    const currentPurchase = pendingPurchases?.find((p) => p._id === pendingPurchaseId);

    if (!currentPurchase) {
      return;
    }

    if (currentPurchase.status === "confirmed") {
      setStep("success");
      toast.success("Purchase complete!");

      // Refresh balance
      refreshBalance().catch(() => {
        // Silent fail - balance will update on next query
      });

      // Auto-close after 3 seconds
      autoCloseTimer.current = setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 3000);
    } else if (currentPurchase.status === "failed") {
      setStep("error");
      setError("Transaction failed on-chain. Please try again.");
    } else if (currentPurchase.status === "expired") {
      setStep("error");
      setError("Transaction timed out. Please try again.");
    }
  }, [step, pendingPurchaseId, pendingPurchases, onOpenChange, onSuccess, refreshBalance]);

  const handleInitiatePurchase = useCallback(async () => {
    if (!solanaWallet) {
      setError("Please connect your wallet first");
      return;
    }

    if (!hasSufficientBalance) {
      setError("Insufficient token balance");
      return;
    }

    try {
      setStep("signing");
      setError(null);

      // Step 1: Initiate the purchase (creates pending record, returns unsigned tx)
      const result = await initiatePurchase({
        listingId: listing._id,
      });

      setPendingPurchaseId(result.pendingPurchaseId);

      // Step 2: Decode the base64 transaction
      const transactionBytes = Uint8Array.from(atob(result.transactionBase64), (c) =>
        c.charCodeAt(0)
      );

      // Step 3: Sign and send using Privy
      const { signature } = await signAndSendTransaction({
        transaction: transactionBytes,
        wallet: solanaWallet,
      });

      // Convert signature to base58 string if it's a Uint8Array
      const signatureString =
        signature instanceof Uint8Array
          ? Buffer.from(signature).toString("base64")
          : String(signature);

      // Step 4: Submit the signed transaction to backend
      await submitSignedTransaction({
        pendingPurchaseId: result.pendingPurchaseId,
        signedTransactionBase64: result.transactionBase64, // Transaction was sent client-side
        transactionSignature: signatureString,
      });

      // Move to waiting step
      setStep("waiting");
    } catch (err) {
      console.error("Purchase failed:", err);

      // Handle specific error types
      const message = err instanceof Error ? err.message : "Purchase failed";

      if (
        message.toLowerCase().includes("rejected") ||
        message.toLowerCase().includes("cancelled") ||
        message.toLowerCase().includes("user denied")
      ) {
        setError("Transaction cancelled by user");
      } else if (message.toLowerCase().includes("insufficient")) {
        setError("Insufficient token balance for this purchase");
      } else if (message.toLowerCase().includes("network")) {
        setError("Network error. Please check your connection.");
      } else if (message.toLowerCase().includes("timeout")) {
        setError("Transaction timed out. Please try again.");
      } else {
        setError(message);
      }

      setStep("error");

      // Cancel the pending purchase if it was created
      if (pendingPurchaseId) {
        try {
          await cancelPendingPurchase({ pendingPurchaseId });
        } catch {
          // Silent fail - the pending purchase will expire anyway
        }
      }
    }
  }, [
    solanaWallet,
    hasSufficientBalance,
    listing._id,
    initiatePurchase,
    signAndSendTransaction,
    submitSignedTransaction,
    cancelPendingPurchase,
    pendingPurchaseId,
  ]);

  const handleRetry = useCallback(() => {
    setStep("confirm");
    setError(null);
    setPendingPurchaseId(null);
  }, []);

  const handleClose = useCallback(() => {
    // Don't allow closing during signing/waiting unless there's an error
    if (step === "signing") {
      toast.info("Please complete or cancel the transaction in your wallet");
      return;
    }

    if (step === "waiting") {
      toast.info("Transaction is being confirmed. Please wait or the purchase may not complete.");
      return;
    }

    onOpenChange(false);
  }, [step, onOpenChange]);

  return {
    step,
    error,
    platformFee,
    totalCost,
    hasSufficientBalance,
    walletConnected,
    balanceLoading,
    handleInitiatePurchase,
    handleRetry,
    handleClose,
  };
}
