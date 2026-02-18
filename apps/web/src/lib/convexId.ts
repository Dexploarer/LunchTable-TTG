const CONVEX_ID_PATTERN = /^[a-z0-9]+$/i;

export function looksLikeConvexId(value: string | null | undefined): value is string {
  const candidate = value?.trim();
  return Boolean(candidate && candidate.length >= 10 && CONVEX_ID_PATTERN.test(candidate));
}
