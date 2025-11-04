import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, useTheme } from "heroui-native";
import { Text, View, ActivityIndicator, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import { useAppleAuth, useGoogleAuth } from "@/lib/betterAuth/oauth";

export default function Landing() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { signIn: signInWithGoogle, isLoading: isGoogleLoading } =
    useGoogleAuth();
  const { signIn: signInWithApple, isLoading: isAppleLoading } = useAppleAuth();

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    await signInWithGoogle();
  };

  const handleAppleSignIn = async () => {
    setIsSigningIn(true);
    await signInWithApple();
  };

  useEffect(() => {
    // Redirect to main after successful authentication
    if (isAuthenticated && isSigningIn) {
      router.replace("/(root)/(main)");
    }
  }, [isAuthenticated, isSigningIn]);

  const isLoading = isGoogleLoading || isAppleLoading || isSigningIn;

  return (
    <>
      <ImageBackground
        source={require("@/assets/images/login-bg.jpeg")}
        style={{ flex: 1 }}
        resizeMode="cover"
        blurRadius={8}
      >
        {/* Dark overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
        />

        <SafeAreaView className="flex-1 gap-4 px-8">
          <View className="flex-1 justify-end">
            <Text className="font-extrabold text-6xl text-foreground">
              StatusAI
            </Text>
            <Text className="text-muted-foreground text-lg">
              Sign in to get started
            </Text>
          </View>
          <View className="w-full flex-row gap-4">
            {/* google */}
            <Button
              className="flex-1 overflow-hidden rounded-full"
              variant="tertiary"
              onPress={handleGoogleSignIn}
              isDisabled={isLoading}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color={colors.defaultForeground}
              />
              <Text className="text-foreground">Google</Text>
            </Button>
            {/* apple */}
            <Button
              className="flex-1 overflow-hidden rounded-full"
              variant="tertiary"
              onPress={handleAppleSignIn}
              isDisabled={isLoading}
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
      </ImageBackground>

      {/* Loading overlay */}
      {isLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </>
  );
}
