import { isLiquidGlassAvailable } from "expo-glass-effect";
import { useAppTheme } from "@/contexts/app-theme-context";
import { useConvexAuth } from "convex/react";
import { Stack } from "expo-router";
import { useThemeColor } from "heroui-native";
import { Platform } from "react-native";

export const unstable_settings = {
  initialRouteName: "(main)",
};

export default function RootLayout() {
  const { isAuthenticated } = useConvexAuth();
  const { isDark } = useAppTheme();
  const themeColorForeground = useThemeColor("foreground");
  const themeColorBackground = useThemeColor("background");

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: "center",
        headerTransparent: true,
        headerBlurEffect: isDark ? "dark" : "light",
        headerTintColor: themeColorForeground,
        headerStyle: {
          backgroundColor: Platform.select({
            ios: undefined,
            android: themeColorBackground,
          }),
        },
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
        },
        // headerRight: _renderThemeToggle,
        headerBackButtonDisplayMode: "generic",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
        contentStyle: {
          backgroundColor: themeColorBackground,
        },
      }}
    >
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack.Protected>
      <Stack.Screen
        name="(main)"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
