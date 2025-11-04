import { useConvexAuth } from "convex/react";
import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(main)",
};

export default function RootLayout() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <Stack>
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
