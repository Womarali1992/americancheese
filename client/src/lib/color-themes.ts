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
  // Tier1 (main) category colors
  tier1: {
    structural: string;
    systems: string;
    sheathing: string;
    finishings: string;
    default: string;
  };
  // Tier2 (sub) category colors - mapped by tier1 category
  tier2: {
    // Structural subcategories
    foundation: string;
    framing: string;
    roofing: string;
    lumber: string;
    shingles: string;
    
    // Systems subcategories
    electrical: string;
    plumbing: string;
    hvac: string;
    
    // Sheathing subcategories
    barriers: string;
    drywall: string;
    exteriors: string;
    siding: string;
    insulation: string;
    
    // Finishings subcategories
    windows: string;
    doors: string;
    cabinets: string;
    fixtures: string;
    flooring: string;
    paint: string;
    
    // Default/misc
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
    structural: "#556b2f", // Olive green
    systems: "#445566",    // Steel blue
    sheathing: "#9b2c2c",  // Brick red
    finishings: "#8b4513", // Saddle brown
    default: "#5c4033",    // Dark brown
  },
  tier2: {
    // Structural subcategories - green family
    foundation: "#047857", // Emerald
    framing: "#65a30d",    // Lime
    roofing: "#15803d",    // Green dark
    lumber: "#047857",     // Emerald
    shingles: "#166534",   // Green darker
    
    // Systems subcategories - blue family
    electrical: "#2563eb", // Blue
    plumbing: "#0891b2",   // Cyan
    hvac: "#0284c7",       // Sky blue
    
    // Sheathing subcategories - red family
    barriers: "#e11d48",   // Rose
    drywall: "#db2777",    // Pink
    exteriors: "#ef4444",  // Red
    siding: "#f43f5e",     // Rose light
    insulation: "#b91c1c", // Red dark
    
    // Finishings subcategories - amber/orange family
    windows: "#f59e0b",    // Amber
    doors: "#ca8a04",      // Yellow dark
    cabinets: "#ea580c",   // Orange dark
    fixtures: "#b45309",   // Amber dark
    flooring: "#a16207",   // Yellow darker
    paint: "#f97316",      // Orange
    
    // Default
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
    structural: "#93c5fd", // Blue light
    systems: "#a5b4fc",    // Indigo light
    sheathing: "#fda4af",  // Rose light
    finishings: "#fcd34d", // Yellow light
    default: "#d8b4fe",    // Purple light
  },
  tier2: {
    // Structural subcategories - blue family
    foundation: "#93c5fd", // Blue light
    framing: "#bfdbfe",    // Blue lighter
    roofing: "#60a5fa",    // Blue medium
    lumber: "#3b82f6",     // Blue
    shingles: "#2563eb",   // Blue dark
    
    // Systems subcategories - indigo/purple family
    electrical: "#a5b4fc", // Indigo light
    plumbing: "#818cf8",   // Indigo medium
    hvac: "#6366f1",       // Indigo
    
    // Sheathing subcategories - rose/pink family
    barriers: "#fda4af",   // Rose light
    drywall: "#fb7185",    // Rose medium
    exteriors: "#f43f5e",  // Rose
    siding: "#e11d48",     // Rose dark
    insulation: "#be123c", // Rose darker
    
    // Finishings subcategories - yellow/amber family
    windows: "#fcd34d",    // Yellow light
    doors: "#fbbf24",      // Yellow medium
    cabinets: "#f59e0b",   // Amber
    fixtures: "#d97706",   // Amber dark
    flooring: "#b45309",   // Amber darker
    paint: "#f97316",      // Orange
    
    // Default
    permits: "#c4b5fd",    // Purple light
    other: "#a78bfa",      // Purple medium
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
    structural: "#3b82f6", // Blue
    systems: "#8b5cf6",    // Violet
    sheathing: "#ec4899",  // Pink
    finishings: "#10b981", // Emerald
    default: "#6366f1",    // Indigo
  },
  tier2: {
    // Structural subcategories - blue family
    foundation: "#1d4ed8", // Blue dark
    framing: "#2563eb",    // Blue
    roofing: "#3b82f6",    // Blue medium
    lumber: "#60a5fa",     // Blue light
    shingles: "#93c5fd",   // Blue lighter
    
    // Systems subcategories - violet/purple family
    electrical: "#7c3aed", // Violet
    plumbing: "#8b5cf6",   // Violet medium
    hvac: "#a78bfa",       // Violet light
    
    // Sheathing subcategories - pink/rose family
    barriers: "#be185d",   // Pink dark
    drywall: "#db2777",    // Pink
    exteriors: "#ec4899",  // Pink medium
    siding: "#f472b6",     // Pink light
    insulation: "#f9a8d4", // Pink lighter
    
    // Finishings subcategories - green family
    windows: "#047857",    // Emerald dark
    doors: "#10b981",      // Emerald
    cabinets: "#34d399",   // Emerald medium
    fixtures: "#6ee7b7",   // Emerald light
    flooring: "#a7f3d0",   // Emerald lighter
    paint: "#059669",      // Emerald medium-dark
    
    // Default
    permits: "#4f46e5",    // Indigo dark
    other: "#6366f1",      // Indigo
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
    structural: "#fbbf24", // Yellow/amber for structure
    systems: "#1e3a8a",    // Navy for technical systems
    sheathing: "#ef4444",  // Red for protective elements
    finishings: "#0f172a", // Dark slate for finished elements
    default: "#f97316",    // Orange for visibility/caution
  },
  tier2: {
    // Structural subcategories - yellow/caution family
    foundation: "#92400e", // Amber dark (concrete)
    framing: "#b45309",    // Amber medium (wood)
    roofing: "#d97706",    // Amber light (shingles)
    lumber: "#f59e0b",     // Amber
    shingles: "#fbbf24",   // Yellow
    
    // Systems subcategories - blue family
    electrical: "#1e40af", // Blue dark
    plumbing: "#1d4ed8",   // Royal blue
    hvac: "#2563eb",       // Blue medium
    
    // Sheathing subcategories - red family
    barriers: "#991b1b",   // Red dark
    drywall: "#b91c1c",    // Red medium
    exteriors: "#dc2626",  // Red
    siding: "#ef4444",     // Red light
    insulation: "#f87171", // Red lighter
    
    // Finishings subcategories - dark/slate family
    windows: "#1e293b",    // Slate dark
    doors: "#334155",      // Slate
    cabinets: "#475569",   // Slate medium
    fixtures: "#64748b",   // Slate light
    flooring: "#94a3b8",   // Slate lighter
    paint: "#cbd5e1",      // Slate lightest
    
    // Default
    permits: "#ea580c",    // Orange dark
    other: "#f97316",      // Orange
  }
};

