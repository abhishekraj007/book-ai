"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Give webhooks time to process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-semibold">
            Processing your purchase...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we set up your account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your account has been updated.
          </p>
          {checkoutId && (
            <p className="text-xs text-muted-foreground">
              Checkout ID: {checkoutId}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-4">
          <Link href="/dashboard" className="block">
            <Button className="w-full">Go to Dashboard</Button>
          </Link>
          <Link href="/pricing" className="block">
            <Button variant="outline" className="w-full">
              View Pricing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
