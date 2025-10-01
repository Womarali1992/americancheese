/**
 * Color Themes for Construction Categories
 * 
 * This file contains preset color themes for the construction management application.
 * Each theme provides colors for tier1 (main) categories and tier2 (sub) categories.
 * 
 * The themes are designed to provide visual distinction between different construction phases
 * while maintaining a cohesive look and feel throughout the application.
 */

export type ColorTheme = {
  name: string;
  description: string;
  // Tier1 (main) category colors - generic structure
  tier1: {
    subcategory1: string;
    subcategory2: string;
    subcategory3: string;
    subcategory4: string;
    subcategory5: string;
    default: string;
  };
  // Tier2 (sub) category colors - generic structure
  tier2: {
    tier2_1: string;
    tier2_2: string;
    tier2_3: string;
    tier2_4: string;
    tier2_5: string;
    tier2_6: string;
    tier2_7: string;
    tier2_8: string;
    tier2_9: string;
    tier2_10: string;
    tier2_11: string;
    tier2_12: string;
    tier2_13: string;
    tier2_14: string;
    tier2_15: string;
    tier2_16: string;
    tier2_17: string;
    tier2_18: string;
    tier2_19: string;
    tier2_20: string;
    
    // Old structure for backward compatibility
    foundation: string;
    framing: string;
    roofing: string;
    lumber: string;
    shingles: string;
    electrical: string;
    plumbing: string;
    hvac: string;
    barriers: string;
    drywall: string;
    exteriors: string;
    siding: string;
    insulation: string;
    windows: string;
    doors: string;
    cabinets: string;
    fixtures: string;
    flooring: string;
    paint: string;
    permits: string;
    other: string;
  };
};

/**
 * Earth Tone Theme
 * A natural palette with warm browns and earthy greens that evokes traditional building materials
 */
export const EARTH_TONE_THEME: ColorTheme = {
  name: "Earth Tone",
  description: "Natural earthy colors inspired by traditional building materials",
  tier1: {
    subcategory1: "#556b2f", // Olive green
    subcategory2: "#445566", // Steel blue
    subcategory3: "#9b2c2c", // Brick red
    subcategory4: "#8b4513", // Saddle brown
    subcategory5: "#5c4033", // Dark brown
    default: "#5c4033",     // Dark brown
  },
  tier2: {
    // New generic structure
    tier2_1: "#047857",   // Emerald
    tier2_2: "#65a30d",   // Lime
    tier2_3: "#15803d",   // Green dark
    tier2_4: "#047857",   // Emerald
    tier2_5: "#166534",   // Green darker
    tier2_6: "#2563eb",   // Blue
    tier2_7: "#0891b2",   // Cyan
    tier2_8: "#0284c7",   // Sky blue
    tier2_9: "#e11d48",   // Rose
    tier2_10: "#db2777",  // Pink
    tier2_11: "#ef4444",  // Red
    tier2_12: "#f43f5e",  // Rose light
    tier2_13: "#b91c1c",  // Red dark
    tier2_14: "#f59e0b",  // Amber
    tier2_15: "#ca8a04",  // Yellow dark
    tier2_16: "#ea580c",  // Orange dark
    tier2_17: "#b45309",  // Amber dark
    tier2_18: "#a16207",  // Yellow darker
    tier2_19: "#f97316",  // Orange
    tier2_20: "#4b5563",  // Gray
    
    // Old structure (backward compatibility)
    foundation: "#047857", // Emerald
    framing: "#65a30d",    // Lime
    roofing: "#15803d",    // Green dark
    lumber: "#047857",     // Emerald
    shingles: "#166534",   // Green darker
    electrical: "#2563eb", // Blue
    plumbing: "#0891b2",   // Cyan
    hvac: "#0284c7",       // Sky blue
    barriers: "#e11d48",   // Rose
    drywall: "#db2777",    // Pink
    exteriors: "#ef4444",  // Red
    siding: "#f43f5e",     // Rose light
    insulation: "#b91c1c", // Red dark
    windows: "#f59e0b",    // Amber
    doors: "#ca8a04",      // Yellow dark
    cabinets: "#ea580c",   // Orange dark
    fixtures: "#b45309",   // Amber dark
    flooring: "#a16207",   // Yellow darker
    paint: "#f97316",      // Orange
    permits: "#4b5563",    // Gray
    other: "#4b5563",      // Gray
  }
};

