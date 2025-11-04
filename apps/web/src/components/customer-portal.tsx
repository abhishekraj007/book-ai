"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function CustomerPortal() {
  const [customerState, setCustomerState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerState();
  }, []);

  const loadCustomerState = async () => {
    try {
      const { data } = await authClient.customer.state();
      setCustomerState(data);
    } catch (error) {
      console.error("Error loading customer state:", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  const hasActiveSubscription =
    customerState?.subscriptions?.some((sub: any) => sub.status === "active") ||
    false;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Account & Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscriptions and billing
        </p>
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        {hasActiveSubscription ? (
          <>
            <div className="space-y-2">
              <h3 className="font-semibold">Active Subscription</h3>
              <p className="text-sm text-muted-foreground">
                You have an active subscription
              </p>
            </div>

            <div className="space-y-2">
              {customerState?.subscriptions?.map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{sub.product?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: {sub.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <h3 className="font-semibold">No Active Subscription</h3>
            <p className="text-sm text-muted-foreground">
              You don't have any active subscriptions
            </p>
          </div>
        )}

        <Button onClick={openPortal} className="w-full">
          Open Customer Portal
        </Button>
      </div>

      {customerState?.meters && customerState.meters.length > 0 && (
        <div className="border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold">Usage Meters</h3>
          <div className="space-y-2">
            {customerState.meters.map((meter: any) => (
              <div
                key={meter.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">{meter.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Balance: {meter.balance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
