import { v } from "convex/values";
import { internalMutation } from "../../_generated/server";

/**
 * Premium Mutations
 * Internal mutations for managing premium status
 * Admin actions are in admin.ts to avoid circular references
 */

/**
 * Internal mutation to grant premium access
 * Called by admin actions in admin.ts
 * userId is the Better Auth user's _id (stored as string)
 */
export const _grantPremium = internalMutation({
  args: {
    userId: v.string(),
    grantType: v.union(v.literal("manual"), v.literal("lifetime")),
    durationDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const now = Date.now();
    let expiresAt: number | undefined;

    if (args.grantType === "manual" && args.durationDays) {
      expiresAt = now + args.durationDays * 24 * 60 * 60 * 1000;
    }

    await ctx.db.patch(profile._id, {
      isPremium: true,
      premiumGrantedBy: args.grantType,
      premiumGrantedAt: now,
      premiumExpiresAt: expiresAt,
    });

    return {
      success: true,
      message: `Premium ${args.grantType} granted successfully`,
      expiresAt,
    };
  },
});

/**
 * Internal mutation to revoke premium access
 * Called by admin-protected actions only
 * userId is the Better Auth user's _id (stored as string)
 */
export const _revokePremium = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Only revoke if it's a manual or lifetime grant, not subscription-based
    if (
      profile.premiumGrantedBy === "manual" ||
      profile.premiumGrantedBy === "lifetime"
    ) {
      await ctx.db.patch(profile._id, {
        isPremium: false,
        premiumGrantedBy: undefined,
        premiumGrantedAt: undefined,
        premiumExpiresAt: undefined,
      });

      return { success: true, message: "Premium access revoked" };
    }

    return {
      success: false,
      message:
        "Cannot revoke subscription-based premium. User must cancel subscription.",
    };
  },
});

/**
 * Internal mutation to sync premium status when subscription changes
 * Called by webhook handlers
 * userId is the Better Auth user's _id (stored as string)
 */
export const syncPremiumFromSubscription = internalMutation({
  args: {
    userId: v.string(),
    hasActiveSubscription: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profile")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const hasActiveSubscription = args.hasActiveSubscription;

    // Only update if premium is subscription-based (don't override manual/lifetime)
    if (
      profile.premiumGrantedBy === "subscription" ||
      !profile.premiumGrantedBy
    ) {
      if (hasActiveSubscription) {
        // Grant premium from subscription
        await ctx.db.patch(profile._id, {
          isPremium: true,
          premiumGrantedBy: "subscription",
          premiumGrantedAt: Date.now(),
          premiumExpiresAt: undefined, // Subscription-based has no fixed expiry
        });
      } else {
        // Revoke subscription-based premium immediately
        await ctx.db.patch(profile._id, {
          isPremium: false,
          premiumGrantedBy: undefined,
          premiumGrantedAt: undefined,
          premiumExpiresAt: undefined,
        });
      }
    }

    return { success: true };
  },
});
