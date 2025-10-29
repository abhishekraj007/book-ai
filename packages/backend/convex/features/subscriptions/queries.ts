import { v } from "convex/values";
import { query } from "../../_generated/server";
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
      .withIndex("by_user", (q: any) => q.eq("userId", userData.userMetadata._id))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .collect();

    return {
      subscriptions,
      hasActiveSubscription: subscriptions.length > 0,
      platforms: subscriptions.map((s) => s.platform),
      hasWebSubscription: subscriptions.some((s) => s.platform === "polar"),
      hasNativeSubscription: subscriptions.some((s) => s.platform === "revenuecat"),
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
      .withIndex("by_user", (q: any) => q.eq("userId", userData.userMetadata._id))
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
      .withIndex("by_user", (q: any) => q.eq("userId", userData.userMetadata._id))
      .filter((q: any) => q.eq(q.field("platform"), args.platform))
      .first();

    return subscription?.platformCustomerId || null;
  },
});
