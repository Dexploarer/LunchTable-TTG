"use client";

import { handleHookError } from "@/lib/errorHandling";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

/**
 * Promo code redemption for special rewards and bonuses.
 *
 * Allows players to redeem promotional codes for rewards such as gold, gems,
 * card packs, or special items. Shows toast notification with reward details
 * on successful redemption.
 *
 * Features:
 * - Redeem promo codes
 * - Automatic reward distribution
 * - Error handling for invalid/expired codes
 *
 * @example
 * ```typescript
 * const { redeemCode } = usePromoCode();
 *
 * // Redeem a promo code
 * const result = await redeemCode("WELCOME2024");
 * console.log(result.rewardDescription); // "500 Gold, 100 Gems"
 * ```
 *
 * @returns {Object} Promo code interface containing:
 * - `redeemCode(code)` - Redeem code, returns { rewardDescription, ... }
 *
 * @throws {Error} When user is not authenticated or code is invalid
 */
export function usePromoCode() {
  const { isAuthenticated } = useAuth();

  const redeemMutation = useMutation(api.economy.economy.redeemPromoCode);

  const redeemCode = async (code: string) => {
    if (!isAuthenticated) throw new Error("Not authenticated");
    try {
      const result = await redeemMutation({ code });
      toast.success(`Promo code redeemed! You got ${result.rewardDescription}`);
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to redeem promo code");
      toast.error(message);
      throw error;
    }
  };

  return { redeemCode };
}
