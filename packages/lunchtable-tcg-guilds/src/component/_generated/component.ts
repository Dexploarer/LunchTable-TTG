/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    chat: {
      deleteMessage: FunctionReference<
        "mutation",
        "internal",
        { deletedBy: string; messageId: string },
        null,
        Name
      >;
      getMessages: FunctionReference<
        "query",
        "internal",
        { before?: number; guildId: string; limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          guildId: string;
          isSystem: boolean;
          message: string;
          userId: string;
          username: string;
        }>,
        Name
      >;
      getRecentMessages: FunctionReference<
        "query",
        "internal",
        { count?: number; guildId: string },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          guildId: string;
          isSystem: boolean;
          message: string;
          userId: string;
          username: string;
        }>,
        Name
      >;
      sendMessage: FunctionReference<
        "mutation",
        "internal",
        {
          guildId: string;
          isSystem?: boolean;
          message: string;
          userId: string;
          username: string;
        },
        string,
        Name
      >;
    };
    discovery: {
      approveJoinRequest: FunctionReference<
        "mutation",
        "internal",
        { approvedBy: string; requestId: string },
        null,
        Name
      >;
      getJoinRequests: FunctionReference<
        "query",
        "internal",
        { guildId: string },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          guildId: string;
          message?: string;
          respondedAt?: number;
          respondedBy?: string;
          status: "pending" | "approved" | "rejected" | "cancelled";
          userId: string;
        }>,
        Name
      >;
      getPlayerRequests: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          guildId: string;
          message?: string;
          respondedAt?: number;
          respondedBy?: string;
          status: "pending" | "approved" | "rejected" | "cancelled";
          userId: string;
        }>,
        Name
      >;
      rejectJoinRequest: FunctionReference<
        "mutation",
        "internal",
        { rejectedBy: string; requestId: string },
        null,
        Name
      >;
      searchGuilds: FunctionReference<
        "query",
        "internal",
        { limit?: number; searchTerm: string },
        Array<{
          _creationTime: number;
          _id: string;
          bannerImageId?: string;
          createdAt: number;
          description?: string;
          memberCount: number;
          name: string;
          ownerId: string;
          profileImageId?: string;
          updatedAt: number;
          visibility: "public" | "private";
        }>,
        Name
      >;
      submitJoinRequest: FunctionReference<
        "mutation",
        "internal",
        { guildId: string; message?: string; userId: string },
        string,
        Name
      >;
    };
    guilds: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          bannerImageId?: string;
          description?: string;
          name: string;
          ownerId: string;
          profileImageId?: string;
          visibility?: "public" | "private";
        },
        string,
        Name
      >;
      disband: FunctionReference<
        "mutation",
        "internal",
        { id: string; ownerId: string },
        null,
        Name
      >;
      getById: FunctionReference<
        "query",
        "internal",
        { id: string },
        {
          _creationTime: number;
          _id: string;
          bannerImageId?: string;
          createdAt: number;
          description?: string;
          memberCount: number;
          name: string;
          ownerId: string;
          profileImageId?: string;
          updatedAt: number;
          visibility: "public" | "private";
        } | null,
        Name
      >;
      getByOwner: FunctionReference<
        "query",
        "internal",
        { ownerId: string },
        Array<{
          _creationTime: number;
          _id: string;
          bannerImageId?: string;
          createdAt: number;
          description?: string;
          memberCount: number;
          name: string;
          ownerId: string;
          profileImageId?: string;
          updatedAt: number;
          visibility: "public" | "private";
        }>,
        Name
      >;
      getPublicGuilds: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          bannerImageId?: string;
          createdAt: number;
          description?: string;
          memberCount: number;
          name: string;
          ownerId: string;
          profileImageId?: string;
          updatedAt: number;
          visibility: "public" | "private";
        }>,
        Name
      >;
      update: FunctionReference<
        "mutation",
        "internal",
        {
          bannerImageId?: string;
          description?: string;
          id: string;
          name?: string;
          ownerId: string;
          profileImageId?: string;
          visibility?: "public" | "private";
        },
        null,
        Name
      >;
    };
    invites: {
      acceptInvite: FunctionReference<
        "mutation",
        "internal",
        { inviteId: string; userId: string },
        string,
        Name
      >;
      cancelInvite: FunctionReference<
        "mutation",
        "internal",
        { cancelledBy: string; inviteId: string },
        null,
        Name
      >;
      createInvite: FunctionReference<
        "mutation",
        "internal",
        {
          expiresIn?: number;
          guildId: string;
          invitedBy: string;
          invitedUserId: string;
        },
        string,
        Name
      >;
      createInviteLink: FunctionReference<
        "mutation",
        "internal",
        {
          createdBy: string;
          expiresIn?: number;
          guildId: string;
          maxUses?: number;
        },
        string,
        Name
      >;
      declineInvite: FunctionReference<
        "mutation",
        "internal",
        { inviteId: string; userId: string },
        null,
        Name
      >;
      deleteInviteLink: FunctionReference<
        "mutation",
        "internal",
        { deletedBy: string; linkId: string },
        null,
        Name
      >;
      getGuildInviteLinks: FunctionReference<
        "query",
        "internal",
        { activeOnly?: boolean; guildId: string },
        Array<{
          _creationTime: number;
          _id: string;
          code: string;
          createdAt: number;
          createdBy: string;
          expiresAt: number;
          guildId: string;
          isActive: boolean;
          maxUses?: number;
          uses: number;
        }>,
        Name
      >;
      getGuildInvites: FunctionReference<
        "query",
        "internal",
        {
          guildId: string;
          status?: "pending" | "accepted" | "declined" | "expired";
        },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          expiresAt: number;
          guildId: string;
          invitedBy: string;
          invitedUserId: string;
          respondedAt?: number;
          status: "pending" | "accepted" | "declined" | "expired";
        }>,
        Name
      >;
      getPendingInvites: FunctionReference<
        "query",
        "internal",
        { userId: string },
        Array<{
          _creationTime: number;
          _id: string;
          createdAt: number;
          expiresAt: number;
          guildId: string;
          invitedBy: string;
          invitedUserId: string;
          respondedAt?: number;
          status: "pending" | "accepted" | "declined" | "expired";
        }>,
        Name
      >;
      useInviteLink: FunctionReference<
        "mutation",
        "internal",
        { code: string; userId: string },
        string,
        Name
      >;
    };
    members: {
      getMemberCount: FunctionReference<
        "query",
        "internal",
        { guildId: string },
        number,
        Name
      >;
      getMembers: FunctionReference<
        "query",
        "internal",
        { guildId: string },
        Array<{
          _creationTime: number;
          _id: string;
          guildId: string;
          joinedAt: number;
          lastActiveAt?: number;
          role: "owner" | "member";
          userId: string;
        }>,
        Name
      >;
      getPlayerGuild: FunctionReference<
        "query",
        "internal",
        { userId: string },
        {
          guild: {
            _creationTime: number;
            _id: string;
            bannerImageId?: string;
            createdAt: number;
            description?: string;
            memberCount: number;
            name: string;
            ownerId: string;
            profileImageId?: string;
            updatedAt: number;
            visibility: "public" | "private";
          };
          membership: {
            _creationTime: number;
            _id: string;
            guildId: string;
            joinedAt: number;
            lastActiveAt?: number;
            role: "owner" | "member";
            userId: string;
          };
        } | null,
        Name
      >;
      join: FunctionReference<
        "mutation",
        "internal",
        { guildId: string; userId: string },
        string,
        Name
      >;
      kick: FunctionReference<
        "mutation",
        "internal",
        { guildId: string; kickedBy: string; targetUserId: string },
        null,
        Name
      >;
      leave: FunctionReference<
        "mutation",
        "internal",
        { guildId: string; userId: string },
        null,
        Name
      >;
      transferOwnership: FunctionReference<
        "mutation",
        "internal",
        { currentOwnerId: string; guildId: string; newOwnerId: string },
        null,
        Name
      >;
      updateRole: FunctionReference<
        "mutation",
        "internal",
        {
          guildId: string;
          newRole: "owner" | "member";
          targetUserId: string;
          updatedBy: string;
        },
        null,
        Name
      >;
    };
  };
