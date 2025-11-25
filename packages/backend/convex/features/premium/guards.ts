import * as Users from "../../model/user";

/**
 * Helper to check if current user is admin
 */
export async function isAdmin(ctx: any): Promise<boolean> {
  const userData = await Users.getUserAndProfile(ctx);
  if (!userData) return false;

  return userData.profile?.isAdmin === true;
}

/**
 * Server-side guard to enforce premium access
 * Call this at the start of any premium-gated mutation/query
 * Throws error if user is not premium
 */
export async function requirePremium(ctx: any): Promise<void> {
  const userData = await Users.getUserAndProfile(ctx);
  if (!userData) {
    throw new Error("Authentication required");
  }

  const profile = userData.profile;
  const now = Date.now();

  // Check manual/lifetime premium
  if (profile?.isPremium) {
    if (profile.premiumGrantedBy === "lifetime") {
      return; // Premium granted
    }

    if (profile.premiumGrantedBy === "manual") {
      if (!profile.premiumExpiresAt || profile.premiumExpiresAt >= now) {
        return; // Premium granted and not expired
      }
    }
  }

  // Check active subscription
  const activeSubscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_user_status", (q: any) =>
      q.eq("userId", userData.userMetadata._id).eq("status", "active")
    )
    .first();

  if (activeSubscription) {
    return; // Premium from active subscription
  }

  // No premium access - throw error
  throw new Error("Premium access required. Please upgrade your account.");
}
