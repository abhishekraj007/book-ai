import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { HeroUINativeProvider } from "heroui-native";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { PurchasesProvider } from "@/contexts/purchases-context";
import ConvexProvider from "@/providers/ConvexProvider";
import SplashScreenProvider from "@/providers/SplashScreenProvider";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const heroUIConfig = {
  // colorScheme: "dark",
  // theme: currentTheme,
  textProps: {
    allowFontScaling: false,
  },
};

/* ------------------------------ themed route ------------------------------ */
function ThemedLayout() {
  return (
    <HeroUINativeProvider config={heroUIConfig}>
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
            <PurchasesProvider>
              <ThemedLayout />
            </PurchasesProvider>
          </AppThemeProvider>
        </SplashScreenProvider>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}