/**
 * Vibrant Theme
 * A high-contrast, saturated palette for maximum visibility and distinction
 */
export const VIBRANT_THEME: ColorTheme = {
  name: "Vibrant",
  description: "High-contrast, saturated colors for maximum visibility and distinction",
  tier1: {
    structural: "#16a34a", // Green
    systems: "#2563eb",    // Blue
    sheathing: "#dc2626",  // Red
    finishings: "#d97706", // Amber
    default: "#7c3aed",    // Violet
  },
  tier2: {
    // Structural subcategories - green family
    foundation: "#14532d", // Green darkest
    framing: "#15803d",    // Green darker
    roofing: "#16a34a",    // Green
    lumber: "#4ade80",     // Green light
    shingles: "#86efac",   // Green lighter
    
    // Systems subcategories - blue family
    electrical: "#1e3a8a", // Blue darkest
    plumbing: "#1d4ed8",   // Blue dark
    hvac: "#3b82f6",       // Blue
    
    // Sheathing subcategories - red family
    barriers: "#7f1d1d",   // Red darkest
    drywall: "#b91c1c",    // Red dark
    exteriors: "#dc2626",  // Red
    siding: "#ef4444",     // Red light
    insulation: "#fca5a5", // Red lighter
    
    // Finishings subcategories - amber/orange family
    windows: "#92400e",    // Amber darkest
    doors: "#b45309",      // Amber dark
    cabinets: "#d97706",   // Amber
    fixtures: "#f59e0b",   // Amber light
    flooring: "#fbbf24",   // Yellow
    paint: "#f97316",      // Orange
    
    // Default
    permits: "#6d28d9",    // Violet dark
    other: "#8b5cf6",      // Violet medium
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
  "vibrant": VIBRANT_THEME
};

/**
 * Get the active color theme based on local storage or default to earth tone
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
          return COLOR_THEMES[themeName];
        }
        
        // Try to match with available themes by normalizing
        const normalizedThemeName = themeName.toLowerCase().replace(/\s+/g, '-');
        if (COLOR_THEMES[normalizedThemeName]) {
          return COLOR_THEMES[normalizedThemeName];
        }
        
        // Fallback: try to find a partial match
        for (const [key, theme] of Object.entries(COLOR_THEMES)) {
          if (key.includes(themeName) || themeName.includes(key)) {
            return theme;
          }
        }
        
        console.log(`Theme name "${themeName}" not found in available themes:`, Object.keys(COLOR_THEMES));
      }
    } catch (error) {
      console.error("Error loading theme from localStorage:", error);
    }
  }
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