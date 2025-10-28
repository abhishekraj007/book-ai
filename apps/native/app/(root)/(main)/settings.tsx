import { api, useQuery } from "@convex-starter/backend";
import {
  Button,
  Card,
  Divider,
  Spinner,
  Surface,
  useTheme,
} from "heroui-native";
import { useState } from "react";
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

export default function SettingsRoute() {
  const { colors, theme, toggleTheme } = useTheme();
  const { currentThemeId, setThemeById, availableThemes } = useAppTheme();
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const userData = useQuery(api.user.fetchUserAndProfile);

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
    <View className="flex-1">
      <ScrollView
        contentInsetAdjustmentBehavior="always"
        contentContainerClassName="px-6 py-6 gap-6"
      >
        {/* User Profile Section */}
        <Surface className="p-5 gap-4">
          <Text className="text-xl font-semibold text-foreground">Profile</Text>
          <Divider />

          <View className="gap-3">
            <View className="flex-row items-center gap-3">
              <User size={18} color={colors.mutedForeground} />
              <Text className="text-base text-foreground flex-1">
                {userData.profile?.name || "No name set"}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <Mail size={18} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground flex-1">
                {userData.userMetadata.email}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <Calendar size={18} color={colors.mutedForeground} />
              <Text className="text-sm text-muted-foreground flex-1">
                Joined{" "}
                {new Date(userData.userMetadata.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Appearance Section */}
        <Surface className="p-5 gap-4">
          <View className="flex-row items-center gap-2">
            <Palette size={20} color={colors.foreground} />
            <Text className="text-xl font-semibold text-foreground">
              Appearance
            </Text>
          </View>
          <Divider />

          {/* Theme Mode Toggle */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-muted-foreground">
              Theme Mode
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={toggleTheme}
                className="flex-1 flex-row items-center justify-center gap-2 p-4 rounded-xl"
                style={{ backgroundColor: colors.surface }}
              >
                {theme === "light" ? (
                  <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
                    <Sun size={20} color={colors.foreground} />
                  </Animated.View>
                ) : (
                  <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
                    <Moon size={20} color={colors.foreground} />
                  </Animated.View>
                )}
                <Text className="text-base font-medium text-foreground">
                  {theme === "light" ? "Light" : "Dark"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Theme Selection */}
          <View className="gap-2">
            <Text className="text-sm font-medium text-muted-foreground">
              Color Theme
            </Text>
            <View className="gap-2">
              {availableThemes.map((themeOption) => (
                <Pressable
                  key={themeOption.id}
                  onPress={() => setThemeById(themeOption.id)}
                  className="flex-row items-center justify-between p-4 rounded-xl"
                  style={{
                    backgroundColor:
                      currentThemeId === themeOption.id
                        ? colors.accentSoft
                        : colors.surface,
                  }}
                >
                  <Text
                    className="text-base font-medium"
                    style={{
                      color:
                        currentThemeId === themeOption.id
                          ? colors.accentSoftForeground
                          : colors.foreground,
                    }}
                  >
                    {themeOption.name}
                  </Text>
                  {currentThemeId === themeOption.id && (
                    <Check size={20} color={colors.accentSoftForeground} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Surface>

        {/* Danger Zone */}
        <Surface className="p-5 gap-4">
          <Text className="text-xl font-semibold text-danger">Danger Zone</Text>
          <Divider />

          <View className="gap-3">
            <Text className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be
              certain.
            </Text>

            <Button
              variant="danger"
              size="md"
              className="self-start"
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
              <Trash size={18} color={colors.dangerForeground} />
              <Text className="text-danger-foreground font-medium">
                {isDeletingUser ? "Deleting..." : "Delete Account"}
              </Text>
              {isDeletingUser && (
                <Spinner color={colors.dangerForeground} size="sm" />
              )}
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </View>
  );
}
