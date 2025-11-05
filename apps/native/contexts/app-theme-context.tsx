import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useState,
} from "react";
import { Uniwind, useUniwind } from "uniwind";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeName =
  | "light"
  | "dark"
  | "lavender-light"
  | "lavender-dark"
  | "mint-light"
  | "mint-dark"
  | "sky-light"
  | "sky-dark";

const THEME_STORAGE_KEY = "@app_theme";

interface AppThemeContextType {
  currentTheme: string;
  isLight: boolean;
  isDark: boolean;
  setTheme: (theme: ThemeName) => Promise<void>;
  toggleTheme: () => Promise<void>;
  isThemeLoaded: boolean;
}

const AppThemeContext = createContext<AppThemeContextType | undefined>(
  undefined
);

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { theme } = useUniwind();
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Load saved theme on app startup
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          // User has a saved theme preference
          Uniwind.setTheme(savedTheme as ThemeName);
        } else {
          // No saved theme, set default to dark
          Uniwind.setTheme("dark");
          await AsyncStorage.setItem(THEME_STORAGE_KEY, "dark");
        }
      } catch (error) {
        console.log("Error loading theme:", error);
        // Fallback to dark theme
        Uniwind.setTheme("dark");
      } finally {
        setIsThemeLoaded(true);
      }
    };

    loadSavedTheme();
  }, []);

  const isLight = useMemo(() => {
    return theme === "light" || theme.endsWith("-light");
  }, [theme]);

  const isDark = useMemo(() => {
    return theme === "dark" || theme.endsWith("-dark");
  }, [theme]);

  const setTheme = useCallback(async (newTheme: ThemeName) => {
    try {
      Uniwind.setTheme(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    let newTheme: ThemeName;
    switch (theme) {
      case "light":
        newTheme = "dark";
        break;
      case "dark":
        newTheme = "light";
        break;
      case "lavender-light":
        newTheme = "lavender-dark";
        break;
      case "lavender-dark":
        newTheme = "lavender-light";
        break;
      case "mint-light":
        newTheme = "mint-dark";
        break;
      case "mint-dark":
        newTheme = "mint-light";
        break;
      case "sky-light":
        newTheme = "sky-dark";
        break;
      case "sky-dark":
        newTheme = "sky-light";
        break;
      default:
        newTheme = "dark";
    }
    await setTheme(newTheme);
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({
      currentTheme: theme,
      isLight,
      isDark,
      setTheme,
      toggleTheme,
      isThemeLoaded,
    }),
    [theme, isLight, isDark, setTheme, toggleTheme, isThemeLoaded]
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
};
