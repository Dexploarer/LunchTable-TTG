/**
 * Card Helpers
 *
 * Centralized utility functions for working with card data and JSON abilities.
 * Re-exports from @ltcg/core for frontend usage.
 */

export type {
  EffectType,
  TriggerCondition,
  CostType,
  JsonCost,
  ActivationType,
  JsonEffect,
  JsonAbility,
  DisplayEffect,
} from "@ltcg/core/types";

export {
  EFFECT_TYPE_LABELS,
  TRIGGER_LABELS,
  COST_TYPE_LABELS,
  getEffectType,
  formatCost,
  generateEffectDescription,
  convertEffectToDisplay,
  getCardEffectsArray,
  getAbilityDisplayText,
  isJsonAbility,
  getTriggerLabel,
  getEffectTypeLabel,
  hasOPTRestriction,
  hasHOPTRestriction,
  isContinuousAbility,
  getProtectionFlags,
} from "@ltcg/core/utils";
