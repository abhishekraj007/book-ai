"use client";

import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { CheckoutLink } from "@convex-dev/polar/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Sparkles, Zap } from "lucide-react";

interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditsModal({ open, onOpenChange }: CreditsModalProps) {
  const polarProducts = useQuery(api.lib.polar.products.getConfiguredProducts);
  const userCredits = useQuery(api.features.credits.queries.getUserCredits);

  const isLoading = polarProducts === undefined || userCredits === undefined;

  const getIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Coins className="h-8 w-8 text-foreground" />;
      case 1:
        return <Sparkles className="h-8 w-8 text-foreground" />;
      case 2:
        return <Zap className="h-8 w-8 text-foreground" />;
      default:
        return <Coins className="h-8 w-8 text-foreground" />;
    }
  };

  // Map Polar products to credit packages
  const creditProducts = [
    {
      key: "credits1000",
      product: polarProducts?.credits1000,
      credits: 1000,
      label: "1,000 Credits",
      description: "Perfect for getting started",
    },
    {
      key: "credits2500",
      product: polarProducts?.credits2500,
      credits: 2500,
      label: "2,500 Credits",
      description: "Most popular choice",
      badge: "Popular",
    },
    {
      key: "credits5000",
      product: polarProducts?.credits5000,
      credits: 5000,
      label: "5,000 Credits",
      description: "For power users",
      badge: "Save 30%",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Buy Credits</DialogTitle>
          {/* {userCredits && (
            <DialogDescription className="text-base">
              Current Balance:{" "}
              <span className="font-semibold">
                {userCredits.credits.toLocaleString()} credits
              </span>
            </DialogDescription>
          )} */}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading options...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {creditProducts?.map((item, index: number) => {
              const price = item.product?.prices?.[0]?.priceAmount
                ? (item.product.prices[0].priceAmount / 100).toFixed(2)
                : "0.00";

              return (
                <Card
                  key={item.key}
                  className={
                    item.badge === "Popular"
                      ? "border-primary shadow-lg relative"
                      : "relative"
                  }
                >
                  {item.badge && (
                    <div className="absolute top-[-16px] left-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          item.badge === "Popular"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">{getIcon(index)}</div>
                        <div className="flex flex-col">
                          <span className="text-lg">{item.label}</span>
                          <span className="text-xl font-bold">${price}</span>
                          {/* <CardDescription className="text-sm">{item.description}</CardDescription> */}
                        </div>
                      </div>
                      <div>
                        {item.product?.id ? (
                          <CheckoutLink
                            polarApi={api.lib.polar.client}
                            productIds={[item.product.id]}
                            embed={true}
                            className="w-full"
                          >
                            <Button className="w-full">Buy Now</Button>
                          </CheckoutLink>
                        ) : (
                          <Button className="w-full" disabled>
                            Unavailable
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
