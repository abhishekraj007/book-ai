import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  TouchableOpacity,
  StatusBar,
  Text,
} from "react-native";
import { authClient } from "@/lib/auth-client";
import { Button, TextField, Divider, Spinner, useTheme } from "heroui-native";
import { Header } from "@/components/header";
import { useColorScheme } from "@/lib/use-color-scheme";
import { Eye, EyeOff, Chrome, Apple } from "lucide-react-native";
import { Container } from "../container";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkColorScheme } = useColorScheme();
  const { colors } = useTheme();

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onError: (error) => {
          setError(error.error?.message || "Failed to sign in");
          setIsLoading(false);
        },
        onSuccess: () => {
          setEmail("");
          setPassword("");
        },
        onFinished: () => {
          setIsLoading(false);
        },
      }
    );
  };

  const handleGoogleSignIn = async () => {
    const data = await authClient.signIn.social({
      provider: "google",
    });
    console.log("Google Sign-In clicked", JSON.stringify(data, null, 2));
  };

  const handleAppleSignIn = async () => {
    const data = await authClient.signIn.social({
      provider: "apple",
    });
    console.log("Apple Sign-In clicked", JSON.stringify(data, null, 2));
  };

  return (
    <Container>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
      />
      <Header />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 py-12 justify-center gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground text-center">
              Welcome Back
            </Text>
            <Text className="text-base text-foreground/70 text-center">
              Sign in to continue to your account
            </Text>
          </View>

          {/* Social Login Buttons */}
          <View className="gap-3">
            <Button
              variant="secondary"
              size="lg"
              onPress={handleGoogleSignIn}
              isDisabled={isLoading}
            >
              <Chrome size={20} color={colors.accentSoftForeground} />
              <Button.Label>Continue with Google</Button.Label>
            </Button>

            {Platform.OS === "ios" && (
              <Button
                variant="secondary"
                size="lg"
                onPress={handleAppleSignIn}
                isDisabled={isLoading}
              >
                <Apple size={20} color={colors.accentSoftForeground} />
                <Button.Label>Continue with Apple</Button.Label>
              </Button>
            )}
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center gap-1 px-4 flex-wrap">
            <Text className="text-sm text-foreground/70">
              By signing in, you agree to our
            </Text>
            <Text className="text-sm text-accent font-medium">
              Terms of Service
            </Text>
            <Text className="text-sm text-foreground/70">and</Text>
            <Text className="text-sm text-accent font-medium">
              Privacy Policy
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
