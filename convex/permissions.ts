import type { Id } from "./_generated/dataModel";

export type WorldVisibility = "public" | "private" | "unlisted";

export function canActorUseWorld(params: {
  visibility: WorldVisibility;
  ownerUserId: Id<"users">;
  actorUserId: Id<"users">;
}) {
  if (params.visibility !== "private") return true;
  return params.actorUserId === params.ownerUserId;
}

export function isWorldVisibleToViewer(params: {
  visibility: WorldVisibility;
  ownerUserId: Id<"users">;
  viewerUserId: Id<"users"> | null;
}) {
  if (params.visibility !== "private") return true;
  return Boolean(params.viewerUserId && params.viewerUserId === params.ownerUserId);
}

