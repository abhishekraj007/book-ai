import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./lib/betterAuth";
import { polar } from "./lib/polar/client";
import * as PolarWebhooks from "./lib/polarWebhooks";

const http = httpRouter();

// Register Better Auth routes
authComponent.registerRoutes(http, createAuth, { cors: true });

// Register Polar webhook routes
polar.registerRoutes(http, {
  onSubscriptionCreated: PolarWebhooks.handleSubscriptionCreated,
  onSubscriptionUpdated: PolarWebhooks.handleSubscriptionUpdated,
  onProductCreated: PolarWebhooks.handleProductCreated,
  onProductUpdated: PolarWebhooks.handleProductUpdated,
});

export default http;
