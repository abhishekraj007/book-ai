import { Stack } from "expo-router";
import { Alert, Pressable, Text } from "react-native";
import { useState } from "react";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";
import { authClient } from "@/lib/betterAuth/client";
import { Header } from "@/components";

export default function MainLayout() {
  const { standard } = useNavigationOptions();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Home",
          headerLargeTitle: true,
          headerBackTitle: "Home",
          ...standard,
          headerRight: () => <Header />,
        }}
      />
      <Stack.Screen
        name="buy-credits"
        options={{
          title: "",
          presentation: "modal",
          headerTitle: "",
          headerBackTitle: "Back",
          ...standard,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          presentation: "modal",
          headerBackButtonDisplayMode: "generic",
          headerLargeTitle: true,
          ...standard,
        }}
      />
    </Stack>
  );
}
