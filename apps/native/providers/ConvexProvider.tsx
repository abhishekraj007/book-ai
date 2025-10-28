import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import type React from "react";
import { authClient } from "@/lib/betterAuth/client";

if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
	throw new Error("EXPO_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL, {
	// Optionally pause queries until the user is authenticated
	expectAuth: true,
	unsavedChangesWarning: false,
	verbose: false, //  __DEV__,
});

export default function ConvexProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ConvexBetterAuthProvider client={convex} authClient={authClient}>
			{children}
		</ConvexBetterAuthProvider>
	);
}