/**
 * Pastel Theme
 * A soft, muted color palette with light tones for a modern, clean look
 */
export const PASTEL_THEME: ColorTheme = {
  name: "Pastel",
  description: "Soft, modern colors for a clean and contemporary look",
  tier1: {
    subcategory1: "#93c5fd", // Blue light
    subcategory2: "#a5b4fc", // Indigo light
    subcategory3: "#fda4af", // Rose light
    subcategory4: "#fcd34d", // Yellow light
    subcategory5: "#d8b4fe", // Purple light
    default: "#d8b4fe",     // Purple light
  },
  tier2: {
    // Color palette 1 - blue family
    tier2_1: "#93c5fd",  // Blue light
    tier2_2: "#bfdbfe",  // Blue lighter
    tier2_3: "#60a5fa",  // Blue medium
    tier2_4: "#3b82f6",  // Blue
    tier2_5: "#2563eb",  // Blue dark
    
    // Color palette 2 - indigo/purple family
    tier2_6: "#a5b4fc",  // Indigo light
    tier2_7: "#818cf8",  // Indigo medium
    tier2_8: "#6366f1",  // Indigo
    
    // Color palette 3 - rose/pink family
    tier2_9: "#fda4af",   // Rose light
    tier2_10: "#fb7185",  // Rose medium
    tier2_11: "#f43f5e",  // Rose
    tier2_12: "#e11d48",  // Rose dark
    tier2_13: "#be123c",  // Rose darker
    
    // Color palette 4 - yellow/amber family
    tier2_14: "#fcd34d",  // Yellow light
    tier2_15: "#fbbf24",  // Yellow medium
    tier2_16: "#f59e0b",  // Amber
    tier2_17: "#d97706",  // Amber dark
    tier2_18: "#b45309",  // Amber darker
    tier2_19: "#f97316",  // Orange
    
    // Extra color
    tier2_20: "#c4b5fd",  // Purple light
    
    // Default
    other: "#a78bfa",     // Purple medium
  }
};

/**
 * Futuristic Theme
 * A modern, high-contrast palette with vibrant colors for a tech-forward look
 */
export const FUTURISTIC_THEME: ColorTheme = {
  name: "Futuristic",
  description: "Bold, vibrant colors for a modern tech-forward look",
  tier1: {
    subcategory1: "#3b82f6", // Blue
    subcategory2: "#8b5cf6", // Violet
    subcategory3: "#ec4899", // Pink
    subcategory4: "#10b981", // Emerald
    subcategory5: "#6366f1", // Indigo
    default: "#6366f1",     // Indigo
  },
  tier2: {
    // Color palette 1 - blue family
    tier2_1: "#1d4ed8",  // Blue dark
    tier2_2: "#2563eb",  // Blue
    tier2_3: "#3b82f6",  // Blue medium
    tier2_4: "#60a5fa",  // Blue light
    tier2_5: "#93c5fd",  // Blue lighter
    
    // Color palette 2 - violet/purple family
    tier2_6: "#7c3aed",  // Violet
    tier2_7: "#8b5cf6",  // Violet medium
    tier2_8: "#a78bfa",  // Violet light
    
    // Color palette 3 - pink/rose family
    tier2_9: "#be185d",   // Pink dark
    tier2_10: "#db2777",  // Pink
    tier2_11: "#ec4899",  // Pink medium
    tier2_12: "#f472b6",  // Pink light
    tier2_13: "#f9a8d4",  // Pink lighter
    
    // Color palette 4 - green family
    tier2_14: "#047857",  // Emerald dark
    tier2_15: "#10b981",  // Emerald
    tier2_16: "#34d399",  // Emerald medium
    tier2_17: "#6ee7b7",  // Emerald light
    tier2_18: "#a7f3d0",  // Emerald lighter
    tier2_19: "#059669",  // Emerald medium-dark
    
    // Extra color
    tier2_20: "#4f46e5",  // Indigo dark
    
    // Default
    other: "#6366f1",     // Indigo
  }
};

