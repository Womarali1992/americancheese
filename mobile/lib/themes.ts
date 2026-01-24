/**
 * Color Themes for Mobile App
 *
 * Ported from web app's color-themes.ts
 * Contains all 12 theme definitions.
 */

export type ColorTheme = {
  name: string;
  description: string;
  tier1: {
    subcategory1: string;
    subcategory2: string;
    subcategory3: string;
    subcategory4: string;
    subcategory5: string;
    default: string;
  };
};

// Earth Tone Theme
export const EARTH_TONE_THEME: ColorTheme = {
  name: "Earth Tone",
  description: "Natural earthy colors inspired by traditional building materials",
  tier1: {
    subcategory1: "#556b2f",
    subcategory2: "#8b4513",
    subcategory3: "#475569",
    subcategory4: "#b45309",
    subcategory5: "#5c4033",
    default: "#5c4033",
  },
};

// Pastel Theme
export const PASTEL_THEME: ColorTheme = {
  name: "Pastel",
  description: "Soft, modern colors for a clean and contemporary look",
  tier1: {
    subcategory1: "#93c5fd",
    subcategory2: "#a5b4fc",
    subcategory3: "#fda4af",
    subcategory4: "#fcd34d",
    subcategory5: "#d8b4fe",
    default: "#d8b4fe",
  },
};

// Futuristic Theme
export const FUTURISTIC_THEME: ColorTheme = {
  name: "Futuristic",
  description: "Bold, vibrant colors for a modern tech-forward look",
  tier1: {
    subcategory1: "#3b82f6",
    subcategory2: "#8b5cf6",
    subcategory3: "#ec4899",
    subcategory4: "#ff9800",
    subcategory5: "#6366f1",
    default: "#6366f1",
  },
};

// Classic Construction Theme
export const CLASSIC_CONSTRUCTION_THEME: ColorTheme = {
  name: "Classic Construction",
  description: "Bold construction colors with excellent visibility and contrast",
  tier1: {
    subcategory1: "#d97706",
    subcategory2: "#0369a1",
    subcategory3: "#dc2626",
    subcategory4: "#16a34a",
    subcategory5: "#eab308",
    default: "#d97706",
  },
};

// Molten Core Theme
export const MOLTEN_CORE_THEME: ColorTheme = {
  name: "Molten Core",
  description: "Intense volcanic reds and lava-glow oranges contrasted with charcoal blacks",
  tier1: {
    subcategory1: "#330000",
    subcategory2: "#8B0000",
    subcategory3: "#FF4500",
    subcategory4: "#FFA500",
    subcategory5: "#BF5700",
    default: "#BF5700",
  },
};

// Neon Noir Theme
export const NEON_NOIR_THEME: ColorTheme = {
  name: "Neon Noir",
  description: "Dark cyberpunk noir with bright neon accents - black, cyan, pink, and yellow",
  tier1: {
    subcategory1: "#1a1a1a",
    subcategory2: "#00ffff",
    subcategory3: "#ff00ff",
    subcategory4: "#ffff00",
    subcategory5: "#ec4899",
    default: "#1a1a1a",
  },
};

// Dust Planet Theme
export const DUST_PLANET_THEME: ColorTheme = {
  name: "Dust Planet",
  description: "Sci-fi desert tones with alien mauves and muted rust",
  tier1: {
    subcategory1: "#5C4033",
    subcategory2: "#A0522D",
    subcategory3: "#8B4513",
    subcategory4: "#9370DB",
    subcategory5: "#6B4423",
    default: "#6B4423",
  },
};

// Crystal Cavern Theme
export const CRYSTAL_CAVERN_THEME: ColorTheme = {
  name: "Crystal Cavern",
  description: "Gem-like tones - sapphire, emerald, and topaz - for a luminous effect",
  tier1: {
    subcategory1: "#0F52BA",
    subcategory2: "#50C878",
    subcategory3: "#FFD700",
    subcategory4: "#E6E6FA",
    subcategory5: "#4169E1",
    default: "#4169E1",
  },
};

