import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { HeroUINativeProvider } from "heroui-native";
import { AppThemeProvider, useAppTheme } from "@/contexts/app-theme-context";
import ConvexProvider from "@/providers/ConvexProvider";
import SplashScreenProvider from "@/providers/SplashScreenProvider";

/* ------------------------------ themed route ------------------------------ */
function ThemedLayout() {
  const { currentTheme } = useAppTheme();
  return (
    <HeroUINativeProvider
      config={{
        colorScheme: "dark",
        theme: currentTheme,
        textProps: {
          allowFontScaling: false,
        },
      }}
    >
      <Slot />
    </HeroUINativeProvider>
  );
}
/* ------------------------------- root layout ------------------------------ */
export default function Layout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <ConvexProvider>
        <SplashScreenProvider>
          <AppThemeProvider>
            <ThemedLayout />
          </AppThemeProvider>
        </SplashScreenProvider>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}
