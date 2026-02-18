import { describe, expect, it } from "vitest";
import { canActorUseWorld, isWorldVisibleToViewer } from "./permissions";
import type { Id } from "./_generated/dataModel";

describe("permissions", () => {
  const owner = "user_owner" as Id<"users">;
  const other = "user_other" as Id<"users">;

  it("allows actors to use public/unlisted worlds", () => {
    expect(
      canActorUseWorld({ visibility: "public", ownerUserId: owner, actorUserId: other }),
    ).toBe(true);
    expect(
      canActorUseWorld({ visibility: "unlisted", ownerUserId: owner, actorUserId: other }),
    ).toBe(true);
  });

  it("allows only owners to use private worlds", () => {
    expect(
      canActorUseWorld({ visibility: "private", ownerUserId: owner, actorUserId: owner }),
    ).toBe(true);
    expect(
      canActorUseWorld({ visibility: "private", ownerUserId: owner, actorUserId: other }),
    ).toBe(false);
  });

  it("treats private worlds as visible only to their owner", () => {
    expect(
      isWorldVisibleToViewer({ visibility: "public", ownerUserId: owner, viewerUserId: null }),
    ).toBe(true);
    expect(
      isWorldVisibleToViewer({ visibility: "unlisted", ownerUserId: owner, viewerUserId: null }),
    ).toBe(true);
    expect(
      isWorldVisibleToViewer({ visibility: "private", ownerUserId: owner, viewerUserId: null }),
    ).toBe(false);
    expect(
      isWorldVisibleToViewer({ visibility: "private", ownerUserId: owner, viewerUserId: other }),
    ).toBe(false);
    expect(
      isWorldVisibleToViewer({ visibility: "private", ownerUserId: owner, viewerUserId: owner }),
    ).toBe(true);
  });
});

