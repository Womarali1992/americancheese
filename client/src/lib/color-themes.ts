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
 *
 * Tier1 mapping for Home Builder preset:
 * - subcategory1 (Permitting) → Forest/Olive greens (#556b2f)
 * - subcategory2 (Structural) → Earth browns (#8b4513)
 * - subcategory3 (Systems) → Steel blues (#475569)
 * - subcategory4 (Finishings) → Terracotta/Clay (#b45309)
 * - subcategory5 (Other) → Dark brown (#5c4033)
 */
export const EARTH_TONE_THEME: ColorTheme = {
  name: "Earth Tone",
  description: "Natural earthy colors inspired by traditional building materials",
  tier1: {
    subcategory1: "#556b2f", // Forest/Olive green for Permitting
    subcategory2: "#8b4513", // Saddle brown for Structural
    subcategory3: "#475569", // Slate/Steel for Systems
    subcategory4: "#b45309", // Terracotta/Clay for Finishings
    subcategory5: "#5c4033", // Dark brown for Other
    default: "#5c4033",      // Dark brown
  },
  tier2: {
    // Permitting tier2 colors (tier2_1 to tier2_5) - green/olive family
    tier2_1: "#3d5a22",   // Dark Forest
    tier2_2: "#475e29",   // Deep Olive
    tier2_3: "#556b2f",   // Forest Green
    tier2_4: "#6b8e3a",   // Moss Green
    tier2_5: "#7da647",   // Sage Green

    // Structural tier2 colors (tier2_6 to tier2_10) - brown/earth family
    tier2_6: "#6b3410",   // Dark Earth
    tier2_7: "#7a3e13",   // Deep Brown
    tier2_8: "#8b4513",   // Saddle Brown
    tier2_9: "#a0522d",   // Sienna
    tier2_10: "#b8651b",  // Rustic Brown

    // Systems tier2 colors (tier2_11 to tier2_15) - blue/slate family
    tier2_11: "#334155",  // Dark Slate
    tier2_12: "#3d4a5c",  // Deep Steel
    tier2_13: "#475569",  // Slate Blue
    tier2_14: "#5a6a7f",  // Medium Slate
    tier2_15: "#64748b",  // Light Slate

    // Finishings tier2 colors (tier2_16 to tier2_20) - orange/terracotta family
    tier2_16: "#92400e",  // Dark Terracotta
    tier2_17: "#a14a0d",  // Deep Clay
    tier2_18: "#b45309",  // Terracotta
    tier2_19: "#c2621e",  // Light Clay
    tier2_20: "#d97706",  // Amber Clay

    // Legacy named colors (backward compatibility)
    // Permitting subcategories
    permits: "#556b2f",        // Forest Green

    // Structural subcategories
    foundation: "#6b3410",     // Dark Earth (tier2_6)
    framing: "#7a3e13",        // Deep Brown (tier2_7)
    roofing: "#8b4513",        // Saddle Brown (tier2_8)
    lumber: "#a0522d",         // Sienna (tier2_9)
    shingles: "#b8651b",       // Rustic Brown (tier2_10)

    // Systems subcategories
    electrical: "#334155",     // Dark Slate (tier2_11)
    plumbing: "#3d4a5c",       // Deep Steel (tier2_12)
    hvac: "#475569",           // Slate Blue (tier2_13)

    // Finishings subcategories
    flooring: "#92400e",       // Dark Terracotta (tier2_16)
    paint: "#a14a0d",          // Deep Clay (tier2_17)
    fixtures: "#b45309",       // Terracotta (tier2_18)
    landscaping: "#c2621e",    // Light Clay (tier2_19)

    // Additional mappings for other contexts
    barriers: "#3d5a22",       // Dark Forest
    drywall: "#475e29",        // Deep Olive
    exteriors: "#6b8e3a",      // Moss Green
    siding: "#7da647",         // Sage Green
    insulation: "#5a6a7f",     // Medium Slate
    windows: "#92400e",        // Dark Terracotta
    doors: "#a14a0d",          // Deep Clay
    cabinets: "#c2621e",       // Light Clay
    other: "#5c4033",          // Dark brown
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

    // Legacy named colors
    foundation: "#93c5fd",  // Blue light
    framing: "#bfdbfe",     // Blue lighter
    roofing: "#60a5fa",     // Blue medium
    lumber: "#3b82f6",      // Blue
    shingles: "#2563eb",    // Blue dark
    electrical: "#a5b4fc",  // Indigo light
    plumbing: "#818cf8",    // Indigo medium
    hvac: "#6366f1",        // Indigo
    barriers: "#fda4af",    // Rose light
    drywall: "#fb7185",     // Rose medium
    exteriors: "#f43f5e",   // Rose
    siding: "#e11d48",      // Rose dark
    insulation: "#be123c",  // Rose darker
    windows: "#fcd34d",     // Yellow light
    doors: "#fbbf24",       // Yellow medium
    cabinets: "#f59e0b",    // Amber
    fixtures: "#d97706",    // Amber dark
    flooring: "#b45309",    // Amber darker
    paint: "#f97316",       // Orange
    permits: "#a78bfa",     // Purple medium
    other: "#a78bfa",       // Purple medium
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
    subcategory4: "#ff9800", // Mango Orange
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
    
    // Color palette 4 - orange/mango family
    tier2_14: "#e65100",  // Deep Orange
    tier2_15: "#f57c00",  // Dark Orange
    tier2_16: "#ff9800",  // Mango Orange
    tier2_17: "#ffa726",  // Light Orange
    tier2_18: "#ffb74d",  // Pale Orange
    tier2_19: "#ff6f00",  // Burnt Orange

    // Extra color
    tier2_20: "#4f46e5",  // Indigo dark

    // Legacy named colors
    foundation: "#1d4ed8",  // Blue dark
    framing: "#2563eb",     // Blue
    roofing: "#3b82f6",     // Blue medium
    lumber: "#60a5fa",      // Blue light
    shingles: "#93c5fd",    // Blue lighter
    electrical: "#7c3aed",  // Violet
    plumbing: "#8b5cf6",    // Violet medium
    hvac: "#a78bfa",        // Violet light
    barriers: "#be185d",    // Pink dark
    drywall: "#db2777",     // Pink
    exteriors: "#ec4899",   // Pink medium
    siding: "#f472b6",      // Pink light
    insulation: "#f9a8d4",  // Pink lighter
    windows: "#e65100",     // Deep Orange
    doors: "#f57c00",       // Dark Orange
    cabinets: "#ff9800",    // Mango Orange
    fixtures: "#ffa726",    // Light Orange
    flooring: "#ffb74d",    // Pale Orange
    paint: "#ff6f00",       // Burnt Orange
    permits: "#4f46e5",     // Indigo dark
    other: "#6366f1",       // Indigo
  }
};

/**
 * Classic Construction Theme
 * A traditional construction-themed palette with high contrast and visibility
 */
export const CLASSIC_CONSTRUCTION_THEME: ColorTheme = {
  name: "Classic Construction",
  description: "Bold construction colors with excellent visibility and contrast",
  tier1: {
    subcategory1: "#d97706", // Construction orange for structure
    subcategory2: "#0369a1", // Sky blue for technical systems
    subcategory3: "#dc2626", // Safety red for protective elements
    subcategory4: "#16a34a", // Green for finished elements
    subcategory5: "#eab308", // Caution yellow for permitting
    default: "#d97706",     // Construction orange
  },
  tier2: {
    // Color palette 1 - orange/amber family (structural)
    tier2_1: "#92400e",  // Dark brown (concrete)
    tier2_2: "#b45309",  // Deep orange (foundation)
    tier2_3: "#d97706",  // Construction orange
    tier2_4: "#f59e0b",  // Amber
    tier2_5: "#fbbf24",  // Light amber

    // Color palette 2 - blue family (systems)
    tier2_6: "#075985",  // Deep blue
    tier2_7: "#0369a1",  // Sky blue
    tier2_8: "#0284c7",  // Light blue

    // Color palette 3 - red family (sheathing/barriers)
    tier2_9: "#991b1b",   // Dark red
    tier2_10: "#b91c1c",  // Deep red
    tier2_11: "#dc2626",  // Safety red
    tier2_12: "#ef4444",  // Red
    tier2_13: "#f87171",  // Light red

    // Color palette 4 - green family (finishings)
    tier2_14: "#15803d",  // Dark green
    tier2_15: "#16a34a",  // Green
    tier2_16: "#22c55e",  // Light green
    tier2_17: "#4ade80",  // Bright green
    tier2_18: "#86efac",  // Pale green
    tier2_19: "#bbf7d0",  // Very light green

    // Extra color
    tier2_20: "#eab308",  // Yellow

    // Legacy named colors
    foundation: "#92400e",  // Dark brown (concrete)
    framing: "#b45309",     // Deep orange (wood)
    roofing: "#d97706",     // Construction orange
    lumber: "#f59e0b",      // Amber
    shingles: "#fbbf24",    // Light amber
    electrical: "#075985",  // Deep blue
    plumbing: "#0369a1",    // Sky blue
    hvac: "#0284c7",        // Light blue
    barriers: "#991b1b",    // Dark red
    drywall: "#b91c1c",     // Deep red
    exteriors: "#dc2626",   // Safety red
    siding: "#ef4444",      // Red
    insulation: "#f87171",  // Light red
    windows: "#15803d",     // Dark green
    doors: "#16a34a",       // Green
    cabinets: "#22c55e",    // Light green
    fixtures: "#4ade80",    // Bright green
    flooring: "#86efac",    // Pale green
    paint: "#bbf7d0",       // Very light green
    permits: "#eab308",     // Yellow
    other: "#d97706",       // Construction orange
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
    // Indexed colors for parent-child relationship
    // Structural/Push (subcategory1) - dark/black family (tier2_1 to tier2_5)
    tier2_1: "#0F0000",    // Black
    tier2_2: "#220000",    // Very Dark Red
    tier2_3: "#330000",    // Volcanic Black
    tier2_4: "#4F0000",    // Deep Red
    tier2_5: "#661a00",    // Ash Brown

    // Systems/Pull (subcategory2) - red family (tier2_6 to tier2_8)
    tier2_6: "#660000",    // Dark Red
    tier2_7: "#8B0000",    // Molten Red
    tier2_8: "#AA0000",    // Red Hot

    // Sheathing/Legs (subcategory3) - orange family (tier2_9 to tier2_13)
    tier2_9: "#CC3300",    // Lava Dark
    tier2_10: "#DD4400",   // Burnt Red
    tier2_11: "#FF4500",   // Lava Orange
    tier2_12: "#FF6600",   // Fire Orange
    tier2_13: "#FF7700",   // Amber Orange

    // Finishings/Cardio (subcategory4) - amber/yellow family (tier2_14 to tier2_20)
    tier2_14: "#CC8500",   // Dark Amber
    tier2_15: "#DD9500",   // Medium Amber
    tier2_16: "#FFAA00",   // Deep Amber
    tier2_17: "#FFA500",   // Burnt Amber
    tier2_18: "#FFB700",   // Golden Amber
    tier2_19: "#FFC800",   // Light Amber
    tier2_20: "#FFD700",   // Gold

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
 * Cyberpunk aesthetic with dark noir backgrounds and vibrant neon accents
 */
export const NEON_NOIR_THEME: ColorTheme = {
  name: "Neon Noir",
  description: "Dark cyberpunk noir with bright neon accents - black, cyan, pink, and yellow",
  tier1: {
    subcategory1: "#1a1a1a", // Noir Black
    subcategory2: "#00ffff", // Electric Cyan
    subcategory3: "#ff00ff", // Neon Magenta
    subcategory4: "#ffff00", // Neon Yellow
    subcategory5: "#ec4899", // Hot Pink
    default: "#1a1a1a",     // Noir Black
  },
  tier2: {
    // Color palette 1 - black/dark family (tier2_1 to tier2_5)
    tier2_1: "#000000",    // Pure Black
    tier2_2: "#0a0a0a",    // Deep Black
    tier2_3: "#1a1a1a",    // Noir Black
    tier2_4: "#2a2a2a",    // Dark Gray
    tier2_5: "#404040",    // Medium Dark Gray

    // Color palette 2 - cyan family (tier2_6 to tier2_10)
    tier2_6: "#008b8b",    // Deep Cyan
    tier2_7: "#00a0a0",    // Dark Cyan
    tier2_8: "#00cccc",    // Medium Cyan
    tier2_9: "#00e5e5",    // Bright Cyan
    tier2_10: "#00ffff",   // Electric Cyan

    // Color palette 3 - magenta/pink family (tier2_11 to tier2_15)
    tier2_11: "#cc00cc",   // Dark Magenta
    tier2_12: "#dd00dd",   // Medium Magenta
    tier2_13: "#ff00ff",   // Neon Magenta
    tier2_14: "#ff33ff",   // Light Magenta
    tier2_15: "#ff66ff",   // Pale Magenta

    // Color palette 4 - yellow family (tier2_16 to tier2_20)
    tier2_16: "#cccc00",   // Dark Yellow
    tier2_17: "#dddd00",   // Medium Yellow
    tier2_18: "#ffff00",   // Neon Yellow
    tier2_19: "#ffff33",   // Light Yellow
    tier2_20: "#ffff66",   // Pale Yellow

    // Legacy named colors - MUST match tier2 indexed colors above
    foundation: "#000000", // Pure Black (tier2_1)
    framing: "#0a0a0a",    // Deep Black (tier2_2)
    roofing: "#1a1a1a",    // Noir Black (tier2_3)
    lumber: "#2a2a2a",     // Dark Gray (tier2_4)
    shingles: "#404040",   // Medium Dark Gray (tier2_5)
    electrical: "#008b8b", // Deep Cyan (tier2_6)
    plumbing: "#00a0a0",   // Dark Cyan (tier2_7)
    hvac: "#00cccc",       // Medium Cyan (tier2_8)
    barriers: "#cc00cc",   // Dark Magenta (tier2_11)
    drywall: "#dd00dd",    // Medium Magenta (tier2_12)
    exteriors: "#ff00ff",  // Neon Magenta (tier2_13)
    siding: "#ff33ff",     // Light Magenta (tier2_14)
    insulation: "#ff66ff", // Pale Magenta (tier2_15)
    windows: "#cccc00",    // Dark Yellow (tier2_16)
    doors: "#dddd00",      // Medium Yellow (tier2_17)
    cabinets: "#ffff00",   // Neon Yellow (tier2_18)
    fixtures: "#ffff33",   // Light Yellow (tier2_19)
    flooring: "#ffff66",   // Pale Yellow (tier2_20)
    paint: "#ffff99",      // Very Pale Yellow
    permits: "#ec4899",    // Hot Pink
    other: "#1a1a1a",      // Noir Black
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
    // Indexed colors for parent-child relationship
    // Structural/Push (subcategory1) - bronze family (tier2_1 to tier2_5)
    tier2_1: "#3D2914",    // Dark Bronze
    tier2_2: "#4A3319",    // Medium Bronze
    tier2_3: "#5C4033",    // Dust Bronze
    tier2_4: "#6B4423",    // Bronze
    tier2_5: "#7E5A40",    // Light Bronze

    // Systems/Pull (subcategory2) - clay family (tier2_6 to tier2_8)
    tier2_6: "#8B4513",    // Brown
    tier2_7: "#996633",    // Earth Clay
    tier2_8: "#A0522D",    // Martian Clay

    // Sheathing/Legs (subcategory3) - rust family (tier2_9 to tier2_13)
    tier2_9: "#703A00",    // Deep Rust
    tier2_10: "#7E4200",   // Dark Rust
    tier2_11: "#8B4513",   // Rust Brown
    tier2_12: "#964B00",   // Copper
    tier2_13: "#A56000",   // Amber Rust

    // Finishings/Cardio (subcategory4) - lilac/purple family (tier2_14 to tier2_20)
    tier2_14: "#7B68EE",   // Medium Slate Blue
    tier2_15: "#8470FF",   // Light Slate Blue
    tier2_16: "#9370DB",   // Alien Lilac
    tier2_17: "#A080FF",   // Light Purple
    tier2_18: "#B090FF",   // Lighter Purple
    tier2_19: "#C0A0FF",   // Pale Purple
    tier2_20: "#D0B0FF",   // Very Pale Purple

    // Legacy named colors
    foundation: "#3D2914", // Dark Bronze
    framing: "#4A3319",    // Medium Bronze
    roofing: "#5C4033",    // Dust Bronze
    lumber: "#6B4423",     // Bronze
    shingles: "#7E5A40",   // Light Bronze
    electrical: "#8B4513", // Brown
    plumbing: "#996633",   // Earth Clay
    hvac: "#A0522D",       // Martian Clay
    barriers: "#703A00",   // Deep Rust
    drywall: "#7E4200",    // Dark Rust
    exteriors: "#8B4513",  // Rust Brown
    siding: "#964B00",     // Copper
    insulation: "#A56000", // Amber Rust
    windows: "#7B68EE",    // Medium Slate Blue
    doors: "#8470FF",      // Light Slate Blue
    cabinets: "#9370DB",   // Alien Lilac
    fixtures: "#A080FF",   // Light Purple
    flooring: "#B090FF",   // Lighter Purple
    paint: "#C0A0FF",      // Pale Purple
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
    // Indexed colors for parent-child relationship
    // Structural/Push (subcategory1) - sapphire/blue family (tier2_1 to tier2_5)
    tier2_1: "#0C4295",    // Deep Sapphire
    tier2_2: "#0F52BA",    // Sapphire Blue
    tier2_3: "#1E6BDB",    // Medium Sapphire
    tier2_4: "#4289E8",    // Light Sapphire
    tier2_5: "#6BA1F4",    // Pale Sapphire

    // Systems/Pull (subcategory2) - emerald/green family (tier2_6 to tier2_8)
    tier2_6: "#2E8B57",    // Sea Green
    tier2_7: "#3CB371",    // Medium Sea Green
    tier2_8: "#50C878",    // Emerald Green

    // Sheathing/Legs (subcategory3) - gold/yellow family (tier2_9 to tier2_13)
    tier2_9: "#B8860B",    // Dark Goldenrod
    tier2_10: "#DAA520",   // Goldenrod
    tier2_11: "#FFD700",   // Topaz Gold
    tier2_12: "#FFDF00",   // Golden Yellow
    tier2_13: "#FFE87C",   // Pale Gold

    // Finishings/Cardio (subcategory4) - crystal/lavender family (tier2_14 to tier2_20)
    tier2_14: "#9370DB",   // Medium Purple
    tier2_15: "#CCCCFF",   // Periwinkle
    tier2_16: "#D8D8FF",   // Light Periwinkle
    tier2_17: "#E6E6FA",   // Crystal Mist
    tier2_18: "#EEE8FF",   // Mist Light
    tier2_19: "#F5F0FF",   // Very Light Lavender
    tier2_20: "#FFF8FF",   // White Mist

    // Legacy named colors
    foundation: "#0C4295", // Deep Sapphire
    framing: "#0F52BA",    // Sapphire Blue
    roofing: "#1E6BDB",    // Medium Sapphire
    lumber: "#4289E8",     // Light Sapphire
    shingles: "#6BA1F4",   // Pale Sapphire
    electrical: "#2E8B57", // Sea Green
    plumbing: "#3CB371",   // Medium Sea Green
    hvac: "#50C878",       // Emerald Green
    barriers: "#B8860B",   // Dark Goldenrod
    drywall: "#DAA520",    // Goldenrod
    exteriors: "#FFD700",  // Topaz Gold
    siding: "#FFDF00",     // Golden Yellow
    insulation: "#FFE87C", // Pale Gold
    windows: "#CCCCFF",    // Periwinkle
    doors: "#D8D8FF",      // Light Periwinkle
    cabinets: "#E6E6FA",   // Crystal Mist
    fixtures: "#EEE8FF",   // Mist Light
    flooring: "#F5F0FF",   // Very Light Lavender
    paint: "#FFF8FF",      // White Mist
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
    // Indexed colors for parent-child relationship
    // Structural/Push (subcategory1) - plum/purple family (tier2_1 to tier2_5)
    tier2_1: "#2A004C",    // Deep Purple
    tier2_2: "#3A0069",    // Medium Deep Purple
    tier2_3: "#4B0082",    // Velvet Plum
    tier2_4: "#5C1A98",    // Medium Purple
    tier2_5: "#6A359C",    // Light Plum

    // Systems/Pull (subcategory2) - wine/red family (tier2_6 to tier2_8)
    tier2_6: "#5B0000",    // Very Dark Red
    tier2_7: "#6B0000",    // Deep Red
    tier2_8: "#800000",    // Dark Merlot

    // Sheathing/Legs (subcategory3) - gray family (tier2_9 to tier2_13)
    tier2_9: "#1A2929",    // Very Dark Gray
    tier2_10: "#203838",   // Dark Storm Gray
    tier2_11: "#2F4F4F",   // Storm Gray
    tier2_12: "#3D6262",   // Medium Gray
    tier2_13: "#4F7777",   // Light Gray

    // Finishings/Cardio (subcategory4) - lavender family (tier2_14 to tier2_20)
    tier2_14: "#9932CC",   // Dark Orchid
    tier2_15: "#A845D9",   // Medium Orchid
    tier2_16: "#BA55D3",   // Lavender Luxe
    tier2_17: "#C969DD",   // Medium Lavender
    tier2_18: "#D880E6",   // Light Lavender
    tier2_19: "#E89FEE",   // Pale Lavender
    tier2_20: "#F0B0FF",   // Very Pale Lavender

    // Legacy named colors
    foundation: "#2A004C", // Deep Purple
    framing: "#3A0069",    // Medium Deep Purple
    roofing: "#4B0082",    // Velvet Plum
    lumber: "#5C1A98",     // Medium Purple
    shingles: "#6A359C",   // Light Plum
    electrical: "#5B0000", // Very Dark Red
    plumbing: "#6B0000",   // Deep Red
    hvac: "#800000",       // Dark Merlot
    barriers: "#1A2929",   // Very Dark Gray
    drywall: "#203838",    // Dark Storm Gray
    exteriors: "#2F4F4F",  // Storm Gray
    siding: "#3D6262",     // Medium Gray
    insulation: "#4F7777", // Light Gray
    windows: "#9932CC",    // Dark Orchid
    doors: "#A845D9",      // Medium Orchid
    cabinets: "#BA55D3",   // Lavender Luxe
    fixtures: "#C969DD",   // Medium Lavender
    flooring: "#D880E6",   // Light Lavender
    paint: "#E89FEE",      // Pale Lavender
    permits: "#800080",    // Deep Purple
    other: "#8B008B",      // Medium Purple
  }
};

/**
 * Paper Bright Theme
 * More vibrant and visible version of Paper Studio with enhanced contrast
 */
export const PAPER_BRIGHT_THEME: ColorTheme = {
  name: "Paper Bright",
  description: "Vibrant, high-visibility paper tones with enhanced contrast and clarity",
  tier1: {
    subcategory1: "#E8D4A2", // Custard Blonde
    subcategory2: "#8B7355", // Warm Cardboard
    subcategory3: "#6B7280", // Slate Gray
    subcategory4: "#D4A574", // Kraft Tan
    subcategory5: "#94A3B8", // Steel
    default: "#94A3B8",      // Steel
  },
  tier2: {
    // New generic structure - brighter versions
    tier2_1: "#6B7280",    // Medium Gray (brighter than #A9A9A9)
    tier2_2: "#94A3B8",    // Steel Gray
    tier2_3: "#9CA3AF",    // Bright Gray
    tier2_4: "#CBD5E1",    // Light Steel
    tier2_5: "#E2E8F0",    // Pearl
    tier2_6: "#6D5A47",    // Deep Taupe
    tier2_7: "#7A6750",    // Rich Taupe
    tier2_8: "#8B7355",    // Warm Cardboard
    tier2_9: "#4B5563",    // Charcoal
    tier2_10: "#64748B",   // Slate Medium
    tier2_11: "#6B7280",   // Slate Gray
    tier2_12: "#94A3B8",   // Steel
    tier2_13: "#B0B8C4",   // Light Silver
    tier2_14: "#D4A574",   // Kraft Tan
    tier2_15: "#DDB87F",   // Warm Tan
    tier2_16: "#E8C9A1",   // Light Kraft
    tier2_17: "#F0DEC0",   // Cream Paper
    tier2_18: "#F5E6D3",   // Vanilla Cream
    tier2_19: "#FAF0E6",   // Linen
    tier2_20: "#A8B4C0",   // Medium Steel

    // Old structure for backward compatibility - brighter versions
    foundation: "#6B7280", // Medium Gray
    framing: "#94A3B8",    // Steel Gray
    roofing: "#9CA3AF",    // Bright Gray
    lumber: "#CBD5E1",     // Light Steel
    shingles: "#E2E8F0",   // Pearl
    electrical: "#6D5A47", // Deep Taupe
    plumbing: "#7A6750",   // Rich Taupe
    hvac: "#8B7355",       // Warm Cardboard
    barriers: "#4B5563",   // Charcoal
    drywall: "#64748B",    // Slate Medium
    exteriors: "#6B7280",  // Slate Gray
    siding: "#94A3B8",     // Steel
    insulation: "#B0B8C4", // Light Silver
    windows: "#D4A574",    // Kraft Tan
    doors: "#DDB87F",      // Warm Tan
    cabinets: "#E8C9A1",   // Light Kraft
    fixtures: "#F0DEC0",   // Cream Paper
    flooring: "#F5E6D3",   // Vanilla Cream
    paint: "#FAF0E6",      // Linen
    permits: "#A8B4C0",    // Medium Steel
    other: "#B8C4D0",      // Light Steel
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
  "paper-bright": PAPER_BRIGHT_THEME,
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

  // IMPORTANT: Also apply comprehensive tier2 colors and CSS variables
  // Dynamically import to avoid circular dependency
  import('./dynamic-colors').then(({ applyThemeColorsToCSS }) => {
    applyThemeColorsToCSS(theme);
  });
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
  const normalizedCategory = (category || "").toLowerCase().trim();

  // Map category names to tier1 subcategory keys
  const categoryMap: Record<string, keyof typeof activeTheme.tier1> = {
    // Home Builder preset mappings (earth-tone theme)
    'permitting': 'subcategory1',      // Forest/Olive green
    'structural': 'subcategory2',       // Earth browns
    'systems': 'subcategory3',          // Steel blues
    'finishings': 'subcategory4',       // Terracotta/Clay

    // Standard Construction preset mappings (classic-construction theme)
    // 'structural': 'subcategory1',    // Already mapped above
    // 'systems': 'subcategory2',       // Conflicts with above
    'sheathing': 'subcategory3',
    // 'finishings': 'subcategory4',    // Already mapped above

    // Direct subcategory names
    'subcategory1': 'subcategory1',
    'subcategory2': 'subcategory2',
    'subcategory3': 'subcategory3',
    'subcategory4': 'subcategory4',
    'subcategory5': 'subcategory5',

    // Digital Marketing preset (4 core phases)
    'foundation': 'subcategory1',
    'creation': 'subcategory2',
    'distribution': 'subcategory3',
    'optimization': 'subcategory4',

    // Workout categories
    'push': 'subcategory1',
    'pull': 'subcategory2',
    'legs': 'subcategory3',
    'cardio': 'subcategory4',

    // Software/product categories
    'software engineering': 'subcategory1',
    'product management': 'subcategory2',
    'design / ux': 'subcategory3',
    'marketing / go to market (gtm)': 'subcategory4',
    'marketing / go-to-market (gtm)': 'subcategory4',
    'devops / infrastructure': 'subcategory5'
  };

  const mappedKey = categoryMap[normalizedCategory];
  if (mappedKey && mappedKey in activeTheme.tier1) {
    const color = activeTheme.tier1[mappedKey];
    console.log(`🎨 getThemeTier1Color: "${category}" → normalized: "${normalizedCategory}" → key: "${mappedKey}" → color: ${color} (theme: ${activeTheme.name})`);
    return color;
  }

  console.log(`⚠️ getThemeTier1Color: "${category}" → normalized: "${normalizedCategory}" → NO MATCH → default: ${activeTheme.tier1.default} (theme: ${activeTheme.name})`);
  return activeTheme.tier1.default;
}

/**
 * Get the color for a tier2 category from a specific theme or the active theme
 * @param category The tier2 category name
 * @param theme Optional theme to use (defaults to active theme)
 * @param parentCategory Optional parent tier1 category to determine color group
 * @returns The hex color for the category
 */
export function getThemeTier2Color(category: string, theme?: ColorTheme, parentCategory?: string): string {
  const activeTheme = theme || getActiveColorTheme();
  const normalizedCategory = (category || "").toLowerCase();

  // First, try direct match (for backward compatibility with named categories)
  if (normalizedCategory in activeTheme.tier2) {
    return activeTheme.tier2[normalizedCategory as keyof typeof activeTheme.tier2];
  }

  // If we have a parent category, determine which tier2 color group to use
  if (parentCategory) {
    const normalizedParent = parentCategory.toLowerCase();

    // Map tier1 categories to their tier2 color ranges
    // For Home Builder (earth-tone):
    //   Permitting (subcategory1) -> tier2_1 to tier2_5 (green/olive)
    //   Structural (subcategory2) -> tier2_6 to tier2_10 (brown/earth)
    //   Systems (subcategory3) -> tier2_11 to tier2_15 (blue/slate)
    //   Finishings (subcategory4) -> tier2_16 to tier2_20 (orange/terracotta)
    let startIndex = 1;
    let endIndex = 5;

    if (
      normalizedParent === 'subcategory1' ||
      normalizedParent === 'permitting' ||
      normalizedParent === 'push' ||
      normalizedParent === 'software engineering' ||
      normalizedParent === 'foundation'
    ) {
      startIndex = 1;
      endIndex = 5;
    } else if (
      normalizedParent === 'subcategory2' ||
      normalizedParent === 'structural' ||
      normalizedParent === 'pull' ||
      normalizedParent === 'product management' ||
      normalizedParent === 'creation'
    ) {
      startIndex = 6;
      endIndex = 10;
    } else if (
      normalizedParent === 'subcategory3' ||
      normalizedParent === 'systems' ||
      normalizedParent === 'sheathing' ||
      normalizedParent === 'legs' ||
      normalizedParent === 'design / ux' ||
      normalizedParent === 'distribution'
    ) {
      startIndex = 11;
      endIndex = 15;
    } else if (
      normalizedParent === 'subcategory4' ||
      normalizedParent === 'finishings' ||
      normalizedParent === 'cardio' ||
      normalizedParent === 'marketing / go to market (gtm)' ||
      normalizedParent === 'marketing / go-to-market (gtm)' ||
      normalizedParent === 'optimization'
    ) {
      startIndex = 16;
      endIndex = 20;
    } else if (normalizedParent === 'subcategory5' || normalizedParent === 'devops / infrastructure') {
      startIndex = 1;
      endIndex = 5;
    }

    // Use hash of category name to pick a color from the appropriate range
    const hash = category.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const rangeSize = endIndex - startIndex + 1;
    const colorIndex = startIndex + (Math.abs(hash) % rangeSize);

    const tierKey = `tier2_${colorIndex}` as keyof typeof activeTheme.tier2;
    if (tierKey in activeTheme.tier2) {
      return activeTheme.tier2[tierKey];
    }
  }

  return activeTheme.tier2.other || activeTheme.tier1.default;
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
