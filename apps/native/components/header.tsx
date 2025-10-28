import { View, Text } from "react-native";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <View className="flex flex-row justify-between items-center">
      <Text className="text-foreground">Logo</Text>

      <ThemeToggle />
    </View>
  );
}
