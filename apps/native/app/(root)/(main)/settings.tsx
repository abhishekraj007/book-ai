import { api, useConvexAuth, useQuery } from "@convex-starter/backend";
import {
  Button,
  Card,
  Divider,
  Spinner,
  Surface,
  useThemeColor,
} from "heroui-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import { authClient } from "@/lib/betterAuth/client";
import { useAppTheme } from "@/contexts/app-theme-context";
import {
  Moon,
  Sun,
  Trash,
  User,
  Mail,
  Calendar,
  Palette,
  Check,
} from "lucide-react-native";
import { router } from "expo-router";

type ThemeOption = {
  id: string;
  name: string;
  lightVariant: string;
  darkVariant: string;
  colors: { primary: string; secondary: string; tertiary: string };
};

const availableThemes: ThemeOption[] = [
  {
    id: "default",
    name: "Default",
    lightVariant: "light",
    darkVariant: "dark",
    colors: {
      primary: "#006FEE",
      secondary: "#17C964",
      tertiary: "#F5A524",
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    lightVariant: "lavender-light",
    darkVariant: "lavender-dark",
    colors: {
      primary: "hsl(270 50% 75%)",
      secondary: "hsl(160 40% 70%)",
      tertiary: "hsl(45 55% 75%)",
    },
  },
  {
    id: "mint",
    name: "Mint",
    lightVariant: "mint-light",
    darkVariant: "mint-dark",
    colors: {
      primary: "hsl(165 45% 70%)",
      secondary: "hsl(145 50% 68%)",
      tertiary: "hsl(55 60% 75%)",
    },
  },
  {
    id: "sky",
    name: "Sky",
    lightVariant: "sky-light",
    darkVariant: "sky-dark",
    colors: {
      primary: "hsl(200 50% 72%)",
      secondary: "hsl(175 45% 70%)",
      tertiary: "hsl(48 58% 75%)",
    },
  },
];

export default function SettingsRoute() {
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const userData = useQuery(api.user.fetchUserAndProfile);
  const { currentTheme, toggleTheme, isLight, isDark, setTheme } =
    useAppTheme();
  const foreground = useThemeColor("foreground");
  const textDanger = useThemeColor("danger-foreground");
  const muted = useThemeColor("muted");

  const getCurrentThemeId = () => {
    if (currentTheme === "light" || currentTheme === "dark") return "default";
    if (currentTheme.startsWith("lavender")) return "lavender";
    if (currentTheme.startsWith("mint")) return "mint";
    if (currentTheme.startsWith("sky")) return "sky";
    return "default";
  };

  const handleThemeSelect = (theme: ThemeOption) => {
    const variant = isLight ? theme.lightVariant : theme.darkVariant;
    setTheme(variant as any);
  };

  const { isAuthenticated } = useConvexAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(root)/(auth)");
    }
  }, [isAuthenticated]);

  const handleDeleteUser = async () => {
    const { error, data } = await authClient.deleteUser(
      {},
      {
        onRequest: () => {
          setIsDeletingUser(true);
        },
        onSuccess: () => {
          setIsDeletingUser(false);
        },
        onError: (ctx) => {
          setIsDeletingUser(false);
          console.error(ctx.error);
          Alert.alert("Error", ctx.error.message || "Failed to delete user");
        },
      }
    );
  };

  if (!userData || !userData.userMetadata) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentInsetAdjustmentBehavior="always"
        contentContainerClassName="px-4 py-4 gap-4"
      >
        {/* User Profile Section */}
        <Surface className="p-5 gap-4">
          <Text className="text-xl font-semibold text-foreground">Profile</Text>
          <Divider />

          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <User size={18} color={muted} />
              <Text className="text-base text-muted flex-1">
                {userData.profile?.name || "No name set"}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <Mail size={18} color={muted} />
              <Text className="text-base text-muted flex-1">
                {userData.userMetadata.email}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <Calendar size={18} color={muted} />
              <Text className="text-sm text-muted flex-1">
                Joined{" "}
                {new Date(userData.userMetadata.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Appearance Section */}
        <Surface className="p-5 gap-4">
          <View className="flex-row items-center gap-2">
            <Palette size={20} color={foreground} />
            <Text className="text-xl font-semibold text-foreground">
              Appearance
            </Text>
          </View>
          <Divider />

          {/* Theme Mode Toggle */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-muted">Theme Mode</Text>
            <View className="flex-row gap-3">
              <Button
                variant="primary"
                onPress={toggleTheme}
                className="flex-1 flex-row items-center justify-center gap-2 "
                // style={{ backgroundColor: colors.surface }}
              >
                {isLight ? (
                  <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
                    <Sun size={20} color={"white"} />
                  </Animated.View>
                ) : (
                  <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
                    <Moon size={20} color={"white"} />
                  </Animated.View>
                )}
                <Text className="text-white text-base font-medium">
                  {currentTheme === "light" ? "Light" : "Dark"}
                </Text>
              </Button>
            </View>
          </View>

          {/* Theme Selection */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-muted">Color Theme</Text>
            <View className="px-5 py-8 bg-overlay">
              <View className="flex-row justify-around">
                {availableThemes.map((theme) => (
                  <ThemeCircle
                    key={theme.id}
                    theme={theme}
                    isActive={getCurrentThemeId() === theme.id}
                    onPress={() => handleThemeSelect(theme)}
                  />
                ))}
              </View>
            </View>
          </View>
        </Surface>
        <SignOutButton />

        {/* Danger Zone */}
        <Surface className="p-5 gap-4">
          <Text className="text-xl font-semibold text-danger">Danger Zone</Text>
          <Divider />

          <View className="gap-3">
            <Text className="text-sm text-muted">
              Once you delete your account, there is no going back. Please be
              certain.
            </Text>

            <Button
              variant="destructive"
              size="md"
              isDisabled={isDeletingUser}
              onPress={() => {
                Alert.alert(
                  "Delete Account",
                  "Are you sure you want to permanently delete your account? This action cannot be undone.",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: handleDeleteUser,
                    },
                  ]
                );
              }}
            >
              <Trash size={18} color={textDanger} />
              <Text className="text-danger-foreground font-medium">
                {isDeletingUser ? "Deleting..." : "Delete Account"}
              </Text>
              {isDeletingUser && <Spinner size="sm" />}
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}

