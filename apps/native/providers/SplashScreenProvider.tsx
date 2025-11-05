import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";

import { useConvexAuth } from "convex/react";
import * as SplashScreen from "expo-splash-screen";
import type React from "react";
import { useEffect } from "react";
import { delay } from "@/utils/delay";

/**
 * NOTE
 * there could be an amazing preloader to be done here
 * wait for all fetches like
 * first feed
 * all your messages,
 * then profile
 *
 * airbnb takes like several seconds, so you could take advantage?
 */

SplashScreen.preventAutoHideAsync();

/**
 * NOTE
 * options cannot be set in Expo Go
 */
SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

export default function SplashScreenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: isAuthLoading } = useConvexAuth();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (fontError) {
    throw fontError;
  }

  useEffect(() => {
    if (isAuthLoading || !fontsLoaded) {
      return;
    }
    /**
     * i just like to wait until auth is loaded
     */
    delay(350).then(() => {
      SplashScreen.hideAsync();
    });
  }, [isAuthLoading, fontsLoaded]);

  return <>{children}</>;
}
