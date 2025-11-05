import { Stack } from "expo-router";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";
import { useAppTheme } from "@/contexts/app-theme-context";

export default function MainLayout() {
  const { standard } = useNavigationOptions();
  const { isDark } = useAppTheme();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          ...standard,
          title: "Home",
          headerTitle: "",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="buy-credits"
        options={{
          title: "",
          presentation: "modal",
          headerTitle: "",
          headerBackTitle: "Back",
          // headerShown: false,
          ...standard,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "",
          presentation: "modal",
          headerBackButtonDisplayMode: "generic",
          headerBlurEffect: isDark ? "dark" : "light",
          headerBackTitle: "Back",
          // animation: "fade",
          // headerShown: false,
          ...standard,
        }}
      />
    </Stack>
  );
}
