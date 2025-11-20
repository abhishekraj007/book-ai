import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import betterAuth from "@convex-dev/better-auth/convex.config";
import r2 from "@convex-dev/r2/convex.config";

const app = defineApp();
app.use(betterAuth); // Better Auth component must be registered first
app.use(agent); // Agent component
app.use(r2); // Cloudflare R2 component for file storage

export default app;
