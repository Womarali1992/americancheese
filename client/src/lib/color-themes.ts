// Color theme presets for construction categories
// These can be selected via the admin interface

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

// 1. Earth Tones Theme (Current Default)
export const EARTH_TONE_THEME: ColorTheme = {
  name: "Earth Tones",
  description: "Natural construction colors with earthy greens, browns, and reds",
  tier1: {
    structural: '#556b2f', // olive green
    systems: '#445566',    // steel blue
    sheathing: '#9b2c2c',  // brick red
    finishings: '#8b4513', // saddle brown
    default: '#5c4033',    // rich brown
  },
  tier2: {
    // Structural subcategories
    foundation: '#047857', // emerald
    framing: '#65a30d',    // lime
    roofing: '#15803d',    // green
    lumber: '#047857',     // emerald
    shingles: '#166534',   // dark green
    
    // Systems subcategories
    electrical: '#2563eb', // blue
    plumbing: '#0891b2',   // cyan
    hvac: '#0284c7',       // sky blue
    
    // Sheathing subcategories
    barriers: '#e11d48',   // rose
    drywall: '#db2777',    // pink
    exteriors: '#ef4444',  // red
    siding: '#f43f5e',     // rose
    insulation: '#b91c1c', // dark red
    
    // Finishings subcategories
    windows: '#f59e0b',    // amber
    doors: '#ca8a04',      // yellow
    cabinets: '#ea580c',   // orange
    fixtures: '#b45309',   // dark amber
    flooring: '#a16207',   // yellow
    paint: '#f97316',      // orange
    
    // Default/misc
    permits: '#d97706',    // amber
    other: '#4b5563',      // gray
  }
};

// 2. Pastel Theme
export const PASTEL_THEME: ColorTheme = {
  name: "Pastel Colors",
  description: "Soft, light colors for a gentle and modern appearance",
  tier1: {
    structural: '#93c5fd', // pastel blue
    systems: '#a5b4fc',    // pastel indigo
    sheathing: '#fda4af',  // pastel rose
    finishings: '#fcd34d', // pastel yellow
    default: '#d8b4fe',    // pastel purple
  },
  tier2: {
    // Structural subcategories
    foundation: '#bae6fd', // pastel sky blue
    framing: '#a7f3d0',    // pastel green
    roofing: '#c7d2fe',    // pastel indigo
    lumber: '#d1fae5',     // pastel emerald
    shingles: '#bbf7d0',   // pastel mint
    
    // Systems subcategories
    electrical: '#ddd6fe', // pastel purple
    plumbing: '#c4b5fd',   // pastel violet
    hvac: '#e0e7ff',       // pastel blue
    
    // Sheathing subcategories
    barriers: '#fed7aa',   // pastel orange
    drywall: '#fee2e2',    // pastel red
    exteriors: '#fbcfe8',  // pastel pink
    siding: '#fecaca',     // pastel rose
    insulation: '#fecdd3', // pastel red/pink
    
    // Finishings subcategories
    windows: '#fef3c7',    // pastel yellow
    doors: '#fef08a',      // pastel light yellow
    cabinets: '#fde68a',   // pastel amber
    fixtures: '#fed7aa',   // pastel orange
    flooring: '#fde68a',   // pastel light amber
    paint: '#fcd34d',      // pastel amber
    
    // Default/misc
    permits: '#d8b4fe',    // pastel purple
    other: '#e5e7eb',      // pastel gray
  }
};

// 3. Futuristic Theme
export const FUTURISTIC_THEME: ColorTheme = {
  name: "Futuristic",
  description: "Modern tech-inspired colors with neon accents",
  tier1: {
    structural: '#3b82f6', // bright blue
    systems: '#8b5cf6',    // bright purple
    sheathing: '#ec4899',  // bright pink
    finishings: '#10b981', // bright green
    default: '#6366f1',    // bright indigo
  },
  tier2: {
    // Structural subcategories
    foundation: '#0ea5e9', // electric blue
    framing: '#06b6d4',    // cyan
    roofing: '#38bdf8',    // light blue
    lumber: '#0891b2',     // teal
    shingles: '#0284c7',   // medium blue
    
    // Systems subcategories
    electrical: '#8b5cf6', // violet
    plumbing: '#6366f1',   // indigo
    hvac: '#a855f7',       // purple
    
    // Sheathing subcategories
    barriers: '#f43f5e',   // bright red
    drywall: '#ec4899',    // magenta
    exteriors: '#d946ef',  // fuchsia
    siding: '#f43f5e',     // bright pink
    insulation: '#be185d', // dark pink
    
    // Finishings subcategories
    windows: '#14b8a6',    // teal
    doors: '#10b981',      // emerald
    cabinets: '#059669',   // green
    fixtures: '#0d9488',   // teal
    flooring: '#0f766e',   // dark teal
    paint: '#16a34a',      // green
    
    // Default/misc
    permits: '#6366f1',    // indigo
    other: '#6b7280',      // gray
  }
};

