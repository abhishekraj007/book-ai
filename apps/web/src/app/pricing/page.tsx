"use client";

import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";
import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";
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

export default function PricingPage() {
	const products = useQuery(api.lib.polar.products.getConfiguredProducts);
	const userData = useQuery(api.lib.polar.products.getCurrentUserWithSubscription);
	const userSubscriptions = useQuery(api.features.subscriptions.queries.getUserSubscriptions);
	const canPurchase = useQuery(api.features.subscriptions.queries.canPurchaseSubscription, {
		platform: "polar",
	});

	const isLoading = products === undefined || userData === undefined || userSubscriptions === undefined;

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

	const proMonthly = products?.proMonthly;
	const proYearly = products?.proYearly;

	const monthlyPrice = proMonthly?.prices[0]?.priceAmount
		? (proMonthly.prices[0].priceAmount / 100).toFixed(2)
		: "9.99";
	const yearlyPrice = proYearly?.prices[0]?.priceAmount
		? (proYearly.prices[0].priceAmount / 100).toFixed(2)
		: "99.99";
	const yearlyMonthlyEquivalent = (parseFloat(yearlyPrice) / 12).toFixed(2);

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
				{userSubscriptions?.hasActiveSubscription && (
					<div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
						<p className="text-blue-800 dark:text-blue-200">
							You already have an active subscription on{" "}
							{userSubscriptions.hasWebSubscription ? "web" : "mobile"}. You can
							only purchase credits or manage your existing subscription.
						</p>
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
									<Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
									<span className="text-sm">{feature}</span>
								</li>
							))}
						</ul>
					</CardContent>
					<CardFooter>
						{userData?.isFree ? (
							<Button className="w-full" variant="outline" disabled>
								Current Plan
							</Button>
						) : (
							<Button className="w-full" variant="outline" disabled>
								Downgrade (Contact Support)
							</Button>
						)}
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
							<span className="text-4xl font-bold">${monthlyPrice}</span>
							<span className="text-muted-foreground">/month</span>
						</div>
						<ul className="space-y-3">
							{features.pro.map((feature, index) => (
								<li key={index} className="flex items-start gap-2">
									<Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
									<span className="text-sm">{feature}</span>
								</li>
							))}
						</ul>
					</CardContent>
					<CardFooter>
						{userData?.subscription?.productKey === "proMonthly" ? (
							<CustomerPortalLink
								polarApi={{
									generateCustomerPortalUrl:
										api.lib.polar.client.generateCustomerPortalUrl,
								}}
								className="w-full"
							>
								<Button className="w-full">Manage Subscription</Button>
							</CustomerPortalLink>
						) : userData?.isPro ? (
							<Button className="w-full" variant="outline">
								Switch to Monthly
							</Button>
						) : canPurchase?.canPurchase === false ? (
							<Button className="w-full" disabled>
								Already Subscribed
							</Button>
						) : (
							<CheckoutLink
								polarApi={api.lib.polar.client}
								productIds={proMonthly ? [proMonthly.id] : []}
								embed={true}
							>
								<Button className="w-full">Get Started</Button>
							</CheckoutLink>
						)}
					</CardFooter>
				</Card>

				{/* Yearly Pro */}
				<Card className="relative">
					<div className="absolute top-0 right-4">
						<span className="bg-green-500 text-white px-3 py-1 rounded-b-lg text-xs font-semibold">
							Save 17%
						</span>
					</div>
					<CardHeader>
						<CardTitle className="text-2xl">Pro Yearly</CardTitle>
						<CardDescription>Best value for committed users</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="mb-2">
							<span className="text-4xl font-bold">${yearlyPrice}</span>
							<span className="text-muted-foreground">/year</span>
						</div>
						<p className="text-sm text-muted-foreground mb-6">
							${yearlyMonthlyEquivalent}/month billed annually
						</p>
						<ul className="space-y-3">
							{features.pro.map((feature, index) => (
								<li key={index} className="flex items-start gap-2">
									<Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
									<span className="text-sm">{feature}</span>
								</li>
							))}
						</ul>
					</CardContent>
					<CardFooter>
						{userData?.subscription?.productKey === "proYearly" ? (
							<CustomerPortalLink
								polarApi={{
									generateCustomerPortalUrl:
										api.lib.polar.client.generateCustomerPortalUrl,
								}}
								className="w-full"
							>
								<Button className="w-full">Manage Subscription</Button>
							</CustomerPortalLink>
						) : userData?.isPro ? (
							<Button className="w-full" variant="outline">
								Switch to Yearly
							</Button>
						) : canPurchase?.canPurchase === false ? (
							<Button className="w-full" disabled>
								Already Subscribed
							</Button>
						) : (
							<CheckoutLink
								polarApi={api.lib.polar.client}
								productIds={proYearly ? [proYearly.id] : []}
								embed={true}
							>
								<Button className="w-full">Get Started</Button>
							</CheckoutLink>
						)}
					</CardFooter>
				</Card>
			</div>

			{/* FAQ or Additional Info */}
			<div className="mt-16 text-center">
				<p className="text-muted-foreground">
					All plans include a 14-day money-back guarantee. Cancel anytime.
				</p>
			</div>
		</div>
	);
}
