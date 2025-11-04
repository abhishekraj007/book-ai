import { v } from "convex/values";
import { query, internalQuery } from "../../_generated/server";
import * as Users from "../../model/user";

/**
 * Get user's active subscriptions across all platforms
 */
export const getUserSubscriptions = query({
  handler: async (ctx) => {
    const userData = await Users.getUserAndProfile(ctx);
    if (!userData) {
      return null;
    }

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) =>
        q.eq("userId", userData.userMetadata._id)
      )
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .collect();

    return {
      subscriptions,
      hasActiveSubscription: subscriptions.length > 0,
      platforms: subscriptions.map((s) => s.platform),
      hasWebSubscription: subscriptions.some((s) => s.platform === "polar"),
      hasNativeSubscription: subscriptions.some(
        (s) => s.platform === "revenuecat"
      ),
    };
  },
});

/**
 * Check if user can purchase a subscription on a specific platform
 */
export const canPurchaseSubscription = query({
  args: {
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),
  },
  handler: async (ctx, args) => {
    const userData = await Users.getUserAndProfile(ctx);
    if (!userData) {
      return { canPurchase: false, reason: "Not authenticated" };
    }

    const activeSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) =>
        q.eq("userId", userData.userMetadata._id)
      )
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .collect();

    if (activeSubscriptions.length > 0) {
      const existingPlatform = activeSubscriptions[0].platform;
      return {
        canPurchase: false,
        reason: `You already have an active subscription on ${existingPlatform === "polar" ? "web" : "mobile"}`,
        existingPlatform,
      };
    }

    return { canPurchase: true };
  },
});

/**
 * Get platform customer ID from existing subscriptions
 */
export const getPlatformCustomerId = query({
  args: {
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),
  },
  handler: async (ctx, args) => {
    const userData = await Users.getUserAndProfile(ctx);
    if (!userData) {
      return null;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q: any) =>
        q.eq("userId", userData.userMetadata._id)
      )
      .filter((q: any) => q.eq(q.field("platform"), args.platform))
      .first();

    return subscription?.platformCustomerId || null;
  },
});

/**
 * Internal query to get subscription by platform subscription ID
 * Used by webhook handlers that run in HTTP action context
 */
export const getSubscriptionByPlatformSubscriptionId = internalQuery({
  args: {
    platformSubscriptionId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("subscriptions"),
      _creationTime: v.number(),
      userId: v.string(), // Better Auth user ID (stored as string)
      platform: v.union(v.literal("polar"), v.literal("revenuecat")),
      platformCustomerId: v.string(),
      platformSubscriptionId: v.string(),
      platformProductId: v.string(),
      status: v.union(
        v.literal("active"),
        v.literal("canceled"),
        v.literal("expired"),
        v.literal("past_due"),
        v.literal("trialing")
      ),
      productKey: v.optional(v.string()),
      customerEmail: v.string(),
      customerName: v.optional(v.string()),
      currentPeriodStart: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number()),
      canceledAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_platform_subscription_id", (q) =>
        q.eq("platformSubscriptionId", args.platformSubscriptionId)
      )
      .unique();
    return subscription || null;
  },
});

/**
 * Internal query to get order by platform order ID
 * Used by webhook handlers that run in HTTP action context
 */
export const getOrderByPlatformOrderId = internalQuery({
  args: {
    platformOrderId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("orders"),
      _creationTime: v.number(),
      userId: v.string(), // Better Auth user ID (stored as string)
      platform: v.union(v.literal("polar"), v.literal("revenuecat")),
      platformOrderId: v.string(),
      platformProductId: v.string(),
      amount: v.number(),
      status: v.union(
        v.literal("paid"),
        v.literal("pending"),
        v.literal("failed"),
        v.literal("refunded")
      ),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_platform_order_id", (q) =>
        q.eq("platformOrderId", args.platformOrderId)
      )
      .unique();
    return order || null;
  },
});
