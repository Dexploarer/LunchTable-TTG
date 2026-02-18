import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const guildSearchResultValidator = v.object({
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
});

const joinRequestReturnValidator = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  guildId: v.string(),
  userId: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("cancelled")
  ),
  message: v.optional(v.string()),
  createdAt: v.number(),
  respondedAt: v.optional(v.number()),
  respondedBy: v.optional(v.string()),
});

export const searchGuilds = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(guildSearchResultValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const searchLower = args.searchTerm.toLowerCase();

    // Get all public guilds
    const allPublicGuilds = await ctx.db
      .query("guilds")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .collect();

    // Filter by name (partial match)
    const matchingGuilds = allPublicGuilds.filter((guild) =>
      guild.name.toLowerCase().includes(searchLower)
    );

    // Sort by member count descending and take limit
    matchingGuilds.sort((a, b) => b.memberCount - a.memberCount);
    const results = matchingGuilds.slice(0, limit);

    return results.map((guild) => ({
      ...guild,
      _id: guild._id as string,
    }));
  },
});

export const submitJoinRequest = mutation({
  args: {
    guildId: v.id("guilds"),
    userId: v.string(),
    message: v.optional(v.string()),
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

    // Check if there's already a pending request
    const existingRequest = await ctx.db
      .query("guildJoinRequests")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", args.guildId).eq("userId", args.userId)
      )
      .first();

    if (existingRequest && existingRequest.status === "pending") {
      throw new Error("You already have a pending join request for this guild");
    }

    const requestId = await ctx.db.insert("guildJoinRequests", {
      guildId: args.guildId,
      userId: args.userId,
      status: "pending",
      message: args.message,
      createdAt: Date.now(),
    });

    return requestId as string;
  },
});

export const getJoinRequests = query({
  args: {
    guildId: v.id("guilds"),
  },
  returns: v.array(joinRequestReturnValidator),
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("guildJoinRequests")
      .withIndex("by_guild", (q) =>
        q.eq("guildId", args.guildId).eq("status", "pending")
      )
      .collect();

    // Sort by creation time
    requests.sort((a, b) => a.createdAt - b.createdAt);

    return requests.map((req) => ({
      ...req,
      _id: req._id as string,
      guildId: req.guildId as string,
    }));
  },
});

export const getPlayerRequests = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(joinRequestReturnValidator),
  handler: async (ctx, args) => {
    // Get all requests and filter by userId
    const allRequests = await ctx.db.query("guildJoinRequests").collect();
    const requests = allRequests.filter((req) => req.userId === args.userId);

    // Sort by creation time descending
    requests.sort((a, b) => b.createdAt - a.createdAt);

    return requests.map((req) => ({
      ...req,
      _id: req._id as string,
      guildId: req.guildId as string,
    }));
  },
});

export const approveJoinRequest = mutation({
  args: {
    requestId: v.id("guildJoinRequests"),
    approvedBy: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Join request not found");
    }

    if (request.status !== "pending") {
      throw new Error("This request has already been processed");
    }

    // Verify approver is owner
    const approverMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", request.guildId).eq("userId", args.approvedBy)
      )
      .unique();

    if (!approverMembership) {
      throw new Error("You are not a member of this guild");
    }

    if (approverMembership.role !== "owner") {
      throw new Error("Only guild owner can approve join requests");
    }

    // Check if requester is already in a guild
    const existingMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_user", (q) => q.eq("userId", request.userId))
      .first();

    if (existingMembership) {
      // Update request status to rejected since they're already in a guild
      await ctx.db.patch(args.requestId, {
        status: "rejected",
        respondedAt: Date.now(),
        respondedBy: args.approvedBy,
      });
      throw new Error("User is already in a guild");
    }

    const guild = await ctx.db.get(request.guildId);
    if (!guild) {
      throw new Error("Guild not found");
    }

    // Add member
    await ctx.db.insert("guildMembers", {
      guildId: request.guildId,
      userId: request.userId,
      role: "member",
      joinedAt: Date.now(),
    });

    // Update member count
    await ctx.db.patch(request.guildId, {
      memberCount: guild.memberCount + 1,
      updatedAt: Date.now(),
    });

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "approved",
      respondedAt: Date.now(),
      respondedBy: args.approvedBy,
    });

    return null;
  },
});

export const rejectJoinRequest = mutation({
  args: {
    requestId: v.id("guildJoinRequests"),
    rejectedBy: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Join request not found");
    }

    if (request.status !== "pending") {
      throw new Error("This request has already been processed");
    }

    // Verify rejecter is owner
    const rejecterMembership = await ctx.db
      .query("guildMembers")
      .withIndex("by_guild_user", (q) =>
        q.eq("guildId", request.guildId).eq("userId", args.rejectedBy)
      )
      .unique();

    if (!rejecterMembership) {
      throw new Error("You are not a member of this guild");
    }

    if (rejecterMembership.role !== "owner") {
      throw new Error("Only guild owner can reject join requests");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      respondedAt: Date.now(),
      respondedBy: args.rejectedBy,
    });

    return null;
  },
});
