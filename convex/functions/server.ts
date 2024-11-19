import { v } from "convex/values";
import {
  assertServerMember,
  authenticatedMutation,
  authenticatedQuery,
} from "./helpers";

export const list = authenticatedQuery({
  handler: async (ctx) => {
    const serverMembers = await ctx.db
      .query("serverMembers")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .collect();
    const servers = await Promise.all(
      serverMembers.map(async ({ serverId }) => {
        const server = await ctx.db.get(serverId);
        if (!server) {
          return null;
        }
        return {
          ...server,
          iconUrl: server.iconId
            ? await ctx.storage.getUrl(server.iconId)
            : null,
        };
      })
    );
    return servers.filter((server) => server !== null);
  },
});

export const get = authenticatedQuery({
  args: {
    id: v.id("servers"),
  },
  handler: async (ctx, { id }) => {
    await assertServerMember(ctx, id);
    return await ctx.db.get(id);
  },
});

export const members = authenticatedQuery({
  args: {
    id: v.id("servers"),
  },
  handler: async (ctx, { id }) => {
    await assertServerMember(ctx, id);
    const serverMembers = await ctx.db
      .query("serverMembers")
      .withIndex("by_serverId", (q) => q.eq("serverId", id))
      .collect();
    const users = await Promise.all(
      serverMembers.map(async ({ userId }) => {
        return await ctx.db.get(userId);
      })
    );
    return users.filter((user) => user !== null);
  },
});

export const removeServerMember = authenticatedMutation({
  args: {
    serverId: v.id("servers"),
    userId: v.id("users"),
  },
  handler: async (ctx, { serverId, userId }) => {
    const server = await ctx.db.get(serverId);
    const serverMember = await ctx.db
      .query("serverMembers")
      .withIndex("by_serverId_userId", (q) =>
        q.eq("serverId", serverId).eq("userId", userId)
      )
      .unique();
    if (!server) {
      throw new Error("Server not found");
    } else if (server.ownerId !== ctx.user._id) {
      throw new Error("You are not the owner of this server");
    } else if (!serverMember) {
      throw new Error("Member is not a part of this server");
    }
    await ctx.db.delete(serverMember._id);
  },
});

export const create = authenticatedMutation({
  args: {
    name: v.string(),
    iconId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { name, iconId }) => {
    const serverId = await ctx.db.insert("servers", {
      name,
      iconId,
      ownerId: ctx.user._id,
    });
    const defaultChannelId = await ctx.db.insert("channels", {
      name: "general",
      serverId,
    });
    await ctx.db.patch(serverId, {
      defaultChannelId,
    });
    await ctx.db.insert("serverMembers", {
      serverId,
      userId: ctx.user._id,
    });
    return { serverId, defaultChannelId };
  },
});
