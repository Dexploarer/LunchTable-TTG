export function getAudioContextFromPath(pathname: string): string {
  const clean = pathname.trim().toLowerCase();
  if (clean === "/" || clean === "") return "landing";

  const firstSegment = clean.replace(/^\/+/, "").split("/")[0];
  if (!firstSegment) return "landing";

  if (firstSegment === "table") return "play";
  if (firstSegment === "worlds" || firstSegment === "studio" || firstSegment === "publish")
    return "studio";
  if (firstSegment === "privacy" || firstSegment === "terms" || firstSegment === "about")
    return "legal";

  return firstSegment;
}
