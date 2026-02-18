/**
 * Event handlers for monitoring LTCG plugin activity.
 *
 * ElizaOS emits events like ACTION_STARTED and ACTION_COMPLETED
 * for all plugin actions. These handlers log LTCG-specific activity
 * so the agent's gameplay can be monitored.
 */

import type { EventHandler, PluginEvents } from "./types.js";

/** Log when any LTCG action starts */
const onActionStarted: EventHandler = async (payload) => {
  const actionName = payload.action as string | undefined;
  if (!actionName?.includes("LTCG")) return;
  console.log(`[LTCG] Action started: ${actionName}`);
};

/** Log when any LTCG action completes */
const onActionCompleted: EventHandler = async (payload) => {
  const actionName = payload.action as string | undefined;
  if (!actionName?.includes("LTCG")) return;

  const success = payload.success as boolean | undefined;
  const status = success ? "succeeded" : "failed";
  console.log(`[LTCG] Action ${status}: ${actionName}`);
};

/** Log when the agent's world/server connects */
const onWorldConnected: EventHandler = async (_payload) => {
  console.log("[LTCG] World connected — agent is online");
};

export const ltcgEvents: PluginEvents = {
  ACTION_STARTED: [onActionStarted],
  ACTION_COMPLETED: [onActionCompleted],
  WORLD_CONNECTED: [onWorldConnected],
};
