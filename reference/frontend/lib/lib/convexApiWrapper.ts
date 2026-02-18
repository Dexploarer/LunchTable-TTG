/**
 * Convex API Wrapper
 *
 * This file isolates the Convex API import to prevent TS2589 errors.
 * TypeScript's type instantiation limit is exceeded when evaluating
 * the deeply nested Convex API types in the main helpers file.
 *
 * By isolating the import here with an explicit `any` type, we prevent
 * the type recursion from propagating to files that import from convexHelpers.
 */

import { api as convexApi } from "@convex/_generated/api";

// @ts-ignore TS2589 - Type instantiation is excessively deep
// biome-ignore lint/suspicious/noExplicitAny: Required to prevent TS2589 type recursion errors
export const api: any = convexApi;
