import type { GenericCtx } from "@convex-dev/better-auth";
import type { DataModel, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent } from "../lib/betterAuth";

/**
 * Helper functions for accessing authenticated user data in queries and mutations.
 *
 * These functions integrate with Better Auth to provide type-safe access to user information.
 * All functions work in queries, mutations, and actions via GenericCtx.
 */

/**
 * Gets the authenticated user's ID from the JWT token.
 *
 * @param ctx - Query, mutation, or action context
 * @returns The user's subject ID from the JWT, or undefined if not authenticated
 */
export const getUserId = async (ctx: GenericCtx<DataModel>) => {
	const identity = await ctx.auth.getUserIdentity();
	return identity?.subject;
};

/**
 * Safely retrieves the authenticated user from the Better Auth user table.
 *
 * Uses `authComponent.safeGetAuthUser()` which:
 * 1. Gets the user identity from the JWT via ctx.auth.getUserIdentity()
 * 2. Queries the Better Auth "user" table to get the full user document
 * 3. Returns null if the user is not authenticated or not found
 *
 * @param ctx - Query, mutation, or action context
 * @returns The Better Auth user document, or null if not authenticated
 */
export async function safeGetUser(ctx: GenericCtx<DataModel>) {
	return await authComponent.safeGetAuthUser(ctx);
}

/**
 * Retrieves the authenticated user from the Better Auth user table, or throws an error.
 *
 * Uses `authComponent.getAuthUser()` which:
 * 1. Gets the user identity from the JWT via ctx.auth.getUserIdentity()
 * 2. Queries the Better Auth "user" table to get the full user document
 * 3. Throws an error with message "Unauthenticated" if the user is not found
 *
 * Use this when authentication is required for the operation.
 *
 * @param ctx - Query, mutation, or action context
 * @returns The Better Auth user document
 * @throws Error with message "Unauthenticated" if not authenticated
 */
export async function getUser(ctx: GenericCtx<DataModel>) {
	return await authComponent.getAuthUser(ctx);
}

/**
 * Safely retrieves both the Better Auth user document and the custom profile data.
 *
 * This combines:
 * 1. Better Auth user data (from the component's "user" table)
 * 2. Custom profile data (from your "profile" table)
 *
 * The profile is linked via the `authUserId` field in the profile table,
 * which stores the Better Auth user's _id.
 *
 * @param ctx - Query or mutation context
 * @returns Combined user and profile data, or null if not authenticated
 */
export async function getUserAndProfile(ctx: QueryCtx | MutationCtx) {
	const userMetadata = await authComponent.safeGetAuthUser(ctx);
	if (!userMetadata) {
		return null;
	}
	const profile = await ctx.db
		.query("profile")
		.withIndex("by_auth_user_id", (q) => q.eq("authUserId", userMetadata._id))
		.unique();
	return {
		userMetadata,
		profile,
	};
}

/**
 * Retrieves both the Better Auth user document and the custom profile data, or throws an error.
 *
 * This is the same as `getUserAndProfile()` but throws if the user is not authenticated.
 * Use this when authentication is required for the operation.
 *
 * @param ctx - Query or mutation context
 * @returns Combined user and profile data
 * @throws Error with message "Unauthenticated" if not authenticated
 */
export async function getUserAndProfileOrThrow(ctx: QueryCtx | MutationCtx) {
	const userMetadata = await authComponent.getAuthUser(ctx);
	const profile = await ctx.db
		.query("profile")
		.withIndex("by_auth_user_id", (q) => q.eq("authUserId", userMetadata._id))
		.unique();
	if (!profile) {
		throw new Error("No Profile Associated with User");
	}
	return {
		userMetadata,
		profile,
	};
}