/**
 * Classic Construction Theme
 * A traditional construction-themed palette with practical, recognizable colors
 */
export const CLASSIC_CONSTRUCTION_THEME: ColorTheme = {
  name: "Classic Construction",
  description: "Traditional construction colors inspired by safety equipment and signage",
  tier1: {
    subcategory1: "#fbbf24", // Yellow/amber for structure
    subcategory2: "#1e3a8a", // Navy for technical systems
    subcategory3: "#ef4444", // Red for protective elements
    subcategory4: "#0f172a", // Dark slate for finished elements
    subcategory5: "#f97316", // Orange for visibility/caution
    default: "#f97316",     // Orange for visibility/caution
  },
  tier2: {
    // Color palette 1 - yellow/caution family
    tier2_1: "#92400e",  // Amber dark (concrete)
    tier2_2: "#b45309",  // Amber medium (wood)
    tier2_3: "#d97706",  // Amber light (shingles)
    tier2_4: "#f59e0b",  // Amber
    tier2_5: "#fbbf24",  // Yellow
    
    // Color palette 2 - blue family
    tier2_6: "#1e40af",  // Blue dark
    tier2_7: "#1d4ed8",  // Royal blue
    tier2_8: "#2563eb",  // Blue medium
    
    // Color palette 3 - red family
    tier2_9: "#991b1b",   // Red dark
    tier2_10: "#b91c1c",  // Red medium
    tier2_11: "#dc2626",  // Red
    tier2_12: "#ef4444",  // Red light
    tier2_13: "#f87171",  // Red lighter
    
    // Color palette 4 - dark/slate family
    tier2_14: "#1e293b",  // Slate dark
    tier2_15: "#334155",  // Slate
    tier2_16: "#475569",  // Slate medium
    tier2_17: "#64748b",  // Slate light
    tier2_18: "#94a3b8",  // Slate lighter
    tier2_19: "#cbd5e1",  // Slate lightest
    
    // Extra color
    tier2_20: "#ea580c",  // Orange dark
    
    // Default
    other: "#f97316",     // Orange
  }
};

/**
 * Molten Core Theme
 * Intense volcanic reds and lava-glow oranges contrasted with charcoal blacks
 */
export const MOLTEN_CORE_THEME: ColorTheme = {
  name: "Molten Core",
  description: "Intense volcanic reds and lava-glow oranges contrasted with charcoal blacks",
  tier1: {
    subcategory1: "#330000", // Volcanic Black
    subcategory2: "#8B0000", // Molten Red
    subcategory3: "#FF4500", // Lava Orange
    subcategory4: "#FFA500", // Burnt Amber
    subcategory5: "#BF5700", // Dark Amber
    default: "#BF5700",     // Dark Amber
  },
  tier2: {
    // Structural subcategories - dark/black family
    foundation: "#0F0000", // Black
    framing: "#220000",    // Very Dark Red
    roofing: "#330000",    // Volcanic Black
    lumber: "#4F0000",     // Deep Red
    shingles: "#661a00",   // Ash Brown
    
    // Systems subcategories - red family
    electrical: "#660000", // Dark Red
    plumbing: "#8B0000",   // Molten Red
    hvac: "#AA0000",       // Red Hot
    
    // Sheathing subcategories - orange family
    barriers: "#CC3300",   // Lava Dark
    drywall: "#DD4400",    // Burnt Red
    exteriors: "#FF4500",  // Lava Orange
    siding: "#FF6600",     // Fire Orange
    insulation: "#FF7700", // Amber Orange
    
    // Finishings subcategories - amber/yellow family
    windows: "#CC8500",    // Dark Amber
    doors: "#DD9500",      // Medium Amber
    cabinets: "#FFAA00",   // Deep Amber
    fixtures: "#FFA500",   // Burnt Amber
    flooring: "#FFB700",   // Golden Amber
    paint: "#FFC800",      // Light Amber
    
    // Default
    permits: "#990000",    // Dark Molten
    other: "#CC4400",      // Lava Medium
  }
};

