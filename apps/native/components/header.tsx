import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, useTheme } from "heroui-native";
import { Pressable, Text, View } from "react-native";
import { Crown, Coins } from "lucide-react-native";
import { useConvexAuth, useQuery } from "convex/react";
import { usePurchases } from "@/contexts/purchases-context";
import { api } from "@convex-starter/backend";

export const Header = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const { presentPaywall } = usePurchases();
  const userData = useQuery(api.user.fetchUserAndProfile);

  return (
    <View className="flex-row items-center gap-2">
      {isAuthenticated ? (
        <>
          <Button
            variant="tertiary"
            size="sm"
            className="rounded-full bg-pink-500"
            onPress={presentPaywall}
          >
            <Crown size={16} color={colors.accent} />
          </Button>

          <Button
            variant="tertiary"
            size="sm"
            onPress={() => {
              router.push("/buy-credits");
            }}
          >
            <Coins size={16} color={colors.foreground} />
            <Text className="text-foreground font-medium">
              {userData?.profile?.credits}
            </Text>
          </Button>

          <Button
            variant="tertiary"
            size="sm"
            className="rounded-full"
            onPress={() => {
              router.navigate("/settings");
            }}
          >
            <Ionicons
              name="settings-outline"
              size={16}
              color={colors.foreground}
            />
          </Button>
        </>
      ) : (
        <Button
          variant="tertiary"
          size="sm"
          onPress={() => {
            router.push("/(root)/(auth)");
          }}
        >
          <Text className="text-foreground font-medium">Sign In</Text>
        </Button>
      )}
    </View>
  );
};
