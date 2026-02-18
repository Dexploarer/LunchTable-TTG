import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  guilds: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    profileImageId: v.optional(v.string()),
    bannerImageId: v.optional(v.string()),
    visibility: v.union(v.literal("public"), v.literal("private")),
    ownerId: v.string(),
    memberCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_owner", ["ownerId"])
    .index("by_visibility", ["visibility"])
    .index("by_member_count", ["memberCount"])
    .index("by_created", ["createdAt"])
    .searchIndex("search_name", { searchField: "name" }),

  guildMembers: defineTable({
    guildId: v.id("guilds"),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("member")),
    joinedAt: v.number(),
    lastActiveAt: v.optional(v.number()),
  })
    .index("by_guild", ["guildId"])
    .index("by_user", ["userId"])
    .index("by_guild_user", ["guildId", "userId"])
    .index("by_guild_role", ["guildId", "role"])
    .index("by_joined", ["guildId", "joinedAt"]),

  guildInvites: defineTable({
    guildId: v.id("guilds"),
    invitedUserId: v.string(),
    invitedBy: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_guild", ["guildId", "status"])
    .index("by_invited_user", ["invitedUserId", "status"])
    .index("by_guild_invited", ["guildId", "invitedUserId"])
    .index("by_expires", ["expiresAt"])
    .index("by_inviter", ["invitedBy"]),

  guildInviteLinks: defineTable({
    guildId: v.id("guilds"),
    code: v.string(),
    createdBy: v.string(),
    uses: v.number(),
    maxUses: v.optional(v.number()),
    expiresAt: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_guild", ["guildId", "isActive"])
    .index("by_creator", ["createdBy"]),

  guildJoinRequests: defineTable({
    guildId: v.id("guilds"),
    userId: v.string(),
    message: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
    respondedBy: v.optional(v.string()),
  })
    .index("by_guild", ["guildId", "status"])
    .index("by_user", ["userId", "status"])
    .index("by_guild_user", ["guildId", "userId"])
    .index("by_created", ["createdAt"]),

  guildMessages: defineTable({
    guildId: v.id("guilds"),
    userId: v.string(),
    username: v.string(),
    message: v.string(),
    createdAt: v.number(),
    isSystem: v.boolean(),
  })
    .index("by_guild_created", ["guildId", "createdAt"])
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),
});
