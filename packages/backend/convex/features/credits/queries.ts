import { query } from "../../_generated/server";
import * as Users from "../../model/user";

/**
 * Get credit products available for purchase
 */
export const getCreditProducts = query({
  handler: async () => {
    return [
      {
        credits: 1000,
        price: 9.99,
        productId: process.env.POLAR_PRODUCT_CREDITS_1000 || "",
        label: "1,000 Credits",
        description: "Perfect for getting started",
      },
      {
        credits: 2500,
        price: 19.99,
        productId: process.env.POLAR_PRODUCT_CREDITS_2500 || "",
        label: "2,500 Credits",
        description: "Most popular choice",
        badge: "Popular",
      },
      {
        credits: 5000,
        price: 34.99,
        productId: process.env.POLAR_PRODUCT_CREDITS_5000 || "",
        label: "5,000 Credits",
        description: "For power users",
        badge: "Save 30%",
      },
    ];
  },
});

/**
 * Get user's current credit balance and premium status
 * Premium status is derived from active subscriptions
 */
export const getUserCredits = query({
  handler: async (ctx) => {
    const userData = await Users.getUserAndProfile(ctx);
    if (!userData) {
      return null;
    }

    // Check if user has any active subscription
    const activeSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_status", (q: any) =>
        q.eq("userId", userData.userMetadata._id).eq("status", "active")
      )
      .first();

    return {
      credits: userData.profile?.credits ?? 0,
      isPremium: !!activeSubscription,
      name: userData.profile?.name || userData.userMetadata.name,
    };
  },
});