// 4. Classic Construction Theme
export const CLASSIC_CONSTRUCTION_THEME: ColorTheme = {
  name: "Classic Construction",
  description: "Traditional construction colors with yellows and blacks",
  tier1: {
    structural: '#fbbf24', // yellow
    systems: '#1e3a8a',    // dark blue
    sheathing: '#ef4444',  // red
    finishings: '#0f172a', // black
    default: '#f97316',    // orange
  },
  tier2: {
    // Structural subcategories
    foundation: '#9a9797', // concrete gray
    framing: '#facc15',    // yellow
    roofing: '#737373',    // slate gray
    lumber: '#a16207',     // wood brown
    shingles: '#475569',   // dark slate
    
    // Systems subcategories
    electrical: '#fbbf24', // yellow (warning color)
    plumbing: '#1e40af',   // dark blue
    hvac: '#374151',       // dark gray
    
    // Sheathing subcategories
    barriers: '#b91c1c',   // dark red
    drywall: '#f5f5f5',    // off-white
    exteriors: '#e5e5e5',  // light gray
    siding: '#e7e5e4',     // beige
    insulation: '#fb923c', // light orange
    
    // Finishings subcategories
    windows: '#0284c7',    // blue
    doors: '#b45309',      // brown
    cabinets: '#7c2d12',   // dark brown
    fixtures: '#4b5563',   // gray
    flooring: '#92400e',   // amber brown
    paint: '#f97316',      // orange
    
    // Default/misc
    permits: '#0f172a',    // black
    other: '#334155',      // slate
  }
};

// 5. Vibrant Theme
export const VIBRANT_THEME: ColorTheme = {
  name: "Vibrant",
  description: "Bold, high-contrast colors for maximum visibility",
  tier1: {
    structural: '#16a34a', // bright green
    systems: '#2563eb',    // royal blue
    sheathing: '#dc2626',  // bright red
    finishings: '#d97706', // bright orange
    default: '#7c3aed',    // bright purple
  },
  tier2: {
    // Structural subcategories
    foundation: '#65a30d', // lime green
    framing: '#16a34a',    // green
    roofing: '#15803d',    // forest green
    lumber: '#84cc16',     // chartreuse
    shingles: '#14532d',   // dark green
    
    // Systems subcategories
    electrical: '#f59e0b', // amber yellow (warning)
    plumbing: '#2563eb',   // royal blue
    hvac: '#3b82f6',       // bright blue
    
    // Sheathing subcategories
    barriers: '#dc2626',   // bright red
    drywall: '#f97316',    // orange
    exteriors: '#b91c1c',  // dark red
    siding: '#c2410c',     // burnt orange
    insulation: '#ef4444', // red
    
    // Finishings subcategories
    windows: '#0ea5e9',    // sky blue
    doors: '#d97706',      // orange
    cabinets: '#9333ea',   // purple
    fixtures: '#6d28d9',   // violet
    flooring: '#65a30d',   // lime
    paint: '#a855f7',      // light purple
    
    // Default/misc
    permits: '#0369a1',    // blue
    other: '#4b5563',      // gray
  }
};

// Map of all available themes
export const COLOR_THEMES: Record<string, ColorTheme> = {
  'earth-tones': EARTH_TONE_THEME,
  'pastel': PASTEL_THEME,
  'futuristic': FUTURISTIC_THEME,
  'classic-construction': CLASSIC_CONSTRUCTION_THEME,
  'vibrant': VIBRANT_THEME
};

// Get current active theme - could be stored in localStorage or fetched from backend
export function getActiveColorTheme(): ColorTheme {
  // By default, return earth tone theme
  // This could be enhanced to get the user's preference from storage or API
  return EARTH_TONE_THEME;
}

// Get a tier1 category color based on the active theme
export function getThemeTier1Color(category: string, theme?: ColorTheme): string {
  const activeTheme = theme || getActiveColorTheme();
  const lowerCategory = (category || '').toLowerCase();
  
  switch (lowerCategory) {
    case 'structural':
      return activeTheme.tier1.structural;
    case 'systems':
      return activeTheme.tier1.systems;
    case 'sheathing':
      return activeTheme.tier1.sheathing;
    case 'finishings':
      return activeTheme.tier1.finishings;
    default:
      return activeTheme.tier1.default;
  }
}

// Get a tier2 category color based on the active theme
export function getThemeTier2Color(category: string, theme?: ColorTheme): string {
  const activeTheme = theme || getActiveColorTheme();
  const lowerCategory = (category || '').toLowerCase();
  
  // Return the specific tier2 color or default if not found
  return (activeTheme.tier2 as any)[lowerCategory] || activeTheme.tier2.other;
}