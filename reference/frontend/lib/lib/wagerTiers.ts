/**
 * Crypto Wager Tier Constants (Frontend Mirror)
 *
 * Mirrors the backend constants from convex/lib/wagerTiers.ts.
 * Used for UI rendering — tier buttons, validation, formatting.
 */

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

export const SOL_WAGER_TIERS = [0.001, 0.01, 0.05, 0.1, 1] as const;
export const USDC_WAGER_TIERS = [1, 5, 10, 25, 100] as const;

export type WagerCurrency = "sol" | "usdc";

// ============================================================================
// TOKEN CONFIGURATION
// ============================================================================

export const SOL_DECIMALS = 9;
export const USDC_DECIMALS = 6;

export const SOL_MINT = "11111111111111111111111111111111";
export const USDC_MINT =
  process.env.NEXT_PUBLIC_USDC_MINT || "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// ============================================================================
// FEE CONFIGURATION
// ============================================================================

export const CRYPTO_WAGER_FEE_BPS = Number(process.env.NEXT_PUBLIC_CRYPTO_WAGER_FEE_BPS || 1000);
export const CRYPTO_WAGER_WINNER_PERCENTAGE = Number(
  process.env.NEXT_PUBLIC_CRYPTO_WAGER_WINNER_PCT || 0.9
);

// ============================================================================
// VALIDATION & FORMATTING
// ============================================================================

export function isValidWagerTier(amount: number, currency: WagerCurrency) {
  if (currency === "sol") {
    return (SOL_WAGER_TIERS as readonly number[]).includes(amount);
  }
  return (USDC_WAGER_TIERS as readonly number[]).includes(amount);
}

export function getTiersForCurrency(currency: WagerCurrency) {
  return currency === "sol" ? SOL_WAGER_TIERS : USDC_WAGER_TIERS;
}

export function formatWagerAmount(amount: number, currency: WagerCurrency) {
  if (currency === "usdc") {
    return `$${amount} USDC`;
  }
  return `${amount} SOL`;
}

export function formatTierLabel(amount: number, currency: WagerCurrency) {
  if (currency === "usdc") {
    return `$${amount}`;
  }
  return `${amount}`;
}

export function getDecimalsForCurrency(currency: WagerCurrency) {
  return currency === "sol" ? SOL_DECIMALS : USDC_DECIMALS;
}

export function getMintForCurrency(currency: WagerCurrency) {
  return currency === "sol" ? SOL_MINT : USDC_MINT;
}
