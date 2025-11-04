"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SUBSCRIPTION_PLANS = [
  {
    name: "Pro Monthly",
    slug: "pro-monthly",
    price: "$9.99/month",
    features: [
      "Unlimited access",
      "Premium features",
      "Priority support",
      "1000 bonus credits",
    ],
  },
  {
    name: "Pro Yearly",
    slug: "pro-yearly",
    price: "$99/year",
    features: [
      "Unlimited access",
      "Premium features",
      "Priority support",
      "12000 bonus credits",
      "Save 17%",
    ],
    recommended: true,
  },
];

const CREDIT_PACKAGES = [
  {
    name: "1000 Credits",
    slug: "credits-1000",
    price: "$9.99",
    credits: 1000,
  },
  {
    name: "2500 Credits",
    slug: "credits-2500",
    price: "$19.99",
    credits: 2500,
    recommended: true,
  },
  {
    name: "5000 Credits",
    slug: "credits-5000",
    price: "$34.99",
    credits: 5000,
  },
];

export function PricingPlans() {
  const handleCheckout = async (slug: string) => {
    try {
      await authClient.checkout({
        slug,
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-12">
      {/* Subscription Plans */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Subscription Plans</h2>
          <p className="text-muted-foreground mt-2">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.slug}
              className={`relative border rounded-lg p-6 ${
                plan.recommended ? "border-primary shadow-lg" : "border-border"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Recommended
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <p className="text-2xl font-bold mt-2">{plan.price}</p>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleCheckout(plan.slug)}
                  className="w-full"
                  variant={plan.recommended ? "default" : "outline"}
                >
                  Subscribe
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Packages */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">One-Time Credits</h2>
          <p className="text-muted-foreground mt-2">
            Purchase credits as needed, no subscription required
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.slug}
              className={`relative border rounded-lg p-6 ${
                pkg.recommended ? "border-primary shadow-lg" : "border-border"
              }`}
            >
              {pkg.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Best Value
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{pkg.name}</h3>
                  <p className="text-2xl font-bold mt-2">{pkg.price}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pkg.credits.toLocaleString()} credits
                  </p>
                </div>

                <Button
                  onClick={() => handleCheckout(pkg.slug)}
                  className="w-full"
                  variant={pkg.recommended ? "default" : "outline"}
                >
                  Purchase
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
