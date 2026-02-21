"use client";

import { useGameWallet } from "@/hooks/wallet/useGameWallet";
import { typedApi, useConvexMutation } from "@/lib/convexHelpers";
import type { Id } from "@convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const TOKEN_DECIMALS = 6;
const MIN_PRICE_TOKENS = 1;
const PLATFORM_FEE_PERCENT = 0.05;

export interface TokenListingCard {
  _id: Id<"playerCards">;
  name: string;
  rarity: string;
  [key: string]: unknown;
}

export interface UseTokenListingOptions {
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useTokenListing(card: TokenListingCard, options: UseTokenListingOptions) {
  const { onSuccess, onOpenChange } = options;
  const { walletAddress, isConnected, isLoading: walletLoading } = useGameWallet();
  const [priceInput, setPriceInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWalletConnect, setShowWalletConnect] = useState(false);

  const createTokenListing = useConvexMutation(
    typedApi.economy.tokenMarketplace.createTokenListing
  );

  // Parse and validate price input
  const priceValidation = useMemo(() => {
    if (!priceInput) {
      return { valid: false, error: null, rawAmount: 0, displayAmount: 0 };
    }

    const parsed = Number.parseFloat(priceInput);
    if (Number.isNaN(parsed)) {
      return { valid: false, error: "Invalid number", rawAmount: 0, displayAmount: 0 };
    }

    if (parsed < MIN_PRICE_TOKENS) {
      return {
        valid: false,
        error: `Minimum price is ${MIN_PRICE_TOKENS} LTCG`,
        rawAmount: 0,
        displayAmount: parsed,
      };
    }

    const rawAmount = Math.floor(parsed * 10 ** TOKEN_DECIMALS);
    return { valid: true, error: null, rawAmount, displayAmount: parsed };
  }, [priceInput]);

  const sellerReceives = useMemo(() => {
    if (!priceValidation.valid) return null;
    return priceValidation.displayAmount * (1 - PLATFORM_FEE_PERCENT);
  }, [priceValidation]);

  const handleSubmit = async () => {
    if (!priceValidation.valid || !isConnected) return;

    setIsSubmitting(true);
    try {
      await createTokenListing({
        cardId: card._id,
        price: priceValidation.rawAmount,
      });

      toast.success("Card listed successfully!", {
        description: `${card.name} is now listed for ${priceValidation.displayAmount} LTCG`,
      });

      onOpenChange(false);
      onSuccess?.();
      setPriceInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create listing";
      toast.error("Listing failed", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPriceInput(value);
    }
  };

  const resetListing = () => {
    setPriceInput("");
    setIsSubmitting(false);
  };

  const truncatedWallet = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  return {
    priceInput,
    setPriceInput,
    isSubmitting,
    showWalletConnect,
    setShowWalletConnect,
    priceValidation,
    sellerReceives,
    handleSubmit,
    handlePriceChange,
    resetListing,
    walletAddress,
    isConnected,
    walletLoading,
    truncatedWallet,
    platformFeePercent: PLATFORM_FEE_PERCENT,
  };
}
