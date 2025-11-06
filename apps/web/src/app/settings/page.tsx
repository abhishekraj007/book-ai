"use client";

import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Calendar,
  Trash2,
  LogOut,
  Crown,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const router = useRouter();
  const userData = useQuery(api.user.fetchUserAndProfile);
  const premiumStatus = useQuery(api.features.premium.queries.isPremium);
  const subscriptions = useQuery(
    api.features.subscriptions.queries.getUserSubscriptions
  );
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const customerId = subscriptions?.subscriptions?.[0]?.platformCustomerId;

  // Check if user has a canceled subscription
  const hasCanceledSubscription = subscriptions?.subscriptions?.some(
    (sub) => sub.status === "canceled" && sub.canceledAt
  );

  const goToPortal = async () => {
    // find the customer id associated with this user
    if (!customerId) {
      console.error("No customer ID found");
      return;
    }
    router.push(`/portal?userId=${customerId}` as any);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
        onError: (ctx) => {
          console.error("Sign out error:", ctx.error);
          setIsSigningOut(false);
        },
      },
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    await authClient.deleteUser({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
        onError: (ctx) => {
          console.error("Delete account error:", ctx.error);
          alert(ctx.error.message || "Failed to delete account");
          setIsDeletingAccount(false);
        },
      },
    });
  };

  if (!userData || !userData.userMetadata) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userName =
    userData.profile?.name || userData.userMetadata?.name || "User";
  const userEmail = userData.userMetadata.email;
  const joinedDate = new Date(
    userData.userMetadata.createdAt
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Profile Information</CardTitle>
              {premiumStatus?.isPremium && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium">
                  <Crown className="h-3 w-3" />
                  Premium
                </span>
              )}
            </div>
            <CardDescription>
              Your personal information and account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">{userName}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">{joinedDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription & Billing Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Subscription & Billing</CardTitle>
            </div>
            <CardDescription>
              Manage your subscription and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {premiumStatus?.isPremium ? (
              <>
                <div className="flex items-start justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-primary" />
                      <p className="font-medium text-sm">Premium Member</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You have an active premium subscription
                    </p>
                    {subscriptions?.subscriptions?.[0] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Platform:{" "}
                        {subscriptions.subscriptions[0].platform === "polar"
                          ? "Web"
                          : "Mobile"}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={goToPortal}
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Manage Subscription
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            ) : hasCanceledSubscription ? (
              <>
                <div className="flex items-start justify-between p-4 rounded-lg bg-muted border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">
                      Subscription Canceled
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your subscription has been canceled but you still have
                      access until the end of your billing period
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={goToPortal}
                >
                  <span className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Manage Subscription
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between p-4 rounded-lg bg-muted">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">Free Plan</p>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Premium for unlimited access and exclusive
                      features
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full justify-between"
                  onClick={() => router.push("/pricing" as any)}
                >
                  <span className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Upgrade to Premium
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Actions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your account and session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    disabled={isDeletingAccount}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeletingAccount ? "Deleting..." : "Delete Account"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        const dialog = (e.target as HTMLElement).closest(
                          '[role="dialog"]'
                        );
                        const trigger = document.querySelector(
                          '[data-state="open"]'
                        );
                        if (trigger) (trigger as HTMLElement).click();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      Delete Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
