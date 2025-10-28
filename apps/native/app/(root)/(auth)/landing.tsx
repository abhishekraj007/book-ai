import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Button, useTheme } from "heroui-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppleAuth, useGoogleAuth } from "@/lib/betterAuth/oauth";
import { Header } from "@/components";

export default function Landing() {
  const { colors } = useTheme();
  const { signIn: signInWithGoogle, isLoading: isGoogleLoading } =
    useGoogleAuth();
  const { signIn: signInWithApple, isLoading: isAppleLoading } = useAppleAuth();
  return (
    <SafeAreaView className="flex-1 gap-4 px-8">
      <View className="flex-1 justify-end">
        <Text className="font-extrabold text-6xl text-foreground">Quotes</Text>
        <Text className="text-muted-foreground text-lg">
          Sign in to get started
        </Text>
      </View>
      <View className="w-full flex-row gap-4">
        {/* google */}
        <Button
          className="flex-1 overflow-hidden rounded-full"
          //   size="lg"
          variant="tertiary"
          onPress={signInWithGoogle}
          isDisabled={isGoogleLoading || isAppleLoading}
        >
          <Ionicons
            name="logo-google"
            size={20}
            color={colors.defaultForeground}
          />
          <Text className="text-foreground">Google</Text>
          {/* <Button>
            <Ionicons
              name="logo-google"
              size={20}
              color={colors.defaultForeground}
            />
          </Button>
          <Button>Google</Button> */}
        </Button>
        {/* apple */}
        <Button
          className="flex-1 overflow-hidden rounded-full"
          //   size="lg"
          variant="tertiary"
          onPress={signInWithApple}
          isDisabled={isGoogleLoading || isAppleLoading}
        >
          <Ionicons
            name="logo-apple"
            size={20}
            color={colors.defaultForeground}
          />
          <Text className="text-foreground">Apple</Text>
        </Button>
      </View>
      <View className="justify-center gap-1 flex-row flex-wrap items-center ">
        <Text className="text-muted-foreground text-sm">
          By signing in, you agree to our
        </Text>
        <Text className="text-foreground text-xs">terms of service</Text>
        <Text className="text-muted-foreground text-sm">and</Text>
        <Text className="text-foreground text-xs">privacy policy</Text>
      </View>
    </SafeAreaView>
  );
}
