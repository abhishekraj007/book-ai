import { colorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

export function useColorScheme() {
  const systemColorScheme = useRNColorScheme();
  const [currentScheme, setCurrentScheme] = useState<"light" | "dark">(() => {
    // Initialize from stored value or system preference
    return colorScheme.get() ?? systemColorScheme ?? "dark";
  });

  useEffect(() => {
    // Listen for system color scheme changes
    const newScheme = colorScheme.get() ?? systemColorScheme ?? "dark";
    if (newScheme !== currentScheme) {
      setCurrentScheme(newScheme);
    }
  }, [systemColorScheme, currentScheme]);

  const setColorSchemeAndUpdate = (scheme: "light" | "dark") => {
    colorScheme.set(scheme);
    setCurrentScheme(scheme);

    // Force a small delay to ensure the change propagates
    setTimeout(() => {
      setCurrentScheme(scheme);
    }, 10);
  };

  const toggleColorScheme = () => {
    const newScheme = currentScheme === "dark" ? "light" : "dark";
    setColorSchemeAndUpdate(newScheme);
  };

  return {
    colorScheme: currentScheme,
    isDarkColorScheme: currentScheme === "dark",
    setColorScheme: setColorSchemeAndUpdate,
    toggleColorScheme,
  };
}
