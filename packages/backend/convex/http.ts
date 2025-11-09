import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./lib/betterAuth";
// import * as PolarWebhooks from "./lib/polarWebhooks";
import { handleRevenueCatWebhook } from "./lib/revenuecatWebhooks";
import { handleBookGeneration } from "./features/books/http";

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
  handler: handleBookGeneration,
});

// Register OPTIONS handler for CORS preflight
http.route({
  path: "/book/generate",
  method: "OPTIONS",
  handler: handleBookGeneration,
});

export default http;
