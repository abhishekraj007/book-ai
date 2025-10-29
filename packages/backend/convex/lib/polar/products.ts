import { query } from "../../_generated/server";
import { polar, getConfiguredProducts as getPolarProducts } from "./client";
import * as Users from "../../model/user";

/**
 * Get configured Polar products
 */
export const getConfiguredProducts = getPolarProducts;

/**
 * Get current user with subscription info
 */
export const getCurrentUserWithSubscription = query({
  handler: async (ctx) => {
    const userData = await Users.getUserAndProfile(ctx);
    if (!userData) {
      return null;
    }

    const subscription = await polar.getCurrentSubscription(ctx, {
      userId: userData.userMetadata._id,
    });

    return {
      ...userData,
      subscription,
      isFree: !subscription,
      isPro:
        subscription?.productKey === "proMonthly" ||
        subscription?.productKey === "proYearly",
    };
  },
});
