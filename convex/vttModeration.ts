import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const BLOCKLIST = ["hate", "violence against", "dox", "exploit", "nazi"];

export function evaluateModerationText(input: string) {
  const text = input.toLowerCase();
  const hit = BLOCKLIST.find((word) => text.includes(word));
  if (hit) {
    return {
      status: "rejected" as const,
      reason: `Blocked keyword detected: ${hit}`,
    };
  }

  if (input.trim().length < 20) {
    return {
      status: "needs_review" as const,
      reason: "Insufficient content for automated approval.",
    };
  }

  return {
    status: "approved" as const,
    reason: "Automated moderation passed.",
  };
}

export const assessPublish = mutation({
  args: {
    targetType: v.string(),
    targetId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const result = evaluateModerationText(args.content);
    const eventId = await ctx.db.insert("moderationEvents", {
      targetType: args.targetType,
      targetId: args.targetId,
      status: result.status,
      reason: result.reason,
      createdAt: Date.now(),
    });

    return {
      eventId,
      status: result.status,
      reason: result.reason,
    };
  },
});

export const getLatestModeration = query({
  args: {
    targetType: v.string(),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("moderationEvents")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .collect();

    return events.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
  },
});
