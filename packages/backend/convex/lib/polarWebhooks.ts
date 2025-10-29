import { internal } from "../_generated/api";

// NOTE: This file has been moved to webhooks/polar.ts
// This file will be deleted after migration

/**
 * Polar Webhook Handlers
 * Organized webhook logic separate from HTTP routing
 */

/**
 * Map Polar product ID to our internal productKey
 */
function getProductKey(productId: string): string | undefined {
  if (productId === process.env.POLAR_PRODUCT_PRO_MONTHLY) {
    return "proMonthly";
  } else if (productId === process.env.POLAR_PRODUCT_PRO_YEARLY) {
    return "proYearly";
  }
  return undefined;
}

/**
 * Determine if subscription is canceled
 */
function isSubscriptionCanceled(data: any): boolean {
  return (
    data.status === "canceled" ||
    data.status === "expired" ||
    data.cancel_at_period_end === true
  );
}

/**
 * Handle subscription creation webhook
 */
export async function handleSubscriptionCreated(ctx: any, event: any) {
  console.log("[WEBHOOK] Subscription created:", event);

  try {
    const productId = event.data.product_id;
    const productKey = getProductKey(productId);

    // Create subscription record
    const result = await ctx.runMutation(internal.features.subscriptions.mutations.upsertSubscription, {
      userId: event.userId,
      platform: "polar" as const,
      platformCustomerId: event.data.customer_id,
      platformSubscriptionId: event.data.id,
      platformProductId: productId,
      customerEmail: event.data.customer_email || "",
      customerName: event.data.customer_name,
      status: "active" as const,
      productKey,
      currentPeriodStart: event.data.current_period_start
        ? new Date(event.data.current_period_start).getTime()
        : undefined,
      currentPeriodEnd: event.data.current_period_end
        ? new Date(event.data.current_period_end).getTime()
        : undefined,
    });

    // Grant premium immediately
    await ctx.runMutation(internal.features.premium.mutations.syncPremiumFromSubscription, {
      userId: event.userId,
      hasActiveSubscription: true,
    });

    // Add bonus credits ONLY for new subscriptions (idempotent)
    if (result.isNew && productKey) {
      await ctx.runMutation(internal.features.credits.mutations.addBonusCredits, {
        userId: event.userId,
        bonusCredits: 1000,
      });
      console.log("[WEBHOOK] Added 1000 bonus credits for new subscription");
    }

    console.log("[WEBHOOK] Subscription created successfully");
  } catch (error) {
    console.error("[WEBHOOK] Error processing subscription.created:", error);
    throw error;
  }
}

/**
 * Handle subscription update webhook
 */
export async function handleSubscriptionUpdated(ctx: any, event: any) {
  console.log("[WEBHOOK] Subscription updated:", event);

  try {
    const isCanceled = isSubscriptionCanceled(event.data);
    const status = isCanceled ? "canceled" : (event.data.status || "active");
    const hasActiveSubscription = status === "active" && !isCanceled;

    // Update subscription record
    await ctx.runMutation(internal.features.subscriptions.mutations.upsertSubscription, {
      userId: event.userId,
      platform: "polar" as const,
      platformCustomerId: event.data.customer_id,
      platformSubscriptionId: event.data.id,
      platformProductId: event.data.product_id,
      customerEmail: event.data.customer_email || "",
      customerName: event.data.customer_name,
      status: status as any,
      productKey: undefined, // Not needed for updates
      currentPeriodStart: event.data.current_period_start
        ? new Date(event.data.current_period_start).getTime()
        : undefined,
      currentPeriodEnd: event.data.current_period_end
        ? new Date(event.data.current_period_end).getTime()
        : undefined,
      canceledAt: isCanceled ? Date.now() : undefined,
    });

    // Sync premium status IMMEDIATELY (revoke if canceled)
    await ctx.runMutation(internal.features.premium.mutations.syncPremiumFromSubscription, {
      userId: event.userId,
      hasActiveSubscription,
    });

    if (isCanceled) {
      console.log("[WEBHOOK] Subscription canceled - premium revoked immediately");
    } else {
      console.log("[WEBHOOK] Subscription updated successfully");
    }
  } catch (error) {
    console.error("[WEBHOOK] Error processing subscription.updated:", error);
    throw error;
  }
}

/**
 * Handle product created webhook
 */
export async function handleProductCreated(ctx: any, event: any) {
  console.log("[WEBHOOK] Product created:", event.data);
  // Add logic if needed
}

/**
 * Handle product updated webhook
 */
export async function handleProductUpdated(ctx: any, event: any) {
  console.log("[WEBHOOK] Product updated:", event.data);
  // Add logic if needed
}
