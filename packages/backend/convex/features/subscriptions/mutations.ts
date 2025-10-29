import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";

/**
 * Internal mutation to create or update subscription
 */
export const upsertSubscription = internalMutation({
  args: {
    userId: v.id("user"),
    platform: v.union(v.literal("polar"), v.literal("revenuecat")),
    platformCustomerId: v.string(),
    platformSubscriptionId: v.string(),
    platformProductId: v.string(),
    customerEmail: v.string(),
    customerName: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("expired"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    productKey: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if subscription already exists by subscription ID
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_platform_subscription_id", (q: any) =>
        q.eq("platformSubscriptionId", args.platformSubscriptionId)
      )
      .unique();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        status: args.status,
        platformProductId: args.platformProductId,
        productKey: args.productKey,
        customerEmail: args.customerEmail,
        customerName: args.customerName,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        canceledAt: args.canceledAt,
        updatedAt: now,
      });
      return { subscriptionId: existing._id, isNew: false };
    } else {
      // Create new subscription
      const subscriptionId = await ctx.db.insert("subscriptions", {
        userId: args.userId,
        platform: args.platform,
        platformCustomerId: args.platformCustomerId,
        platformSubscriptionId: args.platformSubscriptionId,
        platformProductId: args.platformProductId,
        customerEmail: args.customerEmail,
        customerName: args.customerName,
        status: args.status,
        productKey: args.productKey,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        canceledAt: args.canceledAt,
        createdAt: now,
        updatedAt: now,
      });
      return { subscriptionId, isNew: true };
    }
  },
});
