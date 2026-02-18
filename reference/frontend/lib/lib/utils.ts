/**
 * Utility functions for the web app
 *
 * Re-exports shared utilities from @ltcg/core and app-specific helpers.
 */

// Re-export cn from core package
export { cn, type ClassValue } from "@ltcg/core/utils";

// ============================================================================
// JSON ABILITY TYPES - Re-exported from cardHelpers for backwards compatibility
// ============================================================================

// Re-export all types and functions from cardHelpers
export type {
  EffectType,
  TriggerCondition,
  CostType,
  JsonCost,
  JsonEffect,
  JsonAbility,
  DisplayEffect,
} from "./cardHelpers";

export {
  getCardEffectsArray,
  getAbilityDisplayText,
  isJsonAbility,
  getTriggerLabel,
  getEffectTypeLabel,
  hasOPTRestriction,
  hasHOPTRestriction,
  isContinuousAbility,
  getProtectionFlags,
} from "./cardHelpers";
