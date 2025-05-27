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
 * Molten Core Theme
 * Intense volcanic reds and lava-glow oranges contrasted with charcoal blacks
 */
export const MOLTEN_CORE_THEME: ColorTheme = {
  name: "Molten Core",
  description: "Intense volcanic reds and lava-glow oranges contrasted with charcoal blacks",
  tier1: {
    structural: "#330000", // Volcanic Black
    systems: "#8B0000",    // Molten Red
    sheathing: "#FF4500",  // Lava Orange
    finishings: "#FFA500", // Burnt Amber
    default: "#BF5700",    // Dark Amber
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
 * Cloud Circuit Theme
 * Futuristic whites and cool metallics inspired by tech and cloud computing
 */
export const CLOUD_CIRCUIT_THEME: ColorTheme = {
  name: "Cloud Circuit",
  description: "Futuristic whites and cool metallics inspired by tech and cloud computing",
  tier1: {
    structural: "#E0E0E0", // Cloud Gray
    systems: "#C0C0C0",    // Silver
    sheathing: "#B0E0E6",  // Tech Blue
    finishings: "#FFFFFF", // White Light
    default: "#D3D3D3",    // Light Gray
  },
  tier2: {
    // Structural subcategories - gray family
    foundation: "#A9A9A9", // Dark Gray
    framing: "#C0C0C0",    // Silver
    roofing: "#D3D3D3",    // Light Gray
    lumber: "#DCDCDC",     // Gainsboro
    shingles: "#E0E0E0",   // Cloud Gray
    
    // Systems subcategories - silver/metallic family
    electrical: "#A0A0A0", // Medium Gray
    plumbing: "#B0B0B0",   // Light Medium Gray
    hvac: "#C0C0C0",       // Silver
    
    // Sheathing subcategories - blue family
    barriers: "#87CEEB",   // Sky Blue
    drywall: "#ADD8E6",    // Light Blue
    exteriors: "#B0E0E6",  // Tech Blue
    siding: "#C0E8F0",     // Light Tech Blue
    insulation: "#D0F0F8", // Pale Blue
    
    // Finishings subcategories - white family
    windows: "#F0F0F0",    // Snow White
    doors: "#F5F5F5",      // Off White
    cabinets: "#F8F8F8",   // White Smoke
    fixtures: "#FAFAFA",   // Almost White
    flooring: "#FCFCFC",   // Bright White
    paint: "#FFFFFF",      // White Light
    
    // Default
    permits: "#D8D8D8",    // Light Gray Alt
    other: "#E8E8E8",      // Very Light Gray
  }
};

/**
 * Solar Flare Theme
 * Explosive energy in bright yellows, golds, and radiant reds
 */
export const SOLAR_FLARE_THEME: ColorTheme = {
  name: "Solar Flare",
  description: "Explosive energy in bright yellows, golds, and radiant reds",
  tier1: {
    structural: "#FFD700", // Solar Gold
    systems: "#FF8C00",    // Flare Orange
    sheathing: "#FF0000",  // Red Burst
    finishings: "#FFFFE0", // Lemon Glow
    default: "#FFA500",    // Orange
  },
  tier2: {
    // Structural subcategories - gold family
    foundation: "#B8860B", // Dark Gold
    framing: "#DAA520",    // Golden Rod
    roofing: "#FFD700",    // Solar Gold
    lumber: "#FFDF00",     // Golden Yellow
    shingles: "#FFE87C",   // Pale Gold
    
    // Systems subcategories - orange family
    electrical: "#FF4500", // Red-Orange
    plumbing: "#FF6347",   // Tomato
    hvac: "#FF8C00",       // Flare Orange
    
    // Sheathing subcategories - red family
    barriers: "#8B0000",   // Dark Red
    drywall: "#B22222",    // Fire Brick
    exteriors: "#DC143C",  // Crimson
    siding: "#FF0000",     // Red Burst
    insulation: "#FF4444", // Light Red
    
    // Finishings subcategories - yellow family
    windows: "#FFFF00",    // Yellow
    doors: "#FFFF66",      // Light Yellow
    cabinets: "#FFFFAA",   // Pale Yellow
    fixtures: "#FFFFC8",   // Very Light Yellow
    flooring: "#FFFFE0",   // Lemon Glow
    paint: "#FFFFF0",      // Ivory
    
    // Default
    permits: "#FFA500",    // Orange
    other: "#FFB84D",      // Light Orange
  }
};

/**
 * Obsidian Mirage Theme
 * Deep blacks, iridescent purples, and flashes of green inspired by volcanic glass
 */
export const OBSIDIAN_MIRAGE_THEME: ColorTheme = {
  name: "Obsidian Mirage",
  description: "Deep blacks, iridescent purples, and flashes of green inspired by volcanic glass",
  tier1: {
    structural: "#0B0B0B", // Obsidian Black
    systems: "#4B0082",    // Indigo
    sheathing: "#2E8B57",  // Illusion Green
    finishings: "#9932CC", // Amethyst Edge
    default: "#2D2D2D",    // Deep Gray
  },
  tier2: {
    // Structural subcategories - black family
    foundation: "#000000", // Pure Black
    framing: "#0A0A0A",    // Nearly Black
    roofing: "#0B0B0B",    // Obsidian Black
    lumber: "#1A1A1A",     // Very Dark Gray
    shingles: "#2D2D2D",   // Deep Gray
    
    // Systems subcategories - indigo/purple family
    electrical: "#2E0854", // Deep Indigo
    plumbing: "#4B0082",   // Indigo
    hvac: "#663399",       // Rebecca Purple
    
    // Sheathing subcategories - green family
    barriers: "#006400",   // Dark Green
    drywall: "#228B22",    // Forest Green
    exteriors: "#2E8B57",  // Illusion Green
    siding: "#3CB371",     // Medium Sea Green
    insulation: "#66CDAA", // Medium Aquamarine
    
    // Finishings subcategories - purple family
    windows: "#800080",    // Purple
    doors: "#8A2BE2",      // Blue Violet
    cabinets: "#9370DB",   // Medium Purple
    fixtures: "#9932CC",   // Amethyst Edge
    flooring: "#BA55D3",   // Medium Orchid
    paint: "#DA70D6",      // Orchid
    
    // Default
    permits: "#483D8B",    // Dark Slate Blue
    other: "#6A5ACD",      // Slate Blue
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
    structural: "#0A0A0A", // Pitch Black
    systems: "#00FFFF",    // Electric Cyan
    sheathing: "#FF00FF",  // Neon Magenta
    finishings: "#FFFF00", // Signal Yellow
    default: "#191919",    // Dark Gray
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
    structural: "#5C4033", // Dust Bronze
    systems: "#A0522D",    // Martian Clay
    sheathing: "#8B4513",  // Rust Brown
    finishings: "#9370DB", // Alien Lilac
    default: "#6B4423",    // Bronze
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
    structural: "#0F52BA", // Sapphire Blue
    systems: "#50C878",    // Emerald Green
    sheathing: "#FFD700",  // Topaz Gold
    finishings: "#E6E6FA", // Crystal Mist
    default: "#4169E1",    // Royal Blue
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
    structural: "#DCDCDC", // Recycled Gray
    systems: "#B0A990",    // Cardboard Taupe
    sheathing: "#A9A9A9",  // Graphite Sketch
    finishings: "#F5F5DC", // Paper Cream
    default: "#C0C0C0",    // Silver
  },
  tier2: {
    // Structural subcategories - gray family
    foundation: "#A9A9A9", // Dark Gray
    framing: "#BEBEBE",    // Medium Gray
    roofing: "#DCDCDC",    // Recycled Gray
    lumber: "#E8E8E8",     // Light Gray
    shingles: "#F5F5F5",   // White Smoke
    
    // Systems subcategories - taupe/brown family
    electrical: "#998877", // Dark Taupe
    plumbing: "#A99983",   // Medium Taupe
    hvac: "#B0A990",       // Cardboard Taupe
    
    // Sheathing subcategories - graphite family
    barriers: "#696969",   // Dim Gray
    drywall: "#808080",    // Medium Gray
    exteriors: "#A9A9A9",  // Graphite Sketch
    siding: "#C0C0C0",     // Silver
    insulation: "#D3D3D3", // Light Gray
    
    // Finishings subcategories - cream/paper family
    windows: "#F0E9D2",    // Antique White
    doors: "#F2EAD7",      // Light Wheat
    cabinets: "#F5F5DC",   // Paper Cream
    fixtures: "#F5F5F0",   // Off White
    flooring: "#F8F8FF",   // Ghost White
    paint: "#FFF8E7",      // Cornsilk
    
    // Default
    permits: "#C8C8C8",    // Medium Light Gray
    other: "#D8D8D8",      // Very Light Gray
  }
};

/**
 * Biohazard Zone Theme
 * High-alert theme using hazard yellow, warning red, and sterile white
 */
export const BIOHAZARD_ZONE_THEME: ColorTheme = {
  name: "Biohazard Zone",
  description: "High-alert theme using hazard yellow, warning red, and sterile white",
  tier1: {
    structural: "#B22222", // Warning Red
    systems: "#FFFF00",    // Hazard Yellow
    sheathing: "#C0C0C0",  // Sterile Steel
    finishings: "#FFFFFF", // Clinical White
    default: "#000000",    // Black
  },
  tier2: {
    // Structural subcategories - red family
    foundation: "#800000", // Maroon
    framing: "#A52A2A",    // Brown
    roofing: "#B22222",    // Warning Red
    lumber: "#CD5C5C",     // Indian Red
    shingles: "#F08080",   // Light Coral
    
    // Systems subcategories - yellow family
    electrical: "#CCCC00", // Dark Yellow
    plumbing: "#DDDD00",   // Medium Yellow
    hvac: "#FFFF00",       // Hazard Yellow
    
    // Sheathing subcategories - steel/gray family
    barriers: "#808080",   // Gray
    drywall: "#A0A0A0",    // Medium Gray
    exteriors: "#C0C0C0",  // Sterile Steel
    siding: "#D8D8D8",     // Light Gray
    insulation: "#E0E0E0", // Very Light Gray
    
    // Finishings subcategories - white family
    windows: "#F0F0F0",    // White Smoke
    doors: "#F8F8F8",      // Ghost White
    cabinets: "#FAFAFA",   // Almost White
    fixtures: "#FCFCFC",   // Snow White
    flooring: "#FEFEFE",   // Nearly White
    paint: "#FFFFFF",      // Clinical White
    
    // Default
    permits: "#000000",    // Black
    other: "#404040",      // Dark Gray
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
    structural: "#4B0082", // Velvet Plum
    systems: "#800000",    // Dark Merlot
    sheathing: "#2F4F4F",  // Storm Gray
    finishings: "#BA55D3", // Lavender Luxe
    default: "#483D8B",    // Dark Slate Blue
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
  "vibrant": VIBRANT_THEME,
  "molten-core": MOLTEN_CORE_THEME,
  "cloud-circuit": CLOUD_CIRCUIT_THEME,
  "solar-flare": SOLAR_FLARE_THEME,
  "obsidian-mirage": OBSIDIAN_MIRAGE_THEME,
  "neon-noir": NEON_NOIR_THEME,
  "dust-planet": DUST_PLANET_THEME,
  "crystal-cavern": CRYSTAL_CAVERN_THEME,
  "paper-studio": PAPER_STUDIO_THEME,
  "biohazard-zone": BIOHAZARD_ZONE_THEME,
  "velvet-lounge": VELVET_LOUNGE_THEME
};

/**
 * Apply a theme's colors to CSS variables in the document
 * @param theme The theme to apply
 */
export function applyThemeToCSS(theme: ColorTheme): void {
  if (typeof document === 'undefined') return;
  
  // Apply tier1 category colors as CSS variables
  document.documentElement.style.setProperty('--tier1-structural', theme.tier1.structural);
  document.documentElement.style.setProperty('--tier1-systems', theme.tier1.systems);
  document.documentElement.style.setProperty('--tier1-sheathing', theme.tier1.sheathing);
  document.documentElement.style.setProperty('--tier1-finishings', theme.tier1.finishings);

  // Log that we've applied the theme to CSS variables
  console.log("Applied theme colors to CSS variables:", {
    structural: theme.tier1.structural,
    systems: theme.tier1.systems,
    sheathing: theme.tier1.sheathing,
    finishings: theme.tier1.finishings
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
  const tier1Categories = ['structural', 'systems', 'sheathing', 'finishings'];
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
    'contacts': '#eab308',   // Yellow
    'contact': '#eab308',    // Yellow
    'labor': '#16a34a',      // Green (same as tasks)
    'expense': '#ea580c',    // Orange (same as materials)
    'admin': '#8b5cf6'       // Purple
  };
  
  // Use custom color if available, otherwise fall back to theme mapping
  const primaryColor = moduleColors[module.toLowerCase()] || activeTheme.tier1.structural;
  
  // Debug logging to check color assignment
  if (module.toLowerCase() === 'contacts') {
    console.log('Color for contacts module:', primaryColor);
  }
  
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