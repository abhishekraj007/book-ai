import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";

/**
 * Internal mutation to add bonus credits to user
 * Called by Polar webhook when subscription is created
 */
export const addBonusCredits = internalMutation({
  args: {
    userId: v.id("user"),
    bonusCredits: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q: any) => q.eq("authUserId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found for user");
    }

    const currentCredits = profile.credits ?? 0;
    const newCredits = currentCredits + args.bonusCredits;

    await ctx.db.patch(profile._id, {
      credits: newCredits,
    });

    return { success: true, newCredits };
  },
});

/**
 * Internal mutation to add credits to user account
 * Called by Polar webhook when credit product is purchased
 */
export const addCreditsToUser = internalMutation({
  args: {
    userId: v.id("user"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q: any) => q.eq("authUserId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found for user");
    }

    const currentCredits = profile.credits ?? 0;
    const newCredits = currentCredits + args.amount;

    await ctx.db.patch(profile._id, {
      credits: newCredits,
    });

    return { success: true, newCredits };
  },
});
