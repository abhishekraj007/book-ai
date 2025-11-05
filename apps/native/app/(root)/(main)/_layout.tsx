import { Stack } from "expo-router";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";
import { Header } from "@/components";
import { useThemeColor } from "heroui-native";

export default function MainLayout() {
  const { standard } = useNavigationOptions();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          ...standard,
          title: "Home",
          headerTitle: "",
          headerShown: false,
          // headerRight: () => <Header />,
        }}
      />
      <Stack.Screen
        name="buy-credits"
        options={{
          title: "",
          presentation: "modal",
          headerTitle: "",
          headerBackTitle: "Back",
          headerShown: false,
          ...standard,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          presentation: "modal",
          headerBackButtonDisplayMode: "generic",
          headerShown: false,
          ...standard,
        }}
      />
    </Stack>
  );
}
