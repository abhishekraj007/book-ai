// src/app/api/webhook/polar/route.ts
import { Webhooks } from "@polar-sh/nextjs";
import { fetchAction, api } from "@/lib/convex-client";

/**
 * Map Polar product ID to our internal productType
 */
function getProductKey(productId: string): string | undefined {
  const productMap: Record<string, string> = {
    [process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO_MONTHLY!]: "monthly",
    [process.env.NEXT_PUBLIC_POLAR_PRODUCT_PRO_YEARLY!]: "yearly",
  };

  return productMap[productId];
}

/**
 * Extract userId from Polar webhook payload
 * Polar includes customer data with externalId (our userId) and email
 */
function getUserFromPayload(payload: any): {
  userId: string | null;
  email: string | null;
  customerName: string | null;
} {
  const customer = payload?.data?.customer;
  const userId =
    customer?.externalId || payload?.data?.metadata?.userId || null;
  const email = customer?.email || payload?.data?.customer_email || null;
  const customerName = customer?.name || payload?.data?.customer_name || null;

  return { userId, email, customerName };
}

/**
 * Process Polar subscription events using Convex actions
 * This is a reusable function that handles all subscription state changes
 */
async function processPolarSubscriptionEvent(payload: any, eventType: string) {
  const data = payload?.data;
  if (!data) {
    console.error("[POLAR WEBHOOK] No data in payload");
    return;
  }

  // Extract user information from customer data
  let { userId, email, customerName } = getUserFromPayload(payload);

  // If userId is missing (e.g., on cancellation when Polar clears externalId),
  // try to find it from existing subscription record
  if (!userId) {
    console.warn(
      "[POLAR WEBHOOK] No userId (externalId) in payload, attempting to find from existing subscription:",
      { email, subscriptionId: data.id }
    );

    const subscriptionId = data.id;
    if (subscriptionId) {
      try {
        const existingSubscription = await fetchAction(
          (api as any)["features/subscriptions/actions"]
            .getSubscriptionByPlatformId,
          { platformSubscriptionId: subscriptionId }
        );

        if (existingSubscription) {
          userId = existingSubscription.userId;
          console.log(
            `[POLAR WEBHOOK] Found userId from existing subscription: ${userId}`
          );
        } else {
          console.error(
            "[POLAR WEBHOOK] No existing subscription found for platformSubscriptionId:",
            subscriptionId
          );
          return;
        }
      } catch (error) {
        console.error("[POLAR WEBHOOK] Error looking up subscription:", error);
        return;
      }
    } else {
      console.error(
        "[POLAR WEBHOOK] No userId and no subscriptionId to lookup"
      );
      return;
    }
  }

  console.log(`[POLAR WEBHOOK] Processing ${eventType} for user ${userId}`);

  const subscriptionId = data.id;
  const customerId = data.customerId || data.customer_id;
  const productId = data.productId || data.product_id;
  const status = data.status;
  const recurringInterval =
    data.recurringInterval || data.product?.recurringInterval;

  // Determine if subscription is canceled but still active
  const isCanceledButActive = data.cancelAtPeriodEnd || data.canceledAt;

  // Map status
  let mappedStatus: "active" | "canceled" | "expired" | "past_due" | "trialing";
  if (isCanceledButActive && status === "active") {
    mappedStatus = "canceled"; // Will expire at period end
  } else if (status === "active") {
    mappedStatus = "active";
  } else if (status === "canceled") {
    mappedStatus = "canceled";
  } else if (status === "past_due") {
    mappedStatus = "past_due";
  } else if (status === "expired" || status === "incomplete_expired") {
    mappedStatus = "expired";
  } else {
    mappedStatus = "active"; // Default fallback
  }

  const productType = getProductKey(productId);
  const currentPeriodStart = data.currentPeriodStart
    ? new Date(data.currentPeriodStart).getTime()
    : undefined;
  const currentPeriodEnd = data.currentPeriodEnd
    ? new Date(data.currentPeriodEnd).getTime()
    : undefined;
  const canceledAt = data.canceledAt
    ? new Date(data.canceledAt).getTime()
    : undefined;

  // Upsert subscription via Convex action
  const result = await fetchAction(
    (api as any)["features/subscriptions/actions"]
      .upsertSubscriptionFromWebhook,
    {
      userId,
      platform: "polar" as const,
      platformCustomerId: customerId,
      platformSubscriptionId: subscriptionId,
      platformProductId: productId,
      customerEmail: email || "",
      customerName: customerName || undefined,
      status: mappedStatus,
      productType,
      currentPeriodStart,
      currentPeriodEnd,
      canceledAt,
    }
  );

  console.log(`[POLAR WEBHOOK] Subscription upserted:`, {
    userId,
    subscriptionId,
    status: mappedStatus,
    isNew: result.isNew,
    isRenewal: result.isRenewal,
  });

  // Sync premium status based on subscription state
  const hasActiveSubscription =
    mappedStatus === "active" && !isCanceledButActive;
  await fetchAction(
    (api as any)["features/subscriptions/actions"].syncPremiumFromWebhook,
    {
      userId,
      hasActiveSubscription,
    }
  );

  if (eventType === "subscription.created" && result.isNew) {
    // New subscription - grant bonus credits
    const creditsPerCycle = recurringInterval === "year" ? 5000 : 1000;
    await fetchAction(
      (api as any)["features/subscriptions/actions"].addBonusCreditsFromWebhook,
      {
        userId,
        bonusCredits: creditsPerCycle,
      }
    );
  } else if (
    eventType === "subscription.active" &&
    !result.isNew &&
    result.isRenewal
  ) {
    // Renewal - grant renewal credits (only if period changed)
    const creditsPerCycle = recurringInterval === "year" ? 5000 : 1000;
    await fetchAction(
      (api as any)["features/subscriptions/actions"].addBonusCreditsFromWebhook,
      {
        userId,
        bonusCredits: creditsPerCycle,
      }
    );
    console.log(
      `[POLAR WEBHOOK] Added ${creditsPerCycle} credits for subscription renewal`
    );
  }

  return result;
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onCustomerDeleted: async (payload: any) => {
    try {
      console.log(
        "Polar webhook onCustomerDeleted payload",
        JSON.stringify(payload, null, 2)
      );
      // Handle customer deletion if needed
    } catch (err) {
      console.error("Polar webhook onCustomerDeleted error", err);
    }
  },

  onSubscriptionCreated: async (payload: any) => {
    try {
      await processPolarSubscriptionEvent(payload, "subscription.created");
    } catch (err) {
      console.error("Polar webhook onSubscriptionCreated error", err);
      throw err;
    }
  },

  onSubscriptionActive: async (payload: any) => {
    try {
      await processPolarSubscriptionEvent(payload, "subscription.active");
    } catch (err) {
      console.error("Polar webhook onSubscriptionActive error", err);
      throw err;
    }
  },

  onSubscriptionUpdated: async (payload: any) => {
    try {
      await processPolarSubscriptionEvent(payload, "subscription.updated");
    } catch (err) {
      console.error("Polar webhook onSubscriptionUpdated error", err);
      throw err;
    }
  },

  onSubscriptionCanceled: async (payload: any) => {
    try {
      await processPolarSubscriptionEvent(payload, "subscription.canceled");
    } catch (err) {
      console.error("Polar webhook onSubscriptionCanceled error", err);
      throw err;
    }
  },

  onSubscriptionRevoked: async (payload: any) => {
    try {
      await processPolarSubscriptionEvent(payload, "subscription.revoked");
    } catch (err) {
      console.error("Polar webhook onSubscriptionRevoked error", err);
      throw err;
    }
  },

  onOrderPaid: async (payload: any) => {
    try {
      const data = payload?.data;

      // Extract user information
      const { userId, email } = getUserFromPayload(payload);

      if (!userId) {
        console.error("[POLAR WEBHOOK] No userId for order:", {
          email,
          orderId: data.id,
        });
        return;
      }

      // Check if this order already exists (idempotency)
      const existingOrder = await fetchAction(
        (api as any)["features/subscriptions/actions"].getOrderByPlatformId,
        { platformOrderId: data.id }
      );

      if (existingOrder) {
        console.log(
          `[POLAR WEBHOOK] Order ${data.id} already processed, skipping`
        );
        return;
      }

      // Check if this is a one-time product (credit purchase)
      const product = data?.product;
      if (product?.isRecurring) {
        console.log("[POLAR WEBHOOK] Recurring product order, skipping");
        return;
      }

      console.log(`[POLAR WEBHOOK] Processing paid order for user ${userId}`);

      // Extract credit amount from product metadata
      const creditAmount = parseInt(product?.metadata?.credits || "0");

      if (!creditAmount || creditAmount <= 0) {
        console.error(
          "[POLAR WEBHOOK] Invalid or missing credit amount in product metadata:",
          product
        );
        return;
      }

      console.log(
        `[POLAR WEBHOOK] Extracted ${creditAmount} credits from product metadata`
      );

      // Record the order first (for idempotency)
      await fetchAction(
        (api as any)["features/subscriptions/actions"].insertOrderFromWebhook,
        {
          userId,
          platform: "polar",
          platformOrderId: data.id,
          platformProductId: product?.id || data.productId,
          amount: creditAmount,
          status: "paid",
        }
      );

      // Grant credits to user
      const result = await fetchAction(
        (api as any)["features/subscriptions/actions"].addCreditsFromWebhook,
        {
          userId,
          amount: creditAmount,
        }
      );

      console.log(
        `[POLAR WEBHOOK] Added ${creditAmount} credits to user ${userId}`,
        result
      );
    } catch (err) {
      console.error("Polar webhook onOrderPaid error", err);
      throw err;
    }
  },
});

interface PolarPayload {
  data?: any; // raw Polar event payload (simplified)
  [k: string]: any;
}
