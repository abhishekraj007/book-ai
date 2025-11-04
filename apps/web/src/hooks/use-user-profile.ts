"use client";

import { useQuery } from "convex/react";
import { api } from "@convex-starter/backend/convex/_generated/api";

export function useUserProfile() {
  const profile = useQuery(api.user.fetchUserAndProfile);

  return {
    profile: profile?.profile,
    user: profile?.userMetadata,
    isPremium: profile?.profile?.isPremium || false,
    credits: profile?.profile?.credits || 0,
    premiumGrantedBy: profile?.profile?.premiumGrantedBy,
    loading: profile === undefined,
  };
}
