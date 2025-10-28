import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "heroui-native";
import type { FC } from "react";
import { Pressable } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";

export const ThemeToggle: FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      className="justify-center rounded-full p-2.5"
    >
      {theme === "light" ? (
        <Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
          <Ionicons name="moon-outline" color="black" size={18} />
        </Animated.View>
      ) : (
        <Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
          <Ionicons name="sunny-outline" color="white" size={18} />
        </Animated.View>
      )}
    </Pressable>
  );
};
