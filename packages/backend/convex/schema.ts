import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  profile: defineTable({
    name: v.optional(v.string()),
    authUserId: v.string(),
  }).index("by_auth_user_id", ["authUserId"]),
  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
  }),
});
