/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as env from "../env.js";
import type * as http from "../http.js";
import type * as httpRoutes from "../httpRoutes.js";
import type * as permissions from "../permissions.js";
import type * as vttAgents from "../vttAgents.js";
import type * as vttByok from "../vttByok.js";
import type * as vttDiscovery from "../vttDiscovery.js";
import type * as vttGeneration from "../vttGeneration.js";
import type * as vttMaps from "../vttMaps.js";
import type * as vttModeration from "../vttModeration.js";
import type * as vttPublish from "../vttPublish.js";
import type * as vttSessions from "../vttSessions.js";
import type * as vttWorlds from "../vttWorlds.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  env: typeof env;
  http: typeof http;
  httpRoutes: typeof httpRoutes;
  permissions: typeof permissions;
  vttAgents: typeof vttAgents;
  vttByok: typeof vttByok;
  vttDiscovery: typeof vttDiscovery;
  vttGeneration: typeof vttGeneration;
  vttMaps: typeof vttMaps;
  vttModeration: typeof vttModeration;
  vttPublish: typeof vttPublish;
  vttSessions: typeof vttSessions;
  vttWorlds: typeof vttWorlds;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
