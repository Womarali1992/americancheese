import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLOR_THEMES, ColorTheme, EARTH_TONE_THEME } from "@/lib/themes";

const THEME_KEY = "selected-color-theme";
const DEFAULT_THEME_KEY = "earth-tone";

interface ThemeState {
  themeKey: string;
  isLoading: boolean;
  setTheme: (key: string) => Promise<void>;
  loadTheme: () => Promise<void>;
  getTheme: () => ColorTheme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeKey: DEFAULT_THEME_KEY,
  isLoading: true,

  setTheme: async (key: string) => {
    try {
      // Validate the theme key exists
      if (!COLOR_THEMES[key]) {
        console.warn(`Theme "${key}" not found, using default`);
        key = DEFAULT_THEME_KEY;
      }

      await AsyncStorage.setItem(THEME_KEY, key);
      set({ themeKey: key });
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  },

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      const themeKey = stored && COLOR_THEMES[stored] ? stored : DEFAULT_THEME_KEY;
      set({
        themeKey,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading theme:", error);
      set({ themeKey: DEFAULT_THEME_KEY, isLoading: false });
    }
  },

  getTheme: () => {
    const { themeKey } = get();
    return COLOR_THEMES[themeKey] || EARTH_TONE_THEME;
  },
}));
