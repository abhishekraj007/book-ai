import { Stack } from "expo-router";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";

export default function AuthLayout() {
  const { root, standard } = useNavigationOptions();
  return (
    <Stack>
      <Stack.Screen
        name="landing"
        options={{
          headerShown: true,
          title: "",
          ...standard,
        }}
      />
      <Stack.Screen
        name="email"
        options={{
          headerShown: false,
          presentation: "modal",
          ...root,
        }}
      />
    </Stack>
  );
}
