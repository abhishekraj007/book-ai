import { type AuthFunctions, createClient } from "@convex-dev/better-auth";
import { components, internal } from "../../_generated/api";
import type { DataModel, Id } from "../../_generated/dataModel";
import { isDevelopment } from "../../util";

/**
 * NOTE:
 * This authComponent is needed for integrating Convex with Better Auth,
 */

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  verbose: isDevelopment(), // NOTE: if you want this or not?
  triggers: {
    user: {
      onCreate: async (ctx, authUser) => {
        /**
         * NOTE:
         * The entire created document is available
         * In Better Auth 0.9+, we store the auth user ID in our profile table
         * instead of using the deprecated setUserId method
         */
        console.log("onCreate -> authUser", JSON.stringify(authUser, null, 2));
        await ctx.db.insert("profile", {
          name: authUser.name,
          authUserId: authUser._id,
        });
      },
      onUpdate: async () =>
        // ctx,
        // oldUser,
        // newUser
        {
          /**
           * NOTE:
           * Both old and new documents are available
           */
        },
      onDelete: async (ctx, authUser) => {
        /**
         * NOTE:
         * The entire deleted document is available
         * Example:
         * Delete the user's profile data if the user is being deleted
         */

        console.log("onDelete -> authUser", JSON.stringify(authUser, null, 2));

        const profile = await ctx.db
          .query("profile")
          .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUser._id))
          .unique();
        if (profile) {
          await ctx.db.delete(profile._id);
        }
      },
    },
  },
});
