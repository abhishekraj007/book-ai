import { Polar } from "@convex-dev/polar";
import { api, components } from "../../_generated/api";

/**
 * Polar Client Configuration
 * Centralized Polar setup for the application
 */
export const polar = new Polar(components.polar, {
  getUserInfo: async (
    ctx
  ): Promise<{ userId: string; email: string; name?: string }> => {
    const userData = await ctx.runQuery(api.user.fetchUserAndProfile);
    if (!userData) {
      throw new Error("User not authenticated");
    }
    return {
      userId: userData.userMetadata._id,
      email: userData.userMetadata.email,
      name: userData.profile?.name || userData.userMetadata.name || undefined,
    };
  },
  products: {
    proMonthly: process.env.POLAR_PRODUCT_PRO_MONTHLY || "product_id_monthly",
    proYearly: process.env.POLAR_PRODUCT_PRO_YEARLY || "product_id_yearly",
    credits1000:
      process.env.POLAR_PRODUCT_CREDITS_1000 || "product_id_credits_1000",
    credits2500:
      process.env.POLAR_PRODUCT_CREDITS_2500 || "product_id_credits_2500",
    credits5000:
      process.env.POLAR_PRODUCT_CREDITS_5000 || "product_id_credits_5000",
  },
});

// Export Polar API functions
export const {
  changeCurrentSubscription,
  cancelCurrentSubscription,
  getConfiguredProducts,
  listAllProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();
