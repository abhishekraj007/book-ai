"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";

export default function AuthScreen() {
	const [isSignIn, setIsSignIn] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/dashboard",
			});
		} catch (error) {
			toast.error("Failed to sign in with Google");
			setIsLoading(false);
		}
	};

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "" as string | undefined,
		},
		onSubmit: async ({ value }) => {
			if (isSignIn) {
				await authClient.signIn.email(
					{
						email: value.email,
						password: value.password,
					},
					{
						onSuccess: () => {
							router.push("/dashboard");
							toast.success("Welcome back!");
						},
						onError: (error) => {
							toast.error(error.error.message || "Failed to sign in");
						},
					},
				);
			} else {
				await authClient.signUp.email(
					{
						email: value.email,
						password: value.password,
						name: value.name || "",
					},
					{
						onSuccess: () => {
							router.push("/dashboard");
							toast.success("Account created successfully!");
						},
						onError: (error) => {
							toast.error(error.error.message || "Failed to create account");
						},
					},
				);
			}
		},
		validators: {
			onSubmit: z.object({
				email: z.string().email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
				name: isSignIn
					? z.string().optional()
					: z.string().min(2, "Name must be at least 2 characters"),
			}),
		},
	});

	return (
		<div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1 text-center">
					<CardTitle className="text-3xl font-bold tracking-tight">
						{isSignIn ? "Welcome back" : "Create an account"}
					</CardTitle>
					<CardDescription>
						{isSignIn
							? "Sign in to your account to continue"
							: "Get started with your new account"}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<Button
							variant="outline"
							onClick={handleGoogleSignIn}
							disabled={isLoading}
							className="w-full"
						>
							<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="currentColor"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="currentColor"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="currentColor"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Google
						</Button>
						<Button
							variant="outline"
							onClick={() => toast.info("Apple sign-in coming soon")}
							disabled={isLoading}
							className="w-full"
						>
							<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
								<path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
							</svg>
							Apple
						</Button>
					</div>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<Separator />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">
								Or continue with
							</span>
						</div>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						{!isSignIn && (
							<form.Field name="name">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Name</Label>
										<Input
											id={field.name}
											name={field.name}
											type="text"
											placeholder="John Doe"
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive">
												{String(field.state.meta.errors[0])}
											</p>
										)}
									</div>
								)}
							</form.Field>
						)}

						<form.Field name="email">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Email</Label>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										placeholder="name@example.com"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{String(field.state.meta.errors[0])}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="password">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Password</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										placeholder="••••••••"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{String(field.state.meta.errors[0])}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Subscribe>
							{(state) => (
								<Button
									type="submit"
									className="w-full"
									disabled={!state.canSubmit || state.isSubmitting}
								>
									{state.isSubmitting
										? "Loading..."
										: isSignIn
										? "Sign In"
										: "Create Account"}
								</Button>
							)}
						</form.Subscribe>
					</form>

					<div className="text-center text-sm">
						<button
							type="button"
							onClick={() => {
								setIsSignIn(!isSignIn);
								form.reset();
							}}
							className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
						>
							{isSignIn
								? "Don't have an account? Sign up"
								: "Already have an account? Sign in"}
						</button>
					</div>

					<p className="px-8 text-center text-xs text-muted-foreground">
						By continuing, you agree to our{" "}
						<a
							href="/terms"
							className="underline underline-offset-4 hover:text-foreground"
						>
							Terms of Service
						</a>{" "}
						and{" "}
						<a
							href="/privacy"
							className="underline underline-offset-4 hover:text-foreground"
						>
							Privacy Policy
						</a>
						.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