/**
 * Neon Noir Theme
 * Cyberpunk aesthetic with vibrant neons over shadowy backdrops
 */
export const NEON_NOIR_THEME: ColorTheme = {
  name: "Neon Noir",
  description: "Cyberpunk aesthetic with vibrant neons over shadowy backdrops",
  tier1: {
    subcategory1: "#0A0A0A", // Pitch Black
    subcategory2: "#00FFFF", // Electric Cyan
    subcategory3: "#FF00FF", // Neon Magenta
    subcategory4: "#FFFF00", // Signal Yellow
    subcategory5: "#191919", // Dark Gray
    default: "#191919",     // Dark Gray
  },
  tier2: {
    // Structural subcategories - black/dark family
    foundation: "#000000", // Pure Black
    framing: "#0A0A0A",    // Pitch Black
    roofing: "#101010",    // Nearly Black
    lumber: "#191919",     // Dark Gray
    shingles: "#282828",   // Charcoal
    
    // Systems subcategories - cyan family
    electrical: "#00AAAA", // Dark Cyan
    plumbing: "#00CCCC",   // Medium Cyan
    hvac: "#00FFFF",       // Electric Cyan
    
    // Sheathing subcategories - magenta family
    barriers: "#AA00AA",   // Dark Magenta
    drywall: "#CC00CC",    // Medium Magenta
    exteriors: "#FF00FF",  // Neon Magenta
    siding: "#FF66FF",     // Light Magenta
    insulation: "#FFAAFF", // Pale Magenta
    
    // Finishings subcategories - yellow family
    windows: "#AAAA00",    // Dark Yellow
    doors: "#CCCC00",      // Medium Yellow
    cabinets: "#FFFF00",   // Signal Yellow
    fixtures: "#FFFF66",   // Light Yellow
    flooring: "#FFFFAA",   // Pale Yellow
    paint: "#FFFFF0",      // Ivory
    
    // Default
    permits: "#00FF00",    // Neon Green
    other: "#FF0000",      // Neon Red
  }
};

/**
 * Dust Planet Theme
 * Sci-fi desert tones with alien mauves and muted rust
 */
export const DUST_PLANET_THEME: ColorTheme = {
  name: "Dust Planet",
  description: "Sci-fi desert tones with alien mauves and muted rust",
  tier1: {
    subcategory1: "#5C4033", // Dust Bronze
    subcategory2: "#A0522D", // Martian Clay
    subcategory3: "#8B4513", // Rust Brown
    subcategory4: "#9370DB", // Alien Lilac
    subcategory5: "#6B4423", // Bronze
    default: "#6B4423",     // Bronze
  },
  tier2: {
    // Structural subcategories - bronze family
    foundation: "#3D2914", // Dark Bronze
    framing: "#4A3319",    // Medium Bronze
    roofing: "#5C4033",    // Dust Bronze
    lumber: "#6B4423",     // Bronze
    shingles: "#7E5A40",   // Light Bronze
    
    // Systems subcategories - clay family
    electrical: "#8B4513", // Brown
    plumbing: "#996633",   // Earth Clay
    hvac: "#A0522D",       // Martian Clay
    
    // Sheathing subcategories - rust family
    barriers: "#703A00",   // Deep Rust
    drywall: "#7E4200",    // Dark Rust
    exteriors: "#8B4513",  // Rust Brown
    siding: "#964B00",     // Copper
    insulation: "#A56000", // Amber Rust
    
    // Finishings subcategories - lilac/purple family
    windows: "#7B68EE",    // Medium Slate Blue
    doors: "#8470FF",      // Light Slate Blue
    cabinets: "#9370DB",   // Alien Lilac
    fixtures: "#A080FF",   // Light Purple
    flooring: "#B090FF",   // Lighter Purple
    paint: "#C0A0FF",      // Pale Purple
    
    // Default
    permits: "#856363",    // Dusty Rose
    other: "#6D6E8A",      // Dusty Blue
  }
};

