import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { isAdmin } from "./guards";

/**
 * Admin Actions for Premium Management
 * These are separated from mutations to avoid circular references
 */

/**
 * Admin action to grant premium access to a user
 * Only callable by authenticated admins
 */
export const grantPremiumManually = action({
  args: {
    userId: v.id("user"),
    grantType: v.union(v.literal("manual"), v.literal("lifetime")),
    durationDays: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<void> => {
    // Check admin authorization
    const adminCheck = await isAdmin(ctx);
    if (!adminCheck) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Call internal mutation
    await ctx.runMutation(
      internal.features.premium.mutations._grantPremium,
      args
    );
  },
});

/**
 * Admin action to revoke premium access from a user
 * Only callable by authenticated admins
 */
export const revokePremiumManually = action({
  args: {
    userId: v.id("user"),
  },
  handler: async (ctx, args): Promise<void> => {
    // Check admin authorization
    const adminCheck = await isAdmin(ctx);
    if (!adminCheck) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Call internal mutation
    await ctx.runMutation(
      internal.features.premium.mutations._revokePremium,
      args
    );
  },
});
