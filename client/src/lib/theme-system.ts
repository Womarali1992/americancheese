/**
 * Simplified Theme System
 * 
 * This is the single source of truth for all theme and color operations.
 * Replaces the complex multi-file theme system with a clean, simple approach.
 */

export interface ColorTheme {
  name: string;
  description: string;
  // Generic color palette - can be used for any category system
  colors: string[];
  // Legacy tier1/tier2 support for backward compatibility
  tier1?: {
    'subcategory-one': string;
    'subcategory-two': string;
    'subcategory-three': string;
    'subcategory-four': string;
    'permitting': string;
  };
  tier2?: {
    foundation: string;
    framing: string;
    roofing: string;
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
}

// Available themes
export const THEMES: Record<string, ColorTheme> = {
  'earth-tone': {
    name: 'Earth Tone',
    description: 'Natural earthy colors inspired by traditional building materials',
    colors: ['#556b2f', '#445566', '#9b2c2c', '#8b4513', '#5c4033', '#047857', '#65a30d', '#15803d', '#2563eb', '#0891b2', '#0284c7', '#e11d48', '#db2777', '#ef4444', '#f43f5e', '#b91c1c', '#f59e0b', '#ca8a04', '#ea580c', '#b45309', '#a16207', '#f97316', '#4b5563'],
    tier1: {
      'subcategory-one': '#556b2f',
      'subcategory-two': '#445566',
      'subcategory-three': '#9b2c2c',
      'subcategory-four': '#8b4513',
      'permitting': '#5c4033',
    },
    tier2: {
      foundation: '#047857',
      framing: '#65a30d',
      roofing: '#15803d',
      electrical: '#2563eb',
      plumbing: '#0891b2',
      hvac: '#0284c7',
      barriers: '#e11d48',
      drywall: '#db2777',
      exteriors: '#ef4444',
      siding: '#f43f5e',
      insulation: '#b91c1c',
      windows: '#f59e0b',
      doors: '#ca8a04',
      cabinets: '#ea580c',
      fixtures: '#b45309',
      flooring: '#a16207',
      paint: '#f97316',
      permits: '#4b5563',
      other: '#4b5563',
    }
  },
  'pastel': {
    name: 'Pastel',
    description: 'Soft, modern colors for a clean and contemporary look',
    colors: ['#93c5fd', '#a5b4fc', '#fda4af', '#fcd34d', '#d8b4fe', '#bfdbfe', '#60a5fa', '#818cf8', '#6366f1', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#f97316', '#c4b5fd', '#a78bfa'],
    tier1: {
      'subcategory-one': '#93c5fd',
      'subcategory-two': '#a5b4fc',
      'subcategory-three': '#fda4af',
      'subcategory-four': '#fcd34d',
      'permitting': '#d8b4fe',
    },
    tier2: {
      foundation: '#93c5fd',
      framing: '#bfdbfe',
      roofing: '#60a5fa',
      electrical: '#a5b4fc',
      plumbing: '#818cf8',
      hvac: '#6366f1',
      barriers: '#fda4af',
      drywall: '#fb7185',
      exteriors: '#f43f5e',
      siding: '#e11d48',
      insulation: '#be123c',
      windows: '#fcd34d',
      doors: '#fbbf24',
      cabinets: '#f59e0b',
      fixtures: '#d97706',
      flooring: '#b45309',
      paint: '#f97316',
      permits: '#c4b5fd',
      other: '#a78bfa',
    }
  },
  'futuristic': {
    name: 'Futuristic',
    description: 'Bold, vibrant colors for a modern tech-forward look',
    colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#6366f1', '#1d4ed8', '#2563eb', '#7c3aed', '#a78bfa', '#be185d', '#db2777', '#f472b6', '#f9a8d4', '#047857', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#4f46e5'],
    tier1: {
      'subcategory-one': '#3b82f6',
      'subcategory-two': '#8b5cf6',
      'subcategory-three': '#ec4899',
      'subcategory-four': '#10b981',
      'permitting': '#6366f1',
    },
    tier2: {
      foundation: '#1d4ed8',
      framing: '#2563eb',
      roofing: '#3b82f6',
      electrical: '#7c3aed',
      plumbing: '#8b5cf6',
      hvac: '#a78bfa',
      barriers: '#be185d',
      drywall: '#db2777',
      exteriors: '#ec4899',
      siding: '#f472b6',
      insulation: '#f9a8d4',
      windows: '#047857',
      doors: '#10b981',
      cabinets: '#34d399',
      fixtures: '#6ee7b7',
      flooring: '#a7f3d0',
      paint: '#059669',
      permits: '#4f46e5',
      other: '#6366f1',
    }
  },
  'classic-construction': {
    name: 'Classic Construction',
    description: 'Traditional construction colors inspired by safety equipment and signage',
    colors: ['#fbbf24', '#1e3a8a', '#ef4444', '#0f172a', '#f97316', '#92400e', '#b45309', '#d97706', '#1e40af', '#1d4ed8', '#2563eb', '#991b1b', '#b91c1c', '#dc2626', '#f87171', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#ea580c'],
    tier1: {
      'subcategory-one': '#fbbf24',
      'subcategory-two': '#1e3a8a',
      'subcategory-three': '#ef4444',
      'subcategory-four': '#0f172a',
      'permitting': '#f97316',
    },
    tier2: {
      foundation: '#92400e',
      framing: '#b45309',
      roofing: '#d97706',
      electrical: '#1e40af',
      plumbing: '#1d4ed8',
      hvac: '#2563eb',
      barriers: '#991b1b',
      drywall: '#b91c1c',
      exteriors: '#dc2626',
      siding: '#ef4444',
      insulation: '#f87171',
      windows: '#1e293b',
      doors: '#334155',
      cabinets: '#475569',
      fixtures: '#64748b',
      flooring: '#94a3b8',
      paint: '#cbd5e1',
      permits: '#ea580c',
      other: '#f97316',
    }
  },
  'molten-core': {
    name: 'Molten Core',
    description: 'Intense volcanic reds and lava-glow oranges contrasted with charcoal blacks',
    colors: ['#330000', '#8B0000', '#FF4500', '#FFA500', '#BF5700', '#0F0000', '#220000', '#4F0000', '#661a00', '#660000', '#AA0000', '#CC3300', '#DD4400', '#FF6600', '#FF7700', '#FF8800', '#FFA500', '#FFB347', '#FFC649', '#4b5563'],
    tier1: {
      'subcategory-one': '#330000',  // Volcanic Black
      'subcategory-two': '#8B0000',  // Molten Red
      'subcategory-three': '#FF4500', // Lava Orange
      'subcategory-four': '#FFA500',  // Burnt Amber
      'permitting': '#BF5700',       // Dark Amber
    },
    tier2: {
      foundation: '#0F0000',
      framing: '#220000',
      roofing: '#330000',
      electrical: '#660000',
      plumbing: '#8B0000',
      hvac: '#AA0000',
      barriers: '#CC3300',
      drywall: '#DD4400',
      exteriors: '#FF4500',
      siding: '#FF6600',
      insulation: '#FF7700',
      windows: '#FF8800',
      doors: '#FFA500',
      cabinets: '#FFB347',
      fixtures: '#FFC649',
      flooring: '#FFD700',
      paint: '#FFE135',
      permits: '#BF5700',
      other: '#4b5563',
    }
  },
  'neon-noir': {
    name: 'Neon Noir',
    description: 'Cyberpunk aesthetic with vibrant neons over shadowy backdrops',
    colors: ['#0A0A0A', '#00FFFF', '#FF00FF', '#FFFF00', '#191919', '#000000', '#101010', '#282828', '#00AAAA', '#00CCCC', '#AA00AA', '#CC00CC', '#FF66FF', '#FFAAFF', '#AAAA00', '#CCCC00', '#FFFF66', '#FFFFAA', '#4b5563'],
    tier1: {
      'subcategory-one': '#0A0A0A',  // Pitch Black
      'subcategory-two': '#00FFFF',  // Electric Cyan
      'subcategory-three': '#FF00FF', // Neon Magenta
      'subcategory-four': '#FFFF00',  // Signal Yellow
      'permitting': '#191919',       // Dark Gray
    },
    tier2: {
      foundation: '#000000',
      framing: '#0A0A0A',
      roofing: '#101010',
      electrical: '#00AAAA',
      plumbing: '#00CCCC',
      hvac: '#00FFFF',
      barriers: '#AA00AA',
      drywall: '#CC00CC',
      exteriors: '#FF00FF',
      siding: '#FF66FF',
      insulation: '#FFAAFF',
      windows: '#AAAA00',
      doors: '#CCCC00',
      cabinets: '#FFFF00',
      fixtures: '#FFFF66',
      flooring: '#FFFFAA',
      paint: '#FFFF99',
      permits: '#191919',
      other: '#4b5563',
    }
  },
  'dust-planet': {
    name: 'Dust Planet',
    description: 'Sci-fi desert tones with alien mauves and muted rust',
    colors: ['#5C4033', '#A0522D', '#8B4513', '#9370DB', '#6B4423', '#3D2914', '#4A3319', '#7E5A40', '#996633', '#703A00', '#7E4200', '#964B00', '#A56000', '#8A2BE2', '#9966CC', '#BA55D3', '#DDA0DD', '#4b5563'],
    tier1: {
      'subcategory-one': '#5C4033',  // Dust Bronze
      'subcategory-two': '#A0522D',  // Martian Clay
      'subcategory-three': '#8B4513', // Rust Brown
      'subcategory-four': '#9370DB',  // Alien Lilac
      'permitting': '#6B4423',       // Bronze
    },
    tier2: {
      foundation: '#3D2914',
      framing: '#4A3319',
      roofing: '#5C4033',
      electrical: '#8B4513',
      plumbing: '#996633',
      hvac: '#A0522D',
      barriers: '#703A00',
      drywall: '#7E4200',
      exteriors: '#8B4513',
      siding: '#964B00',
      insulation: '#A56000',
      windows: '#8A2BE2',
      doors: '#9966CC',
      cabinets: '#9370DB',
      fixtures: '#BA55D3',
      flooring: '#DDA0DD',
      paint: '#E6E6FA',
      permits: '#6B4423',
      other: '#4b5563',
    }
  },
  'crystal-cavern': {
    name: 'Crystal Cavern',
    description: 'Gem-like tones—sapphire, emerald, and topaz—for a luminous effect',
    colors: ['#0F52BA', '#50C878', '#FFD700', '#E6E6FA', '#4169E1', '#0C4295', '#1E6BDB', '#4289E8', '#6BA1F4', '#2E8B57', '#3CB371', '#B8860B', '#DAA520', '#FFDF00', '#FFE87C', '#DCD0FF', '#E6E6FA', '#4b5563'],
    tier1: {
      'subcategory-one': '#0F52BA',  // Sapphire Blue
      'subcategory-two': '#50C878',  // Emerald Green
      'subcategory-three': '#FFD700', // Topaz Gold
      'subcategory-four': '#E6E6FA',  // Crystal Mist
      'permitting': '#4169E1',       // Royal Blue
    },
    tier2: {
      foundation: '#0C4295',
      framing: '#0F52BA',
      roofing: '#1E6BDB',
      electrical: '#2E8B57',
      plumbing: '#3CB371',
      hvac: '#50C878',
      barriers: '#B8860B',
      drywall: '#DAA520',
      exteriors: '#FFD700',
      siding: '#FFDF00',
      insulation: '#FFE87C',
      windows: '#DCD0FF',
      doors: '#E6E6FA',
      cabinets: '#F0F8FF',
      fixtures: '#4169E1',
      flooring: '#6495ED',
      paint: '#87CEEB',
      permits: '#4169E1',
      other: '#4b5563',
    }
  },
  'paper-studio': {
    name: 'Paper Studio',
    description: 'Minimalist, tactile tones inspired by recycled paper and raw design materials',
    colors: ['#DCDCDC', '#B0A990', '#A9A9A9', '#F5F5DC', '#C0C0C0', '#696969', '#808080', '#BEBEBE', '#E8E8E8', '#F5F5F5', '#998877', '#A99983', '#D3D3D3', '#F0E9D2', '#F2EAD7', '#F5F5F0', '#F8F8FF', '#FFF8E7', '#4b5563'],
    tier1: {
      'subcategory-one': '#DCDCDC',  // Recycled Gray
      'subcategory-two': '#B0A990',  // Cardboard Taupe
      'subcategory-three': '#A9A9A9', // Graphite Sketch
      'subcategory-four': '#F5F5DC',  // Paper Cream
      'permitting': '#C0C0C0',       // Silver
    },
    tier2: {
      foundation: '#696969',
      framing: '#808080',
      roofing: '#A9A9A9',
      electrical: '#BEBEBE',
      plumbing: '#C0C0C0',
      hvac: '#D3D3D3',
      barriers: '#DCDCDC',
      drywall: '#E8E8E8',
      exteriors: '#F5F5F5',
      siding: '#998877',
      insulation: '#A99983',
      windows: '#B0A990',
      doors: '#F0E9D2',
      cabinets: '#F2EAD7',
      fixtures: '#F5F5DC',
      flooring: '#F5F5F0',
      paint: '#F8F8FF',
      permits: '#C0C0C0',
      other: '#4b5563',
    }
  },
  'velvet-lounge': {
    name: 'Velvet Lounge',
    description: 'Rich, luxurious theme with deep velvet tones and moody accents',
    colors: ['#4B0082', '#800000', '#2F4F4F', '#BA55D3', '#483D8B', '#2A004C', '#3A0069', '#5C1A98', '#6A359C', '#5B0000', '#6B0000', '#1A2929', '#203838', '#3D6262', '#4F7777', '#8B008B', '#9370DB', '#DDA0DD', '#4b5563'],
    tier1: {
      'subcategory-one': '#4B0082',  // Velvet Plum
      'subcategory-two': '#800000',  // Dark Merlot
      'subcategory-three': '#2F4F4F', // Storm Gray
      'subcategory-four': '#BA55D3',  // Lavender Luxe
      'permitting': '#483D8B',       // Dark Slate Blue
    },
    tier2: {
      foundation: '#2A004C',
      framing: '#3A0069',
      roofing: '#4B0082',
      electrical: '#5B0000',
      plumbing: '#6B0000',
      hvac: '#800000',
      barriers: '#1A2929',
      drywall: '#203838',
      exteriors: '#2F4F4F',
      siding: '#3D6262',
      insulation: '#4F7777',
      windows: '#8B008B',
      doors: '#9370DB',
      cabinets: '#BA55D3',
      fixtures: '#DDA0DD',
      flooring: '#E6E6FA',
      paint: '#F8F8FF',
      permits: '#483D8B',
      other: '#4b5563',
    }
  },
};

export const DEFAULT_THEME = 'earth-tone';

// Current theme state
let currentGlobalTheme = DEFAULT_THEME;
const projectThemeOverrides = new Map<number, string>();

// Initialize with some test overrides for demonstration
projectThemeOverrides.set(6, 'pastel');        // PIcklebook -> Pastel
projectThemeOverrides.set(8, 'futuristic');    // HTXapt -> Futuristic  
projectThemeOverrides.set(9, 'classic-construction'); // Sitesetups -> Classic

// Theme change listeners
const listeners = new Set<() => void>();

/**
 * Get the current global theme
 */
export function getGlobalTheme(): ColorTheme {
  return THEMES[currentGlobalTheme] || THEMES[DEFAULT_THEME];
}

/**
 * Set the global theme
 */
export function setGlobalTheme(themeKey: string): void {
  if (THEMES[themeKey]) {
    currentGlobalTheme = themeKey;
    localStorage.setItem('globalTheme', themeKey);
    applyThemeToDOM(THEMES[themeKey]);
    notifyListeners();
  }
}

/**
 * Convert theme display name to theme key (for database compatibility)
 */
function normalizeThemeKey(themeName: string): string {
  // First check if it's already a valid theme key
  if (THEMES[themeName]) {
    return themeName;
  }
  
  // Try to find theme by name
  for (const [key, theme] of Object.entries(THEMES)) {
    if (theme.name === themeName) {
      return key;
    }
  }
  
  // Fall back to kebab-case conversion
  return themeName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get theme for a specific project (with fallback to global)
 * Can optionally accept project data directly to avoid race conditions
 */
export function getProjectTheme(projectId?: number, projectData?: {colorTheme?: string | null, useGlobalTheme?: boolean}): ColorTheme {
  // First try direct project data if provided
  if (projectData && projectData.colorTheme && !projectData.useGlobalTheme) {
    const normalizedKey = normalizeThemeKey(projectData.colorTheme);
    console.log(`🎨 Project ${projectId} using direct project data theme: ${projectData.colorTheme} -> ${normalizedKey}`);
    return THEMES[normalizedKey] || getGlobalTheme();
  }
  
  // Then try in-memory overrides
  if (projectId && projectThemeOverrides.has(projectId)) {
    const themeKey = projectThemeOverrides.get(projectId)!;
    console.log(`🎨 Project ${projectId} has theme override: ${themeKey}`);
    return THEMES[themeKey] || getGlobalTheme();
  }
  
  console.log(`🎨 Project ${projectId} using global theme: ${currentGlobalTheme}`);
  return getGlobalTheme();
}

/**
 * Set theme override for a specific project
 */
export function setProjectTheme(projectId: number, themeKey: string | null): void {
  if (themeKey && THEMES[themeKey]) {
    projectThemeOverrides.set(projectId, themeKey);
    applyThemeToDOM(THEMES[themeKey]);
  } else {
    projectThemeOverrides.delete(projectId);
    applyThemeToDOM(getGlobalTheme());
  }
  notifyListeners();
}

/**
 * Get color for a tier1 category
 */
export function getTier1Color(category: string, projectId?: number): string {
  const theme = getProjectTheme(projectId);

  // First try the legacy tier1 system for backward compatibility
  if (theme.tier1) {
    const normalizedCategory = category.toLowerCase().replace(/[_\s-]/g, '');

    // Map common variants to tier1 categories
    const categoryMap: Record<string, keyof ColorTheme['tier1']> = {
      'subcategoryone': 'subcategory-one',
      'subcategory-one': 'subcategory-one',
      'subcategory_one': 'subcategory-one',
      'subcategorytwo': 'subcategory-two', 
      'subcategory-two': 'subcategory-two',
      'subcategory_two': 'subcategory-two',
      'subcategorythree': 'subcategory-three',
      'subcategory-three': 'subcategory-three',
      'subcategory_three': 'subcategory-three',
      'subcategoryfour': 'subcategory-four',
      'subcategory-four': 'subcategory-four',
      'subcategory_four': 'subcategory-four',
      'permit': 'permitting',
      'permitting': 'permitting',
      // Legacy mappings for backward compatibility
      'structure': 'subcategory-one',
      'structural': 'subcategory-one',
      'system': 'subcategory-two',
      'systems': 'subcategory-two',
      'sheath': 'subcategory-three',
      'sheathing': 'subcategory-three',
      'finish': 'subcategory-four',
      'finishings': 'subcategory-four',
    };

    const mappedCategory = categoryMap[normalizedCategory];
    if (mappedCategory && theme.tier1[mappedCategory]) {
      return theme.tier1[mappedCategory];
    }
  }

  // Fallback to generic color palette
  return getGenericColor(category, projectId);
}

/**
 * Get color from generic color palette by category name or index
 */
export function getGenericColor(category: string | number, projectId?: number): string {
  const theme = getProjectTheme(projectId);

  if (!theme.colors || theme.colors.length === 0) {
    console.log(`🎨 getGenericColor: No colors in theme, using fallback`);
    return '#64748b'; // Default fallback color
  }

  let index: number;

  if (typeof category === 'number') {
    index = category % theme.colors.length;
    console.log(`🎨 getGenericColor: Using numeric index ${index} for category ${category}`);
  } else {
    const str = category.toLowerCase().trim();

    // Explicit mappings for common workout categories to ensure distinct colors
    const workoutCategoryMappings: Record<string, number> = {
      'push': 0,
      'pull': 1,
      'legs': 2,
      'cardio': 3,
    };

    // Check if this is a workout category with explicit mapping
    if (workoutCategoryMappings.hasOwnProperty(str)) {
      index = workoutCategoryMappings[str] % theme.colors.length;
      console.log(`🎨 getGenericColor: Workout category "${category}" -> explicit index ${index} from ${theme.colors.length} colors`);
    } else {
      // Use hash function for other categories
      let hash = 0;

      // Use a more sophisticated hash algorithm (similar to Java's String.hashCode())
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      // Add extra entropy based on string length and first/last characters
      const extraEntropy = str.length * 31 +
                          (str.charCodeAt(0) || 0) * 17 +
                          (str.charCodeAt(str.length - 1) || 0) * 13;
      hash += extraEntropy;

      // Use absolute value and ensure we cycle through all available colors
      index = Math.abs(hash) % theme.colors.length;
      console.log(`🎨 getGenericColor: Category "${category}" -> hash ${hash} -> index ${index} from ${theme.colors.length} colors`);
    }
  }

  const color = theme.colors[index];
  console.log(`🎨 getGenericColor: Returning color ${color} at index ${index}`);
  return color;
}

/**
 * Get color for a tier2 category
 */
export function getTier2Color(category: string, projectId?: number): string {
  const theme = getProjectTheme(projectId);

  // First try the legacy tier2 system for backward compatibility
  if (theme.tier2) {
    const normalizedCategory = category.toLowerCase().replace(/[_\s-]/g, '');
    const tier2Key = normalizedCategory as keyof ColorTheme['tier2'];

    if (tier2Key && theme.tier2[tier2Key]) {
      return theme.tier2[tier2Key];
    }

    // Try 'other' as fallback
    if (theme.tier2.other) {
      return theme.tier2.other;
    }
  }

  // Fallback to generic color palette
  return getGenericColor(category, projectId);
}

/**
 * Get color for any category (auto-detects tier1 or tier2)
 */
export function getCategoryColor(category: string, projectId?: number): string {
  // Try tier1 first - it has its own mapping logic for legacy names
  const tier1Color = getTier1Color(category, projectId);
  
  // If getTier1Color returns a generic color (meaning it wasn't found in tier1), try tier2
  const tier2Color = getTier2Color(category, projectId);
  
  // If tier1 didn't fall back to generic but tier2 did, prefer tier1
  const genericColor = getGenericColor(category, projectId);
  if (tier1Color !== genericColor) {
    return tier1Color;
  } else if (tier2Color !== genericColor) {
    return tier2Color;
  } else {
    return genericColor;
  }
}

/**
 * Apply theme colors to CSS custom properties
 */
export function applyThemeToDOM(theme: ColorTheme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Apply modern color system using generic colors array
  if (theme.colors && theme.colors.length > 0) {
    // Map colors to semantic variables
    root.style.setProperty('--color-primary', theme.colors[0] || '#556b2f');
    root.style.setProperty('--color-secondary', theme.colors[1] || '#445566');
    root.style.setProperty('--color-accent', theme.colors[2] || '#8b4513');
    root.style.setProperty('--color-success', theme.colors[3] || '#6b8f47');
    root.style.setProperty('--color-warning', theme.colors[4] || '#a0631f');
    root.style.setProperty('--color-error', theme.colors[5] || '#8b2c2c');
    root.style.setProperty('--color-info', theme.colors[6] || '#5a6b73');
    root.style.setProperty('--color-material', theme.colors[7] || theme.colors[2] || '#8b4513');
    root.style.setProperty('--color-labor', theme.colors[8] || theme.colors[1] || '#445566');
    
    // Apply additional generic colors with indexed variables
    theme.colors.forEach((color, index) => {
      root.style.setProperty(`--theme-color-${index}`, color);
    });
  }
}

/**
 * Subscribe to theme changes
 */
export function onThemeChange(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Notify all listeners of theme changes
 */
function notifyListeners(): void {
  listeners.forEach(callback => callback());
}

/**
 * Initialize the theme system
 */
export function initializeTheme(): void {
  // Load global theme from localStorage
  const savedTheme = localStorage.getItem('globalTheme');
  if (savedTheme && THEMES[savedTheme]) {
    currentGlobalTheme = savedTheme;
  }
  
  // Apply initial theme
  applyThemeToDOM(getGlobalTheme());
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
  } else {
    initializeTheme();
  }
}

// Utility functions for common color operations
export const colorUtils = {
  /**
   * Convert hex to rgba with opacity
   */
  hexToRgba(hex: string, alpha: number = 1): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
  
  /**
   * Get a lighter version of a color
   */
  lighten(hex: string, amount: number = 0.1): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    const r = Math.min(255, parseInt(result[1], 16) + Math.round(255 * amount));
    const g = Math.min(255, parseInt(result[2], 16) + Math.round(255 * amount));
    const b = Math.min(255, parseInt(result[3], 16) + Math.round(255 * amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },
  
  /**
   * Get contrasting text color (black or white) for a background
   */
  getContrastText(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#000000';
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
};