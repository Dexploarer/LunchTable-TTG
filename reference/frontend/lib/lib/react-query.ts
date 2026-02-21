import { type UseQueryOptions, useQuery as useTanStackQuery } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import type { FunctionReference, OptionalRestArgs } from "convex/server";
import { useCallback, useMemo } from "react";

/**
 * A wrapper around TanStack Query's useQuery that fetches data from Convex.
 * This does NOT use WebSocket subscriptions. It uses the HTTP client (or one-off query)
 * for standard request/response behavior, leveraging React Query's caching.
 *
 * Use this when:
 * - You don't need real-time updates (e.g. static data, search results)
 * - You want more control over caching/stale time
 * - You want to use React Query's devtools
 *
 * @param query - The Convex query function reference (api.path.to.func)
 * @param args - The arguments for the query
 * @param options - Standard React Query options
 */
export function useConvexQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: OptionalRestArgs<Query>[0],
  options?: Omit<UseQueryOptions<any, any, any, any>, "queryKey" | "queryFn">
) {
  const convex = useConvex();

  // Create a stable query key based on the query name and args
  const queryKey = useMemo(() => [(query as any)._def.functionName, args] as const, [query, args]);

  const queryFn = useCallback(async () => {
    return convex.query(query, args);
  }, [convex, query, args]);

  return useTanStackQuery({
    queryKey,
    queryFn,
    ...options,
  });
}
