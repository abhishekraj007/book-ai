import { type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { expo } from "@better-auth/expo";
import { DataModel } from "../../_generated/dataModel";
import { betterAuth } from "better-auth";
import { authComponent } from "./component";
import { getEnvironment } from "../../util";
import {
  polar,
  checkout,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { internal } from "../../_generated/api";

const siteUrl = process.env.SITE_URL!;
const nativeAppUrl = process.env.NATIVE_APP_URL || "quotes://";

// Validate Polar environment variables
const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
const polarServer = process.env.POLAR_SERVER as
  | "production"
  | "sandbox"
  | undefined;

if (!polarAccessToken) {
  console.error(
    "[POLAR] POLAR_ACCESS_TOKEN is not set in environment variables!"
  );
  console.error("[POLAR] Available env vars:", Object.keys(process.env));
}

// Initialize Polar SDK client
const polarClient = new Polar({
  accessToken: polarAccessToken || "polar_placeholder", // Provide placeholder to prevent crash
  server: polarServer || "sandbox",
});

export function createAuth(
  ctx: GenericCtx<DataModel>,
  { optionsOnly }: { optionsOnly?: boolean } = { optionsOnly: false }
) {
  // Type assertion for webhook context that has mutation capabilities
  const webhookCtx = ctx as any;

  return betterAuth({
    logger: {
      disabled: optionsOnly,
    },
    // baseURL: "http://localhost:3004", // enable this for web login
    baseURL: siteUrl, // enable this for mobile login
    trustedOrigins: [siteUrl, nativeAppUrl, "http://localhost:3004"],
    database: authComponent.adapter(ctx),
    user: {
      deleteUser: {
        enabled: true,
        // afterDelete: async (user) => {
        //   // Delete Polar customer when user is deleted
        //   try {
        //     await polarClient.customers.deleteExternal({
        //       externalId: user.id,
        //     });
        //   } catch (error) {
        //     console.error("[AUTH] Error deleting Polar customer:", error);
        //   }
        // },
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
    plugins: [
      expo(),
      convex(),
      // polar({
      //   client: polarClient,
      //   createCustomerOnSignUp: true,
      //   getCustomerCreateParams: async ({ user }) => ({
      //     email: user.email,
      //     metadata: {
      //       betterAuthUserId: user.id || "",
      //     },
      //   }),
      //   use: [
      //     checkout({
      //       products: [
      //         {
      //           productId: process.env.POLAR_PRODUCT_PRO_MONTHLY!,
      //           slug: "pro-monthly",
      //         },
      //         {
      //           productId: process.env.POLAR_PRODUCT_PRO_YEARLY!,
      //           slug: "pro-yearly",
      //         },
      //         {
      //           productId: process.env.POLAR_PRODUCT_CREDITS_1000!,
      //           slug: "credits-1000",
      //         },
      //         {
      //           productId: process.env.POLAR_PRODUCT_CREDITS_2500!,
      //           slug: "credits-2500",
      //         },
      //         {
      //           productId: process.env.POLAR_PRODUCT_CREDITS_5000!,
      //           slug: "credits-5000",
      //         },
      //       ],
      //       successUrl: "/success?checkout_id={CHECKOUT_ID}",
      //       authenticatedUsersOnly: true,
      //     }),
      //     portal({
      //       returnUrl: process.env.SITE_URL || "http://localhost:3004",
      //     }),
      //     usage(),
      //     webhooks({
      //       secret: process.env.POLAR_WEBHOOK_SECRET!,
      //       onOrderPaid: async (payload) => {
      //         console.log("[POLAR WEBHOOK] Order paid:", payload);

      //         // Extract user ID from customer metadata
      //         const userId = payload.data.customer?.metadata?.betterAuthUserId;
      //         if (!userId) {
      //           console.error(
      //             "[POLAR WEBHOOK] No betterAuthUserId in customer metadata"
      //           );
      //           return;
      //         }

      //         // Handle one-time credit purchases
      //         const productId = payload.data.productId;
      //         const creditAmounts: Record<string, number> = {
      //           [process.env.POLAR_PRODUCT_CREDITS_1000!]: 1000,
      //           [process.env.POLAR_PRODUCT_CREDITS_2500!]: 2500,
      //           [process.env.POLAR_PRODUCT_CREDITS_5000!]: 5000,
      //         };

      //         const creditsAmount = productId
      //           ? creditAmounts[productId]
      //           : undefined;

      //         if (!creditsAmount) {
      //           console.log(
      //             "[POLAR WEBHOOK] Order is not a credit purchase, skipping"
      //           );
      //           return;
      //         }

      //         try {
      //           // Check for duplicate order processing (idempotency)
      //           const existingOrder = await webhookCtx.runQuery(
      //             internal.features.subscriptions.queries
      //               .getOrderByPlatformOrderId,
      //             {
      //               platformOrderId: payload.data.id,
      //             }
      //           );

      //           if (existingOrder) {
      //             console.log(
      //               "[POLAR WEBHOOK] Order already processed:",
      //               existingOrder._id
      //             );
      //             return;
      //           }

      //           // Add credits to user
      //           await webhookCtx.runMutation(
      //             internal.features.credits.mutations.addCreditsToUser,
      //             {
      //               userId,
      //               amount: creditsAmount,
      //             }
      //           );

      //           // Store order record
      //           await webhookCtx.runMutation(
      //             internal.features.subscriptions.mutations.insertOrder,
      //             {
      //               userId,
      //               platform: "polar",
      //               platformOrderId: payload.data.id,
      //               platformProductId: productId,
      //               amount: creditsAmount,
      //               status: "paid",
      //             }
      //           );

      //           console.log(
      //             `[POLAR WEBHOOK] Added ${creditsAmount} credits to user ${userId}`
      //           );
      //         } catch (error) {
      //           console.error(
      //             "[POLAR WEBHOOK] Error processing credit purchase:",
      //             error
      //           );
      //         }
      //       },
      //       onSubscriptionCreated: async (payload) => {
      //         console.log("[POLAR WEBHOOK] Subscription created:", payload);

      //         // Extract user ID from customer metadata
      //         const userId = payload.data.customer?.metadata?.betterAuthUserId;
      //         if (!userId) {
      //           console.error(
      //             "[POLAR WEBHOOK] No betterAuthUserId in customer metadata"
      //           );
      //           return;
      //         }

      //         try {
      //           // Check if subscription already exists (idempotency)
      //           const existingSubscription = await webhookCtx.runQuery(
      //             internal.features.subscriptions.queries
      //               .getSubscriptionByPlatformSubscriptionId,
      //             {
      //               platformSubscriptionId: payload.data.id,
      //             }
      //           );

      //           if (existingSubscription) {
      //             console.log(
      //               "[POLAR WEBHOOK] Subscription already exists:",
      //               existingSubscription._id
      //             );
      //             return;
      //           }

      //           const result = await webhookCtx.runMutation(
      //             internal.features.subscriptions.mutations.upsertSubscription,
      //             {
      //               userId,
      //               platform: "polar",
      //               platformCustomerId: payload.data.customerId,
      //               platformSubscriptionId: payload.data.id,
      //               platformProductId: payload.data.productId,
      //               customerEmail: payload.data.customer.email,
      //               customerName: payload.data.customer.name,
      //               status: "active",
      //               productKey: getProductKeyFromId(payload.data.productId),
      //               currentPeriodStart: payload.data.currentPeriodStart
      //                 ? payload.data.currentPeriodStart.getTime()
      //                 : undefined,
      //               currentPeriodEnd: payload.data.currentPeriodEnd
      //                 ? payload.data.currentPeriodEnd.getTime()
      //                 : undefined,
      //             }
      //           );

      //           // Sync premium status
      //           await webhookCtx.runMutation(
      //             internal.features.premium.mutations
      //               .syncPremiumFromSubscription,
      //             {
      //               userId,
      //               subscriptionId: payload.data.id,
      //             }
      //           );

      //           // Add bonus credits for new subscriptions
      //           if (result.isNew) {
      //             await webhookCtx.runMutation(
      //               internal.features.credits.mutations.addBonusCredits,
      //               {
      //                 userId,
      //                 bonusCredits: 1000,
      //               }
      //             );
      //             console.log(
      //               "[POLAR WEBHOOK] Added 1000 bonus credits for new subscription"
      //             );
      //           }
      //         } catch (error) {
      //           console.error(
      //             "[POLAR WEBHOOK] Error processing subscription creation:",
      //             error
      //           );
      //         }
      //       },
      //       onSubscriptionUpdated: async (payload) => {
      //         console.log("[POLAR WEBHOOK] Subscription updated:", payload);

      //         // Extract user ID from customer metadata
      //         const userId = payload.data.customer?.metadata?.betterAuthUserId;
      //         if (!userId) {
      //           console.error(
      //             "[POLAR WEBHOOK] No betterAuthUserId in customer metadata"
      //           );
      //           return;
      //         }

      //         try {
      //           const status = payload.data.cancelAtPeriodEnd
      //             ? "canceled"
      //             : payload.data.status;

      //           await webhookCtx.runMutation(
      //             internal.features.subscriptions.mutations.upsertSubscription,
      //             {
      //               userId,
      //               platform: "polar",
      //               platformCustomerId: payload.data.customerId,
      //               platformSubscriptionId: payload.data.id,
      //               platformProductId: payload.data.productId,
      //               customerEmail: payload.data.customer.email,
      //               customerName: payload.data.customer.name,
      //               status,
      //               productKey: getProductKeyFromId(payload.data.productId),
      //               currentPeriodStart: payload.data.currentPeriodStart
      //                 ? payload.data.currentPeriodStart.getTime()
      //                 : undefined,
      //               currentPeriodEnd: payload.data.currentPeriodEnd
      //                 ? payload.data.currentPeriodEnd.getTime()
      //                 : undefined,
      //               canceledAt: payload.data.endedAt
      //                 ? payload.data.endedAt.getTime()
      //                 : undefined,
      //             }
      //           );

      //           // Sync premium status
      //           await webhookCtx.runMutation(
      //             internal.features.premium.mutations
      //               .syncPremiumFromSubscription,
      //             {
      //               userId,
      //               subscriptionId: payload.data.id,
      //             }
      //           );

      //           if (status === "canceled") {
      //             console.log(
      //               "[POLAR WEBHOOK] Subscription canceled - premium revoked"
      //             );
      //           }
      //         } catch (error) {
      //           console.error(
      //             "[POLAR WEBHOOK] Error processing subscription update:",
      //             error
      //           );
      //         }
      //       },
      //       onCustomerStateChanged: async (payload) => {
      //         console.log("[POLAR WEBHOOK] Customer state changed:", payload);
      //         // Additional customer state change logic if needed
      //       },
      //     }),
      //   ],
      // }),
    ],
  });
}

// Helper function to get product key from product ID
function getProductKeyFromId(productId: string): string | undefined {
  const productMap: Record<string, string> = {
    [process.env.POLAR_PRODUCT_PRO_MONTHLY!]: "proMonthly",
    [process.env.POLAR_PRODUCT_PRO_YEARLY!]: "proYearly",
    [process.env.POLAR_PRODUCT_CREDITS_1000!]: "credits1000",
    [process.env.POLAR_PRODUCT_CREDITS_2500!]: "credits2500",
    [process.env.POLAR_PRODUCT_CREDITS_5000!]: "credits5000",
  };

  return productMap[productId];
}
