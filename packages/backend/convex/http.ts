import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./lib/betterAuth";
// import * as PolarWebhooks from "./lib/polarWebhooks";
import { handleRevenueCatWebhook } from "./lib/revenuecatWebhooks";

const http = httpRouter();

// Register Better Auth routes
authComponent.registerRoutes(http, createAuth, { cors: true });

// Register Polar webhook routes
// polar.registerRoutes(http, {
//   onSubscriptionCreated: PolarWebhooks.handleSubscriptionCreated,
//   onSubscriptionUpdated: PolarWebhooks.handleSubscriptionUpdated,
//   onProductCreated: PolarWebhooks.handleProductCreated,
//   onProductUpdated: PolarWebhooks.handleProductUpdated,
// });

// Register RevenueCat webhook route
http.route({
  path: "/revenuecat/webhooks",
  method: "POST",
  handler: handleRevenueCatWebhook,
});

// Register Book Generation streaming endpoint
http.route({
  path: "/book/generate",
  method: "POST",
  handler: async (req) => {
    // This will be implemented as an httpAction
    const { handleBookGeneration } = await import("./features/books/http");
    return handleBookGeneration(req);
  },
});

export default http;
