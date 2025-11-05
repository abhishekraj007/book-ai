import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, useThemeColor } from "heroui-native";
import { Pressable, Text, View } from "react-native";
import { Crown, Coins, Settings } from "lucide-react-native";
import { useConvexAuth, useQuery } from "convex/react";
import { usePurchases } from "@/contexts/purchases-context";
import { api } from "@convex-starter/backend";

export const Header = () => {
  const foregroundColor = useThemeColor("foreground");
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const { presentPaywall } = usePurchases();
  const userData = useQuery(api.user.fetchUserAndProfile);

  return (
    <View className="flex-row items-center justify-between px-4">
      <View>
        <Text className="text-foreground">Logo</Text>
      </View>

      <View className="flex-row items-center justify-between gap-2">
        {isAuthenticated ? (
          <>
            <Button
              variant="tertiary"
              size="sm"
              className="rounded-full bg-pink-500"
              onPress={presentPaywall}
            >
              <Crown size={16} color={foregroundColor} />
            </Button>

            <Button
              variant="primary"
              size="sm"
              onPress={() => {
                router.push("/buy-credits");
              }}
            >
              <Coins size={16} color={foregroundColor} />
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
              <Settings size={16} color={foregroundColor} />
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
    </View>
  );
};
