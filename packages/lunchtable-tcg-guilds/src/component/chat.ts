import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const messageReturnValidator = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  guildId: v.string(),
  userId: v.string(),
  username: v.string(),
  message: v.string(),
  createdAt: v.number(),
  isSystem: v.boolean(),
});

export const sendMessage = mutation({
  args: {
    guildId: v.id("guilds"),
    userId: v.string(),
    username: v.string(),
    message: v.string(),
    isSystem: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Verify sender is a member of the guild
    const membership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.userId)
      )
      .unique();

    if (!membership) {
      throw new Error("You must be a member of this guild to send messages");
    }

    const messageId = await ctx.db.insert("guildMessages", {
      guildId: args.guildId,
      userId: args.userId,
      username: args.username,
      message: args.message,
      createdAt: Date.now(),
      isSystem: args.isSystem ?? false,
    });

    return messageId as string;
  },
});

export const getMessages = query({
  args: {
    guildId: v.id("guilds"),
    limit: v.optional(v.number()),
    before: v.optional(v.number()),
  },
  returns: v.array(messageReturnValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let query = ctx.db
      .query("guildMessages")
      .withIndex("by_guild_created", (q) => q.eq("guildId", args.guildId));

    let messages = await query.collect();

    // Filter by timestamp if provided
    if (args.before !== undefined) {
      const before = args.before;
      messages = messages.filter((msg) => msg.createdAt < before);
    }

    // Sort by timestamp descending and take limit
    messages.sort((a, b) => b.createdAt - a.createdAt);
    messages = messages.slice(0, limit);

    return messages.map((msg) => ({
      ...msg,
      _id: msg._id as string,
      guildId: msg.guildId as string,
    }));
  },
});

export const getRecentMessages = query({
  args: {
    guildId: v.id("guilds"),
    count: v.optional(v.number()),
  },
  returns: v.array(messageReturnValidator),
  handler: async (ctx, args) => {
    const count = args.count ?? 50;

    const messages = await ctx.db
      .query("guildMessages")
      .withIndex("by_guild_created", (q) => q.eq("guildId", args.guildId))
      .collect();

    // Sort by timestamp descending and take count
    messages.sort((a, b) => b.createdAt - a.createdAt);
    const recent = messages.slice(0, count);

    return recent.map((msg) => ({
      ...msg,
      _id: msg._id as string,
      guildId: msg.guildId as string,
    }));
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("guildMessages"),
    deletedBy: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check if deleter is the sender
    if (message.userId === args.deletedBy) {
      await ctx.db.delete(args.messageId);
      return null;
    }

    // Check if deleter is owner
    const membership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", message.guildId).eq("userId", args.deletedBy)
      )
      .unique();

    if (!membership) {
      throw new Error("You are not a member of this guild");
    }

    if (membership.role !== "owner") {
      throw new Error("Only the message sender or guild owner can delete messages");
    }

    await ctx.db.delete(args.messageId);
    return null;
  },
});
