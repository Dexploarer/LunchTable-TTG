import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const memberReturnValidator = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  guildId: v.string(),
  userId: v.string(),
  role: v.union(v.literal("owner"), v.literal("member")),
  joinedAt: v.number(),
  lastActiveAt: v.optional(v.number()),
});

export const join = mutation({
  args: {
    guildId: v.id("guilds"),
    userId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    // Check if user is already in a guild
    const existingMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingMembership) {
      throw new Error("User is already in a guild");
    }

    // Add member
    const memberId = await ctx.db.insert("guildMembers", {
      guildId: args.guildId,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
    });

    // Update member count
    await ctx.db.patch(args.guildId, {
      memberCount: guild.memberCount + 1,
      updatedAt: Date.now(),
    });

    return memberId as string;
  },
});

export const leave = mutation({
  args: {
    guildId: v.id("guilds"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    const membership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.userId)
      )
      .unique();

    if (!membership) {
      throw new Error("User is not a member of this guild");
    }

    // Owners cannot leave, they must disband or transfer ownership first
    if (membership.role === "owner") {
      throw new Error("Guild owner cannot leave. Disband the guild or transfer ownership first.");
    }

    // Remove member
    await ctx.db.delete(membership._id);

    // Update member count
    await ctx.db.patch(args.guildId, {
      memberCount: guild.memberCount - 1,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const kick = mutation({
  args: {
    guildId: v.id("guilds"),
    targetUserId: v.string(),
    kickedBy: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    // Check kicker's permissions
    const kicker = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.kickedBy)
      )
      .unique();

    if (!kicker) {
      throw new Error("You are not a member of this guild");
    }

    if (kicker.role !== "owner") {
      throw new Error("Only guild owner can kick members");
    }

    // Get target member
    const target = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.targetUserId)
      )
      .unique();

    if (!target) {
      throw new Error("Target user is not a member of this guild");
    }

    // Cannot kick the owner
    if (target.role === "owner") {
      throw new Error("Cannot kick the guild owner");
    }

    // Remove member
    await ctx.db.delete(target._id);

    // Update member count
    await ctx.db.patch(args.guildId, {
      memberCount: guild.memberCount - 1,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const updateRole = mutation({
  args: {
    guildId: v.id("guilds"),
    targetUserId: v.string(),
    newRole: v.union(v.literal("owner"), v.literal("member")),
    updatedBy: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    // Check updater's permissions
    const updater = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.updatedBy)
      )
      .unique();

    if (!updater) {
      throw new Error("You are not a member of this guild");
    }

    if (updater.role !== "owner") {
      throw new Error("Only the guild owner can change member roles");
    }

    // Get target member
    const target = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.targetUserId)
      )
      .unique();

    if (!target) {
      throw new Error("Target user is not a member of this guild");
    }

    // Cannot change owner's role (transfer ownership is a separate action)
    if (target.role === "owner" || args.newRole === "owner") {
      throw new Error("Cannot change ownership via role update. Use transfer ownership instead.");
    }

    // Update role
    await ctx.db.patch(target._id, { role: args.newRole });
    return null;
  },
});

export const getMembers = query({
  args: { guildId: v.id("guilds") },
  returns: v.array(memberReturnValidator),
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild", (q) => q.eq("guildId", args.guildId))
      .collect();
    return members.map((member) => ({
      ...member,
      _id: member._id as string,
      guildId: member.guildId as string,
    }));
  },
});

export const getMemberCount = query({
  args: { guildId: v.id("guilds") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }
    return guild.memberCount;
  },
});

export const getPlayerGuild = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      guild: v.object({
        _id: v.string(),
        _creationTime: v.number(),
        name: v.string(),
        description: v.optional(v.string()),
        ownerId: v.string(),
        profileImageId: v.optional(v.string()),
        bannerImageId: v.optional(v.string()),
        visibility: v.union(v.literal("public"), v.literal("private")),
        memberCount: v.number(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
      membership: memberReturnValidator,
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("guildMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!membership) {
      return null;
    }

    const guild = await ctx.db.get(membership.guildId);
    if (!guild) {
      return null;
    }

    return {
      guild: {
        ...guild,
        _id: guild._id as string,
      },
      membership: {
        ...membership,
        _id: membership._id as string,
        guildId: membership.guildId as string,
      },
    };
  },
});

export const transferOwnership = mutation({
  args: {
    guildId: v.id("guilds"),
    currentOwnerId: v.string(),
    newOwnerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const guild = await ctx.db.get(args.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    if (guild.ownerId !== args.currentOwnerId) {
      throw new Error("Only the current owner can transfer ownership");
    }

    // Check if new owner is a member
    const newOwnerMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.newOwnerId)
      )
      .unique();

    if (!newOwnerMembership) {
      throw new Error("New owner must be a guild member");
    }

    // Update current owner's role to admin
    const currentOwnerMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.currentOwnerId)
      )
      .unique();

    if (currentOwnerMembership) {
      await ctx.db.patch(currentOwnerMembership._id, { role: "member" });
    }

    // Update new owner's role
    await ctx.db.patch(newOwnerMembership._id, { role: "owner" });

    // Update guild's ownerId
    await ctx.db.patch(args.guildId, {
      ownerId: args.newOwnerId,
      updatedAt: Date.now(),
    });

    return null;
  },
});
