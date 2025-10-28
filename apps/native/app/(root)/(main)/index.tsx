import { Button, Chip, useTheme } from "heroui-native";
import { FlatList, Text, View } from "react-native";

export default function HomeRoute() {
  const { colors } = useTheme();

  return (
    <View className="flex-1">
      <Text>Home</Text>
    </View>
  );
}
