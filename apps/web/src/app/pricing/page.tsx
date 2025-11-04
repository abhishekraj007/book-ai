"use client";

import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { LoginModal } from "@/components/login-modal";
import { useState } from "react";
import { toast } from "sonner";

export default function PricingPage() {
  const userData = useQuery(api.user.fetchUserAndProfile);
  const userSubscriptions = useQuery(
    api.features.subscriptions.queries.getUserSubscriptions
  );
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const isLoading = userData === undefined || userSubscriptions === undefined;
  const isAuthenticated = userData !== null && userData !== undefined;

  const handleCheckout = async (slug: string) => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    try {
      setCheckoutLoading(slug);
      await authClient.checkout({ slug });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const openPortal = async () => {
    try {
      await authClient.customer.portal();
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open customer portal");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading pricing...</p>
        </div>
      </div>
    );
  }

  const hasActiveSubscription =
    userSubscriptions?.hasActiveSubscription || false;
  const currentProductKey = userSubscriptions?.subscriptions?.find(
    (sub) => sub.status === "active"
  )?.productKey;

  const features = {
    free: [
      "Basic features",
      "100 credits per month",
      "Community support",
      "Standard processing",
    ],
    pro: [
      "All Free features",
      "Unlimited credits",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
      "API access",
    ],
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground">
          Select the perfect plan for your needs
        </p>
        {isAuthenticated && hasActiveSubscription && (
          <div className="mt-4 p-4 bg-muted border border-border rounded-lg">
            <p className="text-foreground">
              You have an active subscription. You can manage it or purchase
              credits.
            </p>
            <Button onClick={openPortal} variant="outline" className="mt-2">
              Manage Subscription
            </Button>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Tier */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <CardDescription>Perfect for getting started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" disabled>
              {!hasActiveSubscription ? "Current Plan" : "Free Plan"}
            </Button>
          </CardFooter>
        </Card>

        {/* Monthly Pro */}
        <Card className="relative border-primary shadow-lg">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
              Popular
            </span>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro Monthly</CardTitle>
            <CardDescription>For professionals and teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3">
              {features.pro.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {!isAuthenticated ? (
              <Button
                className="w-full"
                onClick={() => setLoginModalOpen(true)}
              >
                Get Started
              </Button>
            ) : currentProductKey === "proMonthly" ? (
              <Button onClick={openPortal} className="w-full">
                Manage Subscription
              </Button>
            ) : hasActiveSubscription ? (
              <Button className="w-full" variant="outline" disabled>
                Already Subscribed
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleCheckout("pro-monthly")}
                disabled={checkoutLoading === "pro-monthly"}
              >
                {checkoutLoading === "pro-monthly"
                  ? "Loading..."
                  : "Get Started"}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Yearly Pro */}
        <Card className="relative">
          <div className="absolute top-0 right-4">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-b-lg text-xs font-semibold">
              Save 17%
            </span>
          </div>
          <CardHeader>
            <CardTitle className="text-2xl">Pro Yearly</CardTitle>
            <CardDescription>Best value for committed users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <span className="text-4xl font-bold">$99</span>
              <span className="text-muted-foreground">/year</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              $8.25/month billed annually
            </p>
            <ul className="space-y-3">
              {features.pro.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            {!isAuthenticated ? (
              <Button
                className="w-full"
                onClick={() => setLoginModalOpen(true)}
              >
                Get Started
              </Button>
            ) : currentProductKey === "proYearly" ? (
              <Button onClick={openPortal} className="w-full">
                Manage Subscription
              </Button>
            ) : hasActiveSubscription ? (
              <Button className="w-full" variant="outline" disabled>
                Already Subscribed
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleCheckout("pro-yearly")}
                disabled={checkoutLoading === "pro-yearly"}
              >
                {checkoutLoading === "pro-yearly"
                  ? "Loading..."
                  : "Get Started"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Credit Packages */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          One-Time Credit Packages
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>1000 Credits</CardTitle>
              <CardDescription>Perfect for occasional use</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">$9.99</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={() =>
                  isAuthenticated
                    ? handleCheckout("credits-1000")
                    : setLoginModalOpen(true)
                }
                disabled={checkoutLoading === "credits-1000"}
              >
                {checkoutLoading === "credits-1000" ? "Loading..." : "Purchase"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle>2500 Credits</CardTitle>
              <CardDescription>Best value for most users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">$19.99</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() =>
                  isAuthenticated
                    ? handleCheckout("credits-2500")
                    : setLoginModalOpen(true)
                }
                disabled={checkoutLoading === "credits-2500"}
              >
                {checkoutLoading === "credits-2500" ? "Loading..." : "Purchase"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5000 Credits</CardTitle>
              <CardDescription>For power users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <span className="text-3xl font-bold">$34.99</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={() =>
                  isAuthenticated
                    ? handleCheckout("credits-5000")
                    : setLoginModalOpen(true)
                }
                disabled={checkoutLoading === "credits-5000"}
              >
                {checkoutLoading === "credits-5000" ? "Loading..." : "Purchase"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* FAQ or Additional Info */}
      <div className="mt-16 text-center">
        <p className="text-muted-foreground">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
      </div>

      <LoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        returnUrl="/pricing"
      />
    </div>
  );
}