/**
 * Crystal Cavern Theme
 * Gem-like tones—sapphire, emerald, and topaz—for a luminous effect
 */
export const CRYSTAL_CAVERN_THEME: ColorTheme = {
  name: "Crystal Cavern",
  description: "Gem-like tones—sapphire, emerald, and topaz—for a luminous effect",
  tier1: {
    subcategory1: "#0F52BA", // Sapphire Blue
    subcategory2: "#50C878", // Emerald Green
    subcategory3: "#FFD700", // Topaz Gold
    subcategory4: "#E6E6FA", // Crystal Mist
    subcategory5: "#4169E1", // Royal Blue
    default: "#4169E1",     // Royal Blue
  },
  tier2: {
    // Structural subcategories - sapphire/blue family
    foundation: "#0C4295", // Deep Sapphire
    framing: "#0F52BA",    // Sapphire Blue
    roofing: "#1E6BDB",    // Medium Sapphire
    lumber: "#4289E8",     // Light Sapphire
    shingles: "#6BA1F4",   // Pale Sapphire
    
    // Systems subcategories - emerald/green family
    electrical: "#2E8B57", // Sea Green
    plumbing: "#3CB371",   // Medium Sea Green
    hvac: "#50C878",       // Emerald Green
    
    // Sheathing subcategories - gold/yellow family
    barriers: "#B8860B",   // Dark Goldenrod
    drywall: "#DAA520",    // Goldenrod
    exteriors: "#FFD700",  // Topaz Gold
    siding: "#FFDF00",     // Golden Yellow
    insulation: "#FFE87C", // Pale Gold
    
    // Finishings subcategories - crystal/lavender family
    windows: "#CCCCFF",    // Periwinkle
    doors: "#D8D8FF",      // Light Periwinkle
    cabinets: "#E6E6FA",   // Crystal Mist
    fixtures: "#EEE8FF",   // Mist Light
    flooring: "#F5F0FF",   // Very Light Lavender
    paint: "#FFF8FF",      // White Mist
    
    // Default
    permits: "#8878C3",    // Medium Purple Blue
    other: "#9894DE",      // Light Purple Blue
  }
};

/**
 * Paper Studio Theme
 * Minimalist, tactile tones inspired by recycled paper and raw design materials
 */