// Paper Studio Theme
export const PAPER_STUDIO_THEME: ColorTheme = {
  name: "Paper Studio",
  description: "Minimalist, tactile tones inspired by recycled paper and raw design materials",
  tier1: {
    subcategory1: "#DCDCDC",
    subcategory2: "#B0A990",
    subcategory3: "#A9A9A9",
    subcategory4: "#F5F5DC",
    subcategory5: "#C0C0C0",
    default: "#C0C0C0",
  },
};

// Paper Bright Theme
export const PAPER_BRIGHT_THEME: ColorTheme = {
  name: "Paper Bright",
  description: "Vibrant, high-visibility paper tones with enhanced contrast and clarity",
  tier1: {
    subcategory1: "#E8D4A2",
    subcategory2: "#8B7355",
    subcategory3: "#6B7280",
    subcategory4: "#D4A574",
    subcategory5: "#94A3B8",
    default: "#94A3B8",
  },
};

// Velvet Lounge Theme
export const VELVET_LOUNGE_THEME: ColorTheme = {
  name: "Velvet Lounge",
  description: "Rich, luxurious theme with deep velvet tones and moody accents",
  tier1: {
    subcategory1: "#4B0082",
    subcategory2: "#800000",
    subcategory3: "#2F4F4F",
    subcategory4: "#BA55D3",
    subcategory5: "#483D8B",
    default: "#483D8B",
  },
};

// Volcanic Dunes Theme
export const VOLCANIC_DUNES_THEME: ColorTheme = {
  name: "Volcanic Dunes",
  description: "Volcanic reds and lava oranges meet dusty bronze and alien mauves",
  tier1: {
    subcategory1: "#5C4033",
    subcategory2: "#8B0000",
    subcategory3: "#FF6600",
    subcategory4: "#9370DB",
    subcategory5: "#A0522D",
    default: "#A0522D",
  },
};

/**
 * Map of theme keys to theme objects
 */
export const COLOR_THEMES: Record<string, ColorTheme> = {
  "earth-tone": EARTH_TONE_THEME,
  "pastel": PASTEL_THEME,
  "futuristic": FUTURISTIC_THEME,
  "classic-construction": CLASSIC_CONSTRUCTION_THEME,
  "molten-core": MOLTEN_CORE_THEME,
  "neon-noir": NEON_NOIR_THEME,
  "dust-planet": DUST_PLANET_THEME,
  "crystal-cavern": CRYSTAL_CAVERN_THEME,
  "paper-studio": PAPER_STUDIO_THEME,
  "paper-bright": PAPER_BRIGHT_THEME,
  "velvet-lounge": VELVET_LOUNGE_THEME,
  "volcanic-dunes": VOLCANIC_DUNES_THEME,
};

/**
 * Get ordered list of theme entries for UI display
 */
export function getThemeList(): Array<{ key: string; theme: ColorTheme }> {
  return Object.entries(COLOR_THEMES).map(([key, theme]) => ({
    key,
    theme,
  }));
}

/**
 * Get a theme by key, with fallback to earth tone
 */
export function getTheme(key: string): ColorTheme {
  return COLOR_THEMES[key] || EARTH_TONE_THEME;
}

/**
 * Get tier1 colors as an array for display (e.g., color swatches)
 */
export function getThemeTier1Colors(theme: ColorTheme): string[] {
  return [
    theme.tier1.subcategory1,
    theme.tier1.subcategory2,
    theme.tier1.subcategory3,
    theme.tier1.subcategory4,
    theme.tier1.subcategory5,
  ];
}

export default {
  COLOR_THEMES,
  getThemeList,
  getTheme,
  getThemeTier1Colors,
  // Export individual themes
  EARTH_TONE_THEME,
  PASTEL_THEME,
  FUTURISTIC_THEME,
  CLASSIC_CONSTRUCTION_THEME,
  MOLTEN_CORE_THEME,
  NEON_NOIR_THEME,
  DUST_PLANET_THEME,
  CRYSTAL_CAVERN_THEME,
  PAPER_STUDIO_THEME,
  PAPER_BRIGHT_THEME,
  VELVET_LOUNGE_THEME,
  VOLCANIC_DUNES_THEME,
};