const SignOutButton = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    const { error, data } = await authClient.signOut(
      {},
      {
        onRequest: () => {
          setIsSigningOut(true);
        },
        onSuccess: () => {
          setIsSigningOut(false);
          console.log("Sign out successful");
        },
        onError: (ctx) => {
          console.error(ctx.error);
          Alert.alert("Error", ctx.error.message || "Failed to sign out");
          setIsSigningOut(false);
        },
      }
    );

    console.log(data, error);
  };

  return (
    <Button
      //  color="primary"
      variant="tertiary"
      isDisabled={isSigningOut}
      onPress={() => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Sign Out",
            onPress: async () => {
              await handleSignOut();
            },
          },
        ]);
      }}
    >
      {/* <Text className="text-foreground"> */}
      Sign Out
      {/* </Text> */}
    </Button>
  );
};

const ThemeCircle: React.FC<{
  theme: ThemeOption;
  isActive: boolean;
  onPress: () => void;
}> = ({ theme, isActive, onPress }) => {
  const themeColorAccent = useThemeColor("accent");

  return (
    <Pressable onPress={onPress} className="items-center">
      <View style={{ position: "relative", padding: 4 }}>
        {/* Active ring */}
        {isActive && (
          <View
            style={{
              position: "absolute",
              width: 68,
              height: 68,
              borderRadius: 34,
              borderWidth: 2,
              borderColor: themeColorAccent,
              top: 0,
              left: 0,
            }}
          />
        )}
        {/* Theme circle */}
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* First section - 50% */}
          <View
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backgroundColor: theme.colors.primary,
            }}
          />

          {/* Second section - 25% */}
          <View
            style={{
              position: "absolute",
              width: "100%",
              height: "50%",
              backgroundColor: theme.colors.secondary,
              bottom: 0,
            }}
          />

          {/* Third section - 25% */}
          <View
            style={{
              position: "absolute",
              width: "50%",
              height: "50%",
              backgroundColor: theme.colors.tertiary,
              bottom: 0,
              right: 0,
            }}
          />
        </View>
      </View>
      <Text className="text-xs mt-2 text-foreground font-medium">
        {theme.name}
      </Text>
    </Pressable>
  );
};