export const PAPER_STUDIO_THEME: ColorTheme = {
  name: "Paper Studio",
  description: "Minimalist, tactile tones inspired by recycled paper and raw design materials",
  tier1: {
    subcategory1: "#DCDCDC", // Recycled Gray
    subcategory2: "#B0A990", // Cardboard Taupe
    subcategory3: "#A9A9A9", // Graphite Sketch
    subcategory4: "#F5F5DC", // Paper Cream
    subcategory5: "#C0C0C0", // Silver
    default: "#C0C0C0",      // Silver
  },
  tier2: {
    // New generic structure
    tier2_1: "#A9A9A9",    // Dark Gray
    tier2_2: "#BEBEBE",    // Medium Gray
    tier2_3: "#DCDCDC",    // Recycled Gray
    tier2_4: "#E8E8E8",    // Light Gray
    tier2_5: "#F5F5F5",    // White Smoke
    tier2_6: "#998877",    // Dark Taupe
    tier2_7: "#A99983",    // Medium Taupe
    tier2_8: "#B0A990",    // Cardboard Taupe
    tier2_9: "#696969",    // Dim Gray
    tier2_10: "#808080",   // Medium Gray
    tier2_11: "#A9A9A9",   // Graphite Sketch
    tier2_12: "#C0C0C0",   // Silver
    tier2_13: "#D3D3D3",   // Light Gray
    tier2_14: "#F0E9D2",   // Antique White
    tier2_15: "#F2EAD7",   // Light Wheat
    tier2_16: "#F5F5DC",   // Paper Cream
    tier2_17: "#F5F5F0",   // Off White
    tier2_18: "#F8F8FF",   // Ghost White
    tier2_19: "#FFF8E7",   // Cornsilk
    tier2_20: "#C8C8C8",   // Medium Light Gray
    
    // Old structure for backward compatibility
    foundation: "#A9A9A9", // Dark Gray
    framing: "#BEBEBE",    // Medium Gray
    roofing: "#DCDCDC",    // Recycled Gray
    lumber: "#E8E8E8",     // Light Gray
    shingles: "#F5F5F5",   // White Smoke
    electrical: "#998877", // Dark Taupe
    plumbing: "#A99983",   // Medium Taupe
    hvac: "#B0A990",       // Cardboard Taupe
    barriers: "#696969",   // Dim Gray
    drywall: "#808080",    // Medium Gray
    exteriors: "#A9A9A9",  // Graphite Sketch
    siding: "#C0C0C0",     // Silver
    insulation: "#D3D3D3", // Light Gray
    windows: "#F0E9D2",    // Antique White
    doors: "#F2EAD7",      // Light Wheat
    cabinets: "#F5F5DC",   // Paper Cream
    fixtures: "#F5F5F0",   // Off White
    flooring: "#F8F8FF",   // Ghost White
    paint: "#FFF8E7",      // Cornsilk
    permits: "#C8C8C8",    // Medium Light Gray
    other: "#D8D8D8",      // Very Light Gray
  }
};

/**
 * Velvet Lounge Theme
 * Rich, luxurious theme with deep velvet tones and moody accents
 */
export const VELVET_LOUNGE_THEME: ColorTheme = {
  name: "Velvet Lounge",
  description: "Rich, luxurious theme with deep velvet tones and moody accents",
  tier1: {
    subcategory1: "#4B0082", // Velvet Plum
    subcategory2: "#800000", // Dark Merlot
    subcategory3: "#2F4F4F", // Storm Gray
    subcategory4: "#BA55D3", // Lavender Luxe
    subcategory5: "#483D8B", // Dark Slate Blue
    default: "#483D8B",     // Dark Slate Blue
  },
  tier2: {
    // Structural subcategories - plum/purple family
    foundation: "#2A004C", // Deep Purple
    framing: "#3A0069",    // Medium Deep Purple
    roofing: "#4B0082",    // Velvet Plum
    lumber: "#5C1A98",     // Medium Purple
    shingles: "#6A359C",   // Light Plum
    
    // Systems subcategories - wine/red family
    electrical: "#5B0000", // Very Dark Red
    plumbing: "#6B0000",   // Deep Red
    hvac: "#800000",       // Dark Merlot
    
    // Sheathing subcategories - gray family
    barriers: "#1A2929",   // Very Dark Gray
    drywall: "#203838",    // Dark Storm Gray
    exteriors: "#2F4F4F",  // Storm Gray
    siding: "#3D6262",     // Medium Gray
    insulation: "#4F7777", // Light Gray
    
    // Finishings subcategories - lavender family
    windows: "#9932CC",    // Dark Orchid
    doors: "#A845D9",      // Medium Orchid
    cabinets: "#BA55D3",   // Lavender Luxe
    fixtures: "#C969DD",   // Medium Lavender
    flooring: "#D880E6",   // Light Lavender
    paint: "#E89FEE",      // Pale Lavender
    
    // Default
    permits: "#800080",    // Deep Purple
    other: "#8B008B",      // Medium Purple
  }
};

