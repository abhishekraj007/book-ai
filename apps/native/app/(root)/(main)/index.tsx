import { Header } from "@/components";
import { Button, Chip } from "heroui-native";
import { FlatList, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function HomeRoute() {
  return (
    <View className="flex-1">
      <SafeAreaView>
        <Header />
        <Text>Home</Text>
      </SafeAreaView>
    </View>
  );
}
