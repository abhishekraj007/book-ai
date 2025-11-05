import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useNavigationContainerRef } from "expo-router";
import { Button } from "heroui-native";
import { Pressable } from "react-native";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";
import { X } from "lucide-react-native";

export default function AuthLayout() {
  const { standard } = useNavigationOptions();
  const router = useRouter();
  // const { colors } = useTheme();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(root)/(main)");
    }
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: "",
          presentation: "modal",
          ...standard,
          headerRight: () => (
            <Button
              variant="tertiary"
              size="sm"
              isIconOnly
              onPress={handleClose}
              style={{
                // borderRadius: "100%",
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
            >
              <X size={16} color={"white"} />
            </Button>
          ),
        }}
      />
    </Stack>
  );
}
