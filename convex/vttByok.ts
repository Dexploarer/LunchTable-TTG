import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { fromBase64, getByokCryptoKey, toBase64 } from "./env";

async function encryptKey(plaintext: string) {
  const key = await getByokCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);

  return JSON.stringify({
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(encrypted)),
  });
}

async function decryptKey(serialized: string) {
  const key = await getByokCryptoKey();
  const parsed = JSON.parse(serialized) as { iv: string; ciphertext: string };
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(parsed.iv) },
    key,
    fromBase64(parsed.ciphertext),
  );

  return new TextDecoder().decode(decrypted);
}

function preview(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 8) return "****";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export const upsertProviderKey = mutation({
  args: {
    provider: v.string(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const encryptedKey = await encryptKey(args.apiKey);

    const existing = await ctx.db
      .query("providerKeys")
      .withIndex("by_user_provider", (q) => q.eq("userId", user._id).eq("provider", args.provider))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedKey,
        keyPreview: preview(args.apiKey),
        isActive: true,
        updatedAt: now,
      });

      return { providerKeyId: existing._id, provider: args.provider, keyPreview: preview(args.apiKey) };
    }

    const providerKeyId = await ctx.db.insert("providerKeys", {
      userId: user._id,
      provider: args.provider,
      encryptedKey,
      keyPreview: preview(args.apiKey),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return { providerKeyId, provider: args.provider, keyPreview: preview(args.apiKey) };
  },
});

export const listProviderKeys = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const keys = await ctx.db
      .query("providerKeys")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return keys.map((item) => ({
      _id: item._id,
      provider: item.provider,
      keyPreview: item.keyPreview,
      isActive: item.isActive,
      updatedAt: item.updatedAt,
    }));
  },
});

export const disableProviderKey = mutation({
  args: {
    providerKeyId: v.id("providerKeys"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const keyRow = await ctx.db.get(args.providerKeyId);
    if (!keyRow) throw new Error("Provider key not found");
    if (keyRow.userId !== user._id) throw new Error("Forbidden");

    await ctx.db.patch(keyRow._id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

export const internalGetActiveProviderKey = internalQuery({
  args: {
    userId: v.id("users"),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const keyRow = await ctx.db
      .query("providerKeys")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", args.provider))
      .first();

    if (!keyRow || !keyRow.isActive) return null;

    return {
      provider: keyRow.provider,
      keyPreview: keyRow.keyPreview,
      apiKey: await decryptKey(keyRow.encryptedKey),
    };
  },
});

export const getActiveProviderKeyPreview = query({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const keyRow = await ctx.db
      .query("providerKeys")
      .withIndex("by_user_provider", (q) => q.eq("userId", user._id).eq("provider", args.provider))
      .first();

    if (!keyRow || !keyRow.isActive) return null;

    return {
      provider: keyRow.provider,
      keyPreview: keyRow.keyPreview,
      isActive: keyRow.isActive,
      updatedAt: keyRow.updatedAt,
    };
  },
});
