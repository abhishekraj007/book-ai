import { View, Text, ActivityIndicator, ImageBackground } from "react-native";

export function SplashScreen() {
  return (
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
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    </ImageBackground>
  );
}
