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
  console.log(
    "[WEBHOOK] Subscription created:",
    JSON.stringify(event, null, 2)
  );

  try {
    // Check if subscription already exists (idempotency - handle duplicate webhooks)
    const existingSubscription = await ctx.runQuery(
      internal.features.subscriptions.queries
        .getSubscriptionByPlatformSubscriptionId,
      {
        platformSubscriptionId: event.data.id,
      }
    );

    if (existingSubscription) {
      console.log(
        "[WEBHOOK] Subscription already exists, updating instead:",
        existingSubscription._id
      );
      // If subscription exists, treat as update instead
      await handleSubscriptionUpdated(ctx, event);
      return;
    }

    const productId = event.data.product_id;
    const productKey = getProductKey(productId);

    if (!productId) {
      throw new Error("Missing product_id in subscription.created event");
    }

    if (!event.data.customer_id) {
      throw new Error("Missing customer_id in subscription.created event");
    }

    // Create subscription record
    const result = await ctx.runMutation(
      internal.features.subscriptions.mutations.upsertSubscription,
      {
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
      }
    );

    // Grant premium immediately
    await ctx.runMutation(
      internal.features.premium.mutations.syncPremiumFromSubscription,
      {
        userId: event.userId,
        hasActiveSubscription: true,
      }
    );

    // Add bonus credits ONLY for new subscriptions (idempotent)
    if (result.isNew && productKey) {
      await ctx.runMutation(
        internal.features.credits.mutations.addBonusCredits,
        {
          userId: event.userId,
          bonusCredits: 1000,
        }
      );
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
  console.log(
    "[WEBHOOK] Subscription updated:",
    JSON.stringify(event, null, 2)
  );

  try {
    // First, try to get existing subscription to preserve required fields
    const existingSubscription = await ctx.runQuery(
      internal.features.subscriptions.queries
        .getSubscriptionByPlatformSubscriptionId,
      {
        platformSubscriptionId: event.data.id || event.platformSubscriptionId,
      }
    );

    const isCanceled = isSubscriptionCanceled(event.data);
    const status = isCanceled ? "canceled" : event.data.status || "active";
    const hasActiveSubscription = status === "active" && !isCanceled;

    // Use existing subscription values for required fields if not in event data
    const platformCustomerId =
      event.data.customer_id || existingSubscription?.platformCustomerId;
    const platformProductId =
      event.data.product_id || existingSubscription?.platformProductId;

    if (!platformCustomerId || !platformProductId) {
      console.error("[WEBHOOK] Missing required fields:", {
        platformCustomerId,
        platformProductId,
        eventData: event.data,
        existingSubscription: existingSubscription
          ? {
              id: existingSubscription._id,
              platformCustomerId: existingSubscription.platformCustomerId,
              platformProductId: existingSubscription.platformProductId,
            }
          : null,
      });
      throw new Error(
        `Missing required fields: platformCustomerId=${platformCustomerId}, platformProductId=${platformProductId}`
      );
    }

    // Update subscription record
    await ctx.runMutation(
      internal.features.subscriptions.mutations.upsertSubscription,
      {
        userId: event.userId,
        platform: "polar" as const,
        platformCustomerId,
        platformSubscriptionId: event.data.id || event.platformSubscriptionId,
        platformProductId,
        customerEmail:
          event.data.customer_email ||
          existingSubscription?.customerEmail ||
          "",
        customerName:
          event.data.customer_name || existingSubscription?.customerName,
        status: status as any,
        productKey: existingSubscription?.productKey, // Preserve productKey from existing
        currentPeriodStart: event.data.current_period_start
          ? new Date(event.data.current_period_start).getTime()
          : existingSubscription?.currentPeriodStart,
        currentPeriodEnd: event.data.current_period_end
          ? new Date(event.data.current_period_end).getTime()
          : existingSubscription?.currentPeriodEnd,
        canceledAt: isCanceled ? Date.now() : undefined,
      }
    );

    // Sync premium status IMMEDIATELY (revoke if canceled)
    await ctx.runMutation(
      internal.features.premium.mutations.syncPremiumFromSubscription,
      {
        userId: event.userId,
        hasActiveSubscription,
      }
    );

    if (isCanceled) {
      console.log(
        "[WEBHOOK] Subscription canceled - premium revoked immediately"
      );
    } else {
      console.log("[WEBHOOK] Subscription updated successfully");
    }
  } catch (error) {
    console.error("[WEBHOOK] Error processing subscription.updated:", error);
    throw error;
  }
}

/**
 * Map credit product ID to credit amount
 */
function getCreditAmount(productId: string): number | undefined {
  if (productId === process.env.POLAR_PRODUCT_CREDITS_1000) {
    return 1000;
  } else if (productId === process.env.POLAR_PRODUCT_CREDITS_2500) {
    return 2500;
  } else if (productId === process.env.POLAR_PRODUCT_CREDITS_5000) {
    return 5000;
  }
  return undefined;
}

/**
 * Handle order paid webhook (for one-time credit purchases)
 */
export async function handleOrderPaid(ctx: any, event: any) {
  console.log("[WEBHOOK] Order paid:", JSON.stringify(event, null, 2));

  try {
    // Check if this is a credit purchase (one-time product)
    const productId = event.data.product_id;
    const creditAmount = getCreditAmount(productId);

    if (!creditAmount) {
      console.log("[WEBHOOK] Order is not a credit purchase, skipping");
      return;
    }

    // Check if we've already processed this order (idempotency)
    const orderId = event.data.id;
    const existingOrder = await ctx.runQuery(
      internal.features.subscriptions.queries.getOrderByPlatformOrderId,
      {
        platformOrderId: orderId,
      }
    );

    if (existingOrder) {
      console.log("[WEBHOOK] Order already processed:", existingOrder._id);
      return;
    }

    // Record the order for idempotency
    await ctx.runMutation(
      internal.features.subscriptions.mutations.insertOrder,
      {
        userId: event.userId,
        platform: "polar" as const,
        platformOrderId: orderId,
        platformProductId: productId,
        amount: creditAmount,
        status: "paid" as const,
      }
    );

    // Add credits to user profile
    await ctx.runMutation(
      internal.features.credits.mutations.addCreditsToUser,
      {
        userId: event.userId,
        amount: creditAmount,
      }
    );

    console.log(
      `[WEBHOOK] Added ${creditAmount} credits to user ${event.userId}`
    );
  } catch (error) {
    console.error("[WEBHOOK] Error processing order.paid:", error);
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
 * Note: Order.paid events for credit purchases may come through here
 * We'll check the payload and handle orders if detected
 */
export async function handleProductUpdated(ctx: any, event: any) {
  console.log("[WEBHOOK] Product updated:", JSON.stringify(event, null, 2));

  // Check if this event relates to a credit purchase order
  // Polar webhooks structure may vary - check for order indicators
  const productId = event.data?.product_id || event.data?.id;
  if (productId) {
    const creditAmount = getCreditAmount(productId);
    // If it's a credit product and has order-like structure, process as order
    if (
      creditAmount &&
      (event.data?.status === "paid" || event.data?.type === "order")
    ) {
      await handleOrderPaid(ctx, event);
      return;
    }
  }

  // Regular product update logic here if needed
}
