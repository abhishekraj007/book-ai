import { type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { expo } from "@better-auth/expo";
import { DataModel } from "../../_generated/dataModel";
import { betterAuth } from "better-auth";
import { authComponent } from "./component";

const siteUrl = process.env.SITE_URL!;
const nativeAppUrl = process.env.NATIVE_APP_URL || "bookai://";

export function createAuth(
  ctx: GenericCtx<DataModel>,
  { optionsOnly }: { optionsOnly?: boolean } = { optionsOnly: false }
) {
  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    baseURL: "http://localhost:3006", // enable this for web login
    // baseURL: siteUrl, // enable this for mobile login
    trustedOrigins: [siteUrl, nativeAppUrl, "http://localhost:3006"],
    database: authComponent.adapter(ctx),
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google: {
        prompt: "select_account",
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },
    plugins: [expo(), convex()],
  });
}
