"use client";

import AuthScreen from "@/components/auth-screen";
import UserMenu from "@/components/user-menu";
import { api } from "@convex-starter/backend/convex/_generated/api";
import {
	Authenticated,
	AuthLoading,
	Unauthenticated,
	useQuery,
} from "convex/react";

export default function DashboardPage() {
	const privateData = useQuery(api.privateData.get);

	return (
		<>
			<Authenticated>
				<div className="container mx-auto p-8">
					<h1 className="text-4xl font-bold mb-4">Dashboard</h1>
					<p className="text-muted-foreground mb-6">
						privateData: {privateData?.message}
					</p>
					<UserMenu />
				</div>
			</Authenticated>
			<Unauthenticated>
				<AuthScreen />
			</Unauthenticated>
			<AuthLoading>
				<div className="flex min-h-screen items-center justify-center">
					<div className="text-center">
						<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
						<p className="mt-4 text-muted-foreground">Loading...</p>
					</div>
				</div>
			</AuthLoading>
		</>
	);
}
