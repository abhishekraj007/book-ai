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
	const creditProducts = useQuery(api.features.credits.queries.getCreditProducts);
	const userCredits = useQuery(api.features.credits.queries.getUserCredits);

	const isLoading = creditProducts === undefined || userCredits === undefined;

	const getIcon = (index: number) => {
		switch (index) {
			case 0:
				return <Coins className="h-8 w-8 text-blue-500" />;
			case 1:
				return <Sparkles className="h-8 w-8 text-purple-500" />;
			case 2:
				return <Zap className="h-8 w-8 text-yellow-500" />;
			default:
				return <Coins className="h-8 w-8 text-blue-500" />;
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">Buy Credits</DialogTitle>
					<DialogDescription>
						{userCredits && (
							<span className="text-lg font-semibold">
								Current Balance: {userCredits.credits.toLocaleString()} credits
							</span>
						)}
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="text-center">
							<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
							<p className="mt-4 text-muted-foreground">Loading options...</p>
						</div>
					</div>
				) : (
					<div className="grid md:grid-cols-3 gap-4 py-4">
						{creditProducts?.map((product: any, index: number) => (
							<Card
								key={product.key}
								className={
									product.badge === "Popular"
										? "border-primary shadow-lg relative"
										: "relative"
								}
							>
								{product.badge && (
									<div className="absolute top-0 right-4">
										<span
											className={`px-3 py-1 rounded-b-lg text-xs font-semibold ${
												product.badge === "Popular"
													? "bg-primary text-primary-foreground"
													: "bg-green-500 text-white"
											}`}
										>
											{product.badge}
										</span>
									</div>
								)}
								<CardHeader className="text-center">
									<div className="flex justify-center mb-2">{getIcon(index)}</div>
									<CardTitle className="text-xl">{product.label}</CardTitle>
									<CardDescription>{product.description}</CardDescription>
								</CardHeader>
								<CardContent className="text-center">
									<div className="mb-4">
										<span className="text-3xl font-bold">${product.price}</span>
									</div>
									<p className="text-sm text-muted-foreground">
										{product.credits.toLocaleString()} credits
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										${(product.price / product.credits * 1000).toFixed(2)} per 1000 credits
									</p>
								</CardContent>
								<CardFooter>
									{product.productId ? (
										<CheckoutLink
											polarApi={api.lib.polar.client}
											productIds={[product.productId]}
											embed={true}
											className="w-full"
										>
											<Button className="w-full">Buy Now</Button>
										</CheckoutLink>
									) : (
										<Button className="w-full" disabled>
											Not Available
										</Button>
									)}
								</CardFooter>
							</Card>
						))}
					</div>
				)}

				<div className="mt-4 text-center text-sm text-muted-foreground">
					<p>Credits never expire and can be used for any service</p>
					<p className="mt-1">
						Premium members get unlimited credits with their subscription
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
