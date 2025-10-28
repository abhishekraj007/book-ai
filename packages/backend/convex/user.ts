import { query } from "./_generated/server";
import * as Users from "./model/user";

export const fetchUserAndProfile = query({
	handler: async (ctx) => {
		return await Users.getUserAndProfile(ctx);
	},
});