/**
 * Map of theme name to color theme object for easy lookup
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
  "velvet-lounge": VELVET_LOUNGE_THEME
};

/**
 * Apply a theme's colors to CSS variables in the document
 * @param theme The theme to apply
 */
export function applyThemeToCSS(theme: ColorTheme): void {
  if (typeof document === 'undefined') return;
  
  // Apply tier1 category colors as CSS variables
  document.documentElement.style.setProperty('--tier1-subcategory1', theme.tier1.subcategory1);
  document.documentElement.style.setProperty('--tier1-subcategory2', theme.tier1.subcategory2);
  document.documentElement.style.setProperty('--tier1-subcategory3', theme.tier1.subcategory3);
  document.documentElement.style.setProperty('--tier1-subcategory4', theme.tier1.subcategory4);
  document.documentElement.style.setProperty('--tier1-subcategory5', theme.tier1.subcategory5);

  // Log that we've applied the theme to CSS variables
  console.log("Applied theme colors to CSS variables:", {
    subcategory1: theme.tier1.subcategory1,
    subcategory2: theme.tier1.subcategory2,
    subcategory3: theme.tier1.subcategory3,
    subcategory4: theme.tier1.subcategory4,
    subcategory5: theme.tier1.subcategory5
  });
  
  // Store theme in global state for immediate access
  if (typeof window !== 'undefined') {
    (window as any).currentTheme = theme;
  }
}

/**
 * Get the active color theme based on local storage or default to earth tone
 * This function also ensures the theme is applied to CSS variables
 * @returns The active color theme
 */
export function getActiveColorTheme(): ColorTheme {
  // First, check if window has a currently set theme (for immediate changes without reload)
  if (typeof window !== 'undefined' && (window as any).currentTheme) {
    return (window as any).currentTheme;
  }
  
  // Otherwise, check localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const themeName = localStorage.getItem('colorTheme');
      if (themeName) {
        // Direct match check
        if (COLOR_THEMES[themeName]) {
          const theme = COLOR_THEMES[themeName];
          applyThemeToCSS(theme);
          return theme;
        }
        
        // Try to match with available themes by normalizing
        const normalizedThemeName = themeName.toLowerCase().replace(/\s+/g, '-');
        if (COLOR_THEMES[normalizedThemeName]) {
          const theme = COLOR_THEMES[normalizedThemeName];
          applyThemeToCSS(theme);
          return theme;
        }
        
        // Fallback: try to find a partial match
        for (const [key, theme] of Object.entries(COLOR_THEMES)) {
          if (key.includes(themeName) || themeName.includes(key)) {
            applyThemeToCSS(theme);
            return theme;
          }
        }
        
        console.log(`Theme name "${themeName}" not found in available themes:`, Object.keys(COLOR_THEMES));
      }
    } catch (error) {
      console.error("Error loading theme from localStorage:", error);
    }
  }
  
  // Apply default theme to CSS
  applyThemeToCSS(EARTH_TONE_THEME);
  return EARTH_TONE_THEME; // Default theme
}

/**
 * Get the color for a tier1 category from a specific theme or the active theme
 * @param category The tier1 category name
 * @param theme Optional theme to use (defaults to active theme)
 * @returns The hex color for the category
 */
export function getThemeTier1Color(category: string, theme?: ColorTheme): string {
  const activeTheme = theme || getActiveColorTheme();
  const normalizedCategory = (category || "").toLowerCase();
  
  if (normalizedCategory in activeTheme.tier1) {
    return activeTheme.tier1[normalizedCategory as keyof typeof activeTheme.tier1];
  }
  
  return activeTheme.tier1.default;
}

