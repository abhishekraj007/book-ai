// src/app/checkout/route.ts
import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3006"}/dashboard`,
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3006"}/dashboard?checkout_id={CHECKOUT_ID}`,
  server: (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox",
});
