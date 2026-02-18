import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const DEFAULT_SIGNUP_AVATAR_PATH = "avatars/signup/avatar-001.png";

const VALID_SIGNUP_AVATAR_PATHS = new Set(
  Array.from({ length: 29 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, "0");
    return `avatars/signup/avatar-${suffix}.png`;
  }),
);

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return { identity, privyId: identity.subject };
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const { privyId } = await requireAuth(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_privyId", (q) => q.eq("privyId", privyId))
    .first();

  if (!user) {
    throw new Error("User not found. Sync user first.");
  }

  return user;
}

export const syncUser = mutation({
  args: {
    email: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    walletType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { privyId, identity } = await requireAuth(ctx);
    const now = Date.now();
    const email = args.email ?? identity.email ?? undefined;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_privyId", (q) => q.eq("privyId", privyId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      privyId,
      username: `builder_${now}`,
      avatarPath: DEFAULT_SIGNUP_AVATAR_PATH,
      email,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_privyId", (q) => q.eq("privyId", identity.subject))
      .first();
  },
});

export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_privyId", (q) => q.eq("privyId", identity.subject))
      .first();

    if (!user) {
      return {
        exists: false,
        hasUsername: false,
        hasAvatar: false,
        hasWorkspace: false,
      };
    }

    return {
      exists: true,
      hasUsername: Boolean(user.username && !user.username.startsWith("builder_")),
      hasAvatar: Boolean(user.avatarPath),
      hasWorkspace: Boolean(user.activeWorkspaceId),
    };
  },
});

export const setUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const trimmed = args.username.trim();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      throw new Error("Username must be 3-20 chars (letters, numbers, underscores).");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", trimmed))
      .first();

    if (existing && existing._id !== user._id) {
      throw new Error("Username is already taken.");
    }

    await ctx.db.patch(user._id, { username: trimmed, updatedAt: Date.now() });
    return { success: true };
  },
});

export const setAvatarPath = mutation({
  args: { avatarPath: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const avatarPath = args.avatarPath.trim();

    if (!VALID_SIGNUP_AVATAR_PATHS.has(avatarPath)) {
      throw new Error("Invalid avatar selection.");
    }

    await ctx.db.patch(user._id, { avatarPath, updatedAt: Date.now() });
    return { success: true, avatarPath };
  },
});