/**
 * Get the color for a tier2 category from a specific theme or the active theme
 * @param category The tier2 category name
 * @param theme Optional theme to use (defaults to active theme)
 * @returns The hex color for the category
 */
export function getThemeTier2Color(category: string, theme?: ColorTheme): string {
  const activeTheme = theme || getActiveColorTheme();
  const normalizedCategory = (category || "").toLowerCase();
  
  if (normalizedCategory in activeTheme.tier2) {
    return activeTheme.tier2[normalizedCategory as keyof typeof activeTheme.tier2];
  }
  
  return activeTheme.tier2.other;
}

/**
 * Get dynamic color based on entity ID (like project ID, contact ID, etc.)
 * This ensures consistent coloring across the entire application
 * @param entityId The ID of the entity (project, contact, etc.)
 * @param theme Optional theme to use (defaults to active theme)
 * @returns Object with hex color, lighter background color, and text color
 */
export function getDynamicEntityColor(entityId: number, theme?: ColorTheme): {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
} {
  const activeTheme = theme || getActiveColorTheme();
  
  // Use the same logic as project cards - cycle through tier1 categories
  const tier1Categories = ['subcategory1', 'subcategory2', 'subcategory3', 'subcategory4', 'subcategory5'];
  const categoryIndex = (entityId - 1) % tier1Categories.length;
  const category = tier1Categories[categoryIndex];
  
  // Get the primary color from the active theme
  const primaryColor = activeTheme.tier1[category as keyof typeof activeTheme.tier1];
  
  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }; // fallback to blue
  };
  
  // Helper function to create lighter background color
  const createLightBackground = (hex: string, opacity: number = 0.1) => {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  };
  
  // Helper function to determine text color (light or dark) based on background brightness
  const getTextColor = (hex: string) => {
    const rgb = hexToRgb(hex);
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#1f2937' : '#ffffff'; // dark gray or white
  };
  
  return {
    primaryColor,
    backgroundColor: createLightBackground(primaryColor, 0.1),
    textColor: getTextColor(primaryColor),
    borderColor: primaryColor
  };
}

/**
 * Get dynamic color for navigation/UI elements based on module type
 * @param module The module name ('project', 'task', 'contact', etc.)
 * @param theme Optional theme to use (defaults to active theme)
 * @returns Object with styling colors for consistent UI elements
 */
export function getDynamicModuleColor(module: string, theme?: ColorTheme): {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  hoverColor: string;
} {
  const activeTheme = theme || getActiveColorTheme();
  
  // Custom color mapping for sidebar navigation
  const moduleColors: Record<string, string> = {
    'dashboard': '#6366f1',  // Indigo
    'project': '#6366f1',    // Indigo
    'tasks': '#16a34a',      // Green
    'task': '#16a34a',       // Green
    'materials': '#ea580c',  // Orange
    'material': '#ea580c',   // Orange
    'contacts': '#3b82f6',   // Blue
    'contact': '#3b82f6',    // Blue
    'labor': '#16a34a',      // Green (same as tasks)
    'expense': '#ea580c',    // Orange (same as materials)
    'admin': '#8b5cf6'       // Purple
  };
  
  // Use custom color if available, otherwise fall back to theme mapping
  const primaryColor = moduleColors[module.toLowerCase()] || activeTheme.tier1.subcategory1;
  
  // Helper functions (same as above)
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
  };
  
  const createLightBackground = (hex: string, opacity: number = 0.1) => {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  };
  
  const createHoverColor = (hex: string, opacity: number = 0.15) => {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  };
  
  return {
    primaryColor,
    backgroundColor: createLightBackground(primaryColor, 0.1),
    textColor: primaryColor,
    borderColor: primaryColor,
    hoverColor: createHoverColor(primaryColor, 0.15)
  };
}