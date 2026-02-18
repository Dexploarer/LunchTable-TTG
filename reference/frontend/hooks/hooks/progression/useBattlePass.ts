"use client";

import { typedApi, useConvexAction, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { handleHookError } from "@/lib/errorHandling";
import type { RewardType } from "@/types/economy";
import { toast } from "sonner";
import { useAuth } from "../auth/useConvexAuthHook";

// Types inferred from backend validators
interface BattlePassReward {
  type: RewardType;
  amount?: number;
  cardId?: string;
  packProductId?: string;
  titleName?: string;
  avatarUrl?: string;
}

interface BattlePassTier {
  tier: number;
  freeReward?: BattlePassReward;
  premiumReward?: BattlePassReward;
  isMilestone: boolean;
  isUnlocked: boolean;
  freeRewardClaimed: boolean;
  premiumRewardClaimed: boolean;
  canClaimFree: boolean;
  canClaimPremium: boolean;
}

interface BattlePassStatus {
  battlePassId: string;
  seasonId: string;
  name: string;
  description?: string;
  seasonName?: string;
  status: "upcoming" | "active" | "ended";
  totalTiers: number;
  xpPerTier: number;
  startDate: number;
  endDate: number;
  currentXP: number;
  currentTier: number;
  isPremium: boolean;
  claimedFreeTiers: number[];
  claimedPremiumTiers: number[];
  xpToNextTier: number;
  daysRemaining: number;
}

interface ClaimRewardResult {
  success: boolean;
  tier: number;
  track: "free" | "premium";
  reward: {
    type: string;
    amount?: number;
  };
}

interface PurchasePremiumResult {
  checkoutUrl: string;
  sessionId: string;
}

interface ClaimAllResult {
  success: boolean;
  claimedFree: number;
  claimedPremium: number;
}

interface UseBattlePassReturn {
  // Data
  status: BattlePassStatus | null;
  tiers: BattlePassTier[];

  // Computed
  isLoading: boolean;
  hasActiveBattlePass: boolean;
  isPremium: boolean;
  currentTier: number;
  totalTiers: number;
  xpProgress: number;
  xpToNextTier: number;
  daysRemaining: number;

  // Claimable rewards counts
  claimableFreeCount: number;
  claimablePremiumCount: number;
  totalClaimableCount: number;

  // Subscription status
  hasActiveSubscription: boolean;
  isSubscriptionLoading: boolean;

  // Actions
  claimReward: (tier: number, track: "free" | "premium") => Promise<ClaimRewardResult>;
  claimAllRewards: () => Promise<ClaimAllResult>;
  purchasePremium: (planInterval: "month" | "year") => Promise<PurchasePremiumResult>;
}

/**
 * Battle Pass system for seasonal progression rewards.
 *
 * Provides battle pass status, tier progression, and reward claiming.
 * Players earn XP through games and quests to unlock tier rewards.
 * Premium pass unlocks additional exclusive rewards.
 *
 * Features:
 * - View battle pass status and progress
 * - Browse all tiers with free/premium rewards
 * - Claim individual tier rewards
 * - Bulk claim all available rewards
 * - Purchase premium battle pass
 * - Track days remaining in season
 *
 * @example
 * ```typescript
 * const {
 *   status,
 *   tiers,
 *   isPremium,
 *   currentTier,
 *   claimReward,
 *   claimAllRewards,
 *   purchasePremium
 * } = useBattlePass();
 *
 * // Display progress
 * console.log(`Tier ${currentTier} / ${status?.totalTiers}`);
 * console.log(`${status?.daysRemaining} days remaining`);
 *
 * // Claim a reward
 * await claimReward(5, "free");
 *
 * // Claim all available
 * await claimAllRewards();
 *
 * // Upgrade to premium
 * await purchasePremium();
 * ```
 *
 * @returns {UseBattlePassReturn} Battle pass management interface
 */
export function useBattlePass(): UseBattlePassReturn {
  const { isAuthenticated } = useAuth();

  // Queries - using typedApi helpers to avoid TS2589 deep type errors
  const status = useConvexQuery(
    typedApi.progression.battlePass.getBattlePassStatus,
    isAuthenticated ? {} : "skip"
  ) as BattlePassStatus | undefined;
  const tiers = useConvexQuery(
    typedApi.progression.battlePass.getBattlePassTiers,
    isAuthenticated ? {} : "skip"
  ) as BattlePassTier[] | undefined;

  // Mutations - using typedApi helpers to avoid TS2589 deep type errors
  const claimRewardMutation = useConvexMutation(
    typedApi.progression.battlePass.claimBattlePassReward
  ) as (args: { tier: number; track: "free" | "premium" }) => Promise<ClaimRewardResult>;
  const claimAllMutation = useConvexMutation(
    typedApi.progression.battlePass.claimAllAvailableRewards
  ) as (args: Record<string, never>) => Promise<ClaimAllResult>;

  // Action for creating Stripe checkout session
  const createCheckoutSession = useConvexAction(
    typedApi.stripe.checkout.createCheckoutSession
  ) as (args: { planInterval: "month" | "year" }) => Promise<PurchasePremiumResult>;

  // Query subscription status
  const hasSubscription = useConvexQuery(
    typedApi.stripe.queries.hasActiveSubscription,
    isAuthenticated ? {} : "skip"
  ) as boolean | undefined;

  // Claim individual reward
  const claimReward = async (tier: number, track: "free" | "premium") => {
    if (!isAuthenticated) throw new Error("Not authenticated");

    try {
      const result = await claimRewardMutation({ tier, track });
      const rewardText = result.reward.amount
        ? `${result.reward.amount} ${result.reward.type}`
        : result.reward.type;
      toast.success(`Claimed Tier ${tier} reward: ${rewardText}`);
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to claim reward");
      toast.error(message);
      throw error;
    }
  };

  // Claim all available rewards
  const claimAllRewards = async () => {
    if (!isAuthenticated) throw new Error("Not authenticated");

    try {
      const result = await claimAllMutation({});
      const totalClaimed = result.claimedFree + result.claimedPremium;
      if (totalClaimed > 0) {
        toast.success(
          `Claimed ${totalClaimed} rewards! (${result.claimedFree} free, ${result.claimedPremium} premium)`
        );
      } else {
        toast.info("No rewards available to claim");
      }
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to claim rewards");
      toast.error(message);
      throw error;
    }
  };

  // Purchase premium pass via Stripe checkout
  const purchasePremium = async (planInterval: "month" | "year" = "month") => {
    if (!isAuthenticated) throw new Error("Not authenticated");

    try {
      const result = await createCheckoutSession({ planInterval });
      // Redirect to Stripe checkout
      window.location.href = result.checkoutUrl;
      return result;
    } catch (error) {
      const message = handleHookError(error, "Failed to start checkout");
      toast.error(message);
      throw error;
    }
  };

  // Calculate claimable rewards
  const tiersData = tiers ?? [];
  const claimableFreeCount = tiersData.filter((t: BattlePassTier) => t.canClaimFree).length;
  const claimablePremiumCount = tiersData.filter((t: BattlePassTier) => t.canClaimPremium).length;
  const totalClaimableCount = claimableFreeCount + claimablePremiumCount;

  // XP progress percentage within current tier
  const xpProgress =
    status && status.xpPerTier > 0
      ? ((status.currentXP % status.xpPerTier) / status.xpPerTier) * 100
      : 0;

  return {
    // Data
    status: status ?? null,
    tiers: tiersData,

    // Computed
    isLoading: status === undefined || tiers === undefined,
    hasActiveBattlePass: status !== null && status !== undefined && status.status === "active",
    isPremium: status?.isPremium ?? false,
    currentTier: status?.currentTier ?? 0,
    totalTiers: status?.totalTiers ?? 0,
    xpProgress,
    xpToNextTier: status?.xpToNextTier ?? 0,
    daysRemaining: status?.daysRemaining ?? 0,

    // Claimable counts
    claimableFreeCount,
    claimablePremiumCount,
    totalClaimableCount,

    // Subscription status
    hasActiveSubscription: hasSubscription ?? false,
    isSubscriptionLoading: hasSubscription === undefined,

    // Actions
    claimReward,
    claimAllRewards,
    purchasePremium,
  };
}
