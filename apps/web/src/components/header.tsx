"use client";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { CreditsModal } from "./credits-modal";
import { Coins, Menu } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

export default function Header() {
  const router = useRouter();
  const userData = useQuery(api.user.fetchUserAndProfile);
  const userCredits = useQuery(api.features.credits.queries.getUserCredits);
  const premiumStatus = useQuery(api.features.premium.queries.isPremium);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/todos", label: "Todos" },
    { to: "/pricing", label: "Pricing" },
    { to: "/components", label: "Components" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-3 border-b border-border">
        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 px-4">
                {links.map(({ to, label }) => (
                  <Link
                    key={to}
                    href={to}
                    className="text-lg hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            {links.map(({ to, label }) => {
              return (
                <Link
                  key={to}
                  href={to}
                  className="hover:text-primary transition-colors"
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          {userData && (
            <>
              {!premiumStatus?.isPremium && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push("/pricing")}
                  className="hidden sm:flex"
                >
                  Upgrade
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreditsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Coins className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {userCredits?.credits !== undefined
                    ? userCredits.credits.toLocaleString()
                    : "..."}
                </span>
                <span className="sm:hidden">
                  {userCredits?.credits !== undefined
                    ? userCredits.credits
                    : "..."}
                </span>
              </Button>
            </>
          )}
          {userData ? (
            <UserMenu isPremium={premiumStatus?.isPremium ?? false} />
          ) : (
            <Button onClick={() => router.push("/auth")} size="sm">
              Login
            </Button>
          )}
        </div>
      </div>
      <CreditsModal
        open={creditsModalOpen}
        onOpenChange={setCreditsModalOpen}
      />
    </div>
  );
}
