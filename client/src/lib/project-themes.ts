// Enhanced project theme system - matches full color themes
export interface ProjectTheme {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  border: string;
  background: string;
  subcategories?: string[];
}

export const PROJECT_THEMES: ProjectTheme[] = [
  {
    name: "Earth Tone",
    description: "Natural earthy colors inspired by traditional building materials",
    primary: "#556b2f",
    secondary: "#445566",
    accent: "#9b2c2c",
    muted: "#8b4513",
    border: "#5c4033",
    background: "#faf9f7",
    subcategories: [
      "#047857", "#65a30d", "#15803d", "#047857", "#166534",
      "#2563eb", "#0891b2", "#0284c7", "#e11d48", "#db2777",
      "#ef4444", "#f43f5e", "#b91c1c", "#f59e0b", "#ca8a04",
      "#ea580c", "#b45309", "#a16207", "#f97316", "#4b5563"
    ]
  },
  {
    name: "Pastel",
    description: "Soft, modern colors for a clean and contemporary look",
    primary: "#93c5fd",
    secondary: "#a5b4fc",
    accent: "#fda4af",
    muted: "#fcd34d",
    border: "#d8b4fe",
    background: "#fefefe",
    subcategories: [
      "#93c5fd", "#bfdbfe", "#60a5fa", "#3b82f6", "#2563eb",
      "#a5b4fc", "#818cf8", "#6366f1", "#fda4af", "#fb7185",
      "#f43f5e", "#e11d48", "#be123c", "#fcd34d", "#fbbf24",
      "#f59e0b", "#d97706", "#b45309", "#f97316", "#c4b5fd"
    ]
  },
  {
    name: "Futuristic",
    description: "Bold, vibrant colors for a modern tech-forward look",
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#ec4899",
    muted: "#10b981",
    border: "#6366f1",
    background: "#fdfdfe",
    subcategories: [
      "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd",
      "#7c3aed", "#8b5cf6", "#a78bfa", "#be185d", "#db2777",
      "#ec4899", "#f472b6", "#f9a8d4", "#047857", "#10b981",
      "#34d399", "#6ee7b7", "#a7f3d0", "#059669", "#4f46e5"
    ]
  },
  {
    name: "Classic Construction",
    description: "Traditional construction colors inspired by safety equipment and signage",
    primary: "#fbbf24",
    secondary: "#1e3a8a",
    accent: "#ef4444",
    muted: "#0f172a",
    border: "#f97316",
    background: "#fffbf5",
    subcategories: [
      "#92400e", "#b45309", "#d97706", "#f59e0b", "#fbbf24",
      "#1e40af", "#1d4ed8", "#2563eb", "#991b1b", "#b91c1c",
      "#dc2626", "#ef4444", "#f87171", "#1e293b", "#334155",
      "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#ea580c"
    ]
  },
  {
    name: "Molten Core",
    description: "Intense volcanic reds and lava-glow oranges contrasted with charcoal blacks",
    primary: "#330000",
    secondary: "#8B0000",
    accent: "#FF4500",
    muted: "#FFA500",
    border: "#BF5700",
    background: "#fff8f0",
    subcategories: [
      "#0F0000", "#220000", "#330000", "#4F0000", "#661a00",
      "#660000", "#8B0000", "#AA0000", "#CC3300", "#DD4400",
      "#FF4500", "#FF6600", "#FF7700", "#CC8500", "#DD9500",
      "#FFAA00", "#FFA500", "#FFB700", "#FFC800", "#990000"
    ]
  },
  {
    name: "Neon Noir",
    description: "Cyberpunk aesthetic with vibrant neons over shadowy backdrops",
    primary: "#0A0A0A",
    secondary: "#00FFFF",
    accent: "#FF00FF",
    muted: "#FFFF00",
    border: "#191919",
    background: "#f8f8f8",
    subcategories: [
      "#000000", "#0A0A0A", "#101010", "#191919", "#282828",
      "#00AAAA", "#00CCCC", "#00FFFF", "#AA00AA", "#CC00CC",
      "#FF00FF", "#FF66FF", "#FFAAFF", "#AAAA00", "#CCCC00",
      "#FFFF00", "#FFFF66", "#FFFFAA", "#FFFFF0", "#00FF00"
    ]
  },
  {
    name: "Dust Planet",
    description: "Sci-fi desert tones with alien mauves and muted rust",
    primary: "#5C4033",
    secondary: "#A0522D",
    accent: "#8B4513",
    muted: "#9370DB",
    border: "#6B4423",
    background: "#faf8f5",
    subcategories: [
      "#3D2914", "#4A3319", "#5C4033", "#6B4423", "#7E5A40",
      "#8B4513", "#996633", "#A0522D", "#703A00", "#7E4200",
      "#8B4513", "#964B00", "#A56000", "#7B68EE", "#8470FF",
      "#9370DB", "#A080FF", "#B090FF", "#C0A0FF", "#856363"
    ]
  },
  {
    name: "Crystal Cavern",
    description: "Gem-like tones—sapphire, emerald, and topaz—for a luminous effect",
    primary: "#0F52BA",
    secondary: "#50C878",
    accent: "#FFD700",
    muted: "#E6E6FA",
    border: "#4169E1",
    background: "#f0f9ff",
    subcategories: [
      "#0C4295", "#0F52BA", "#1E6BDB", "#4289E8", "#6BA1F4",
      "#2E8B57", "#3CB371", "#50C878", "#B8860B", "#DAA520",
      "#FFD700", "#FFDF00", "#FFE87C", "#CCCCFF", "#D8D8FF",
      "#E6E6FA", "#EEE8FF", "#F5F0FF", "#FFF8FF", "#8878C3"
    ]
  },
  {
    name: "Paper Studio",
    description: "Minimalist, tactile tones inspired by recycled paper and raw design materials",
    primary: "#DCDCDC",
    secondary: "#B0A990",
    accent: "#A9A9A9",
    muted: "#F5F5DC",
    border: "#C0C0C0",
    background: "#fafafa",
    subcategories: [
      "#A9A9A9", "#BEBEBE", "#DCDCDC", "#E8E8E8", "#F5F5F5",
      "#998877", "#A99983", "#B0A990", "#696969", "#808080",
      "#A9A9A9", "#C0C0C0", "#D3D3D3", "#F0E9D2", "#F2EAD7",
      "#F5F5DC", "#F5F5F0", "#F8F8FF", "#FFF8E7", "#C8C8C8"
    ]
  },
  {
    name: "Velvet Lounge",
    description: "Rich, luxurious theme with deep velvet tones and moody accents",
    primary: "#4B0082",
    secondary: "#800000",
    accent: "#2F4F4F",
    muted: "#BA55D3",
    border: "#483D8B",
    background: "#f5f0ff",
    subcategories: [
      "#2A004C", "#3A0069", "#4B0082", "#5C1A98", "#6A359C",
      "#5B0000", "#6B0000", "#800000", "#1A2929", "#203838",
      "#2F4F4F", "#3D6262", "#4F7777", "#9932CC", "#A845D9",
      "#BA55D3", "#C969DD", "#D880E6", "#E89FEE", "#800080"
    ]
  }
];

export function getProjectTheme(themeName?: string, projectId?: number): ProjectTheme {
  // If no theme name provided, try to get from sessionStorage first
  if (!themeName && typeof sessionStorage !== 'undefined' && projectId) {
    const storedTheme = sessionStorage.getItem(`project-${projectId}-theme`);
    if (storedTheme) {
      const theme = PROJECT_THEMES.find(t => t.name === storedTheme);
      if (theme) return theme;
    }
  }

  if (!themeName) return PROJECT_THEMES[0];

  // Handle case-insensitive matching for theme names
  const normalizedThemeName = themeName.toLowerCase().replace(/\s+/g, ' ').trim();
  let theme = PROJECT_THEMES.find(t => t.name.toLowerCase() === normalizedThemeName);

  // Try exact match first, then partial match
  if (!theme) {
    theme = PROJECT_THEMES.find(t => t.name.toLowerCase().includes(normalizedThemeName) || normalizedThemeName.includes(t.name.toLowerCase()));
  }

  return theme || PROJECT_THEMES[0];
}

/**
 * Get the stored theme for a project from sessionStorage
 */
export function getStoredProjectTheme(projectId: number): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(`project-${projectId}-theme`);
}

/**
 * Clear stored theme for a project
 */
export function clearStoredProjectTheme(projectId: number): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(`project-${projectId}-theme`);
}

export function applyProjectTheme(theme: ProjectTheme, projectId?: number) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Apply enhanced theme CSS variables
  root.style.setProperty('--project-primary', theme.primary);
  root.style.setProperty('--project-secondary', theme.secondary);
  root.style.setProperty('--project-accent', theme.accent);
  root.style.setProperty('--project-muted', theme.muted);
  root.style.setProperty('--project-border', theme.border);
  root.style.setProperty('--project-background', theme.background);
  
  // Also apply as general CSS custom properties for broader component usage
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-secondary', theme.secondary);
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-muted', theme.muted);
  root.style.setProperty('--theme-border', theme.border);
  root.style.setProperty('--theme-background', theme.background);
  
  // Apply subcategory colors if available
  if (theme.subcategories) {
    theme.subcategories.forEach((color, index) => {
      root.style.setProperty(`--theme-subcategory-${index + 1}`, color);
      root.style.setProperty(`--project-subcategory-${index + 1}`, color);
    });
  }
  
  // Store theme in sessionStorage for the current project to persist during session
  if (typeof sessionStorage !== 'undefined' && projectId) {
    sessionStorage.setItem(`project-${projectId}-theme`, theme.name);
  }
  
  // Trigger a custom event for components that need to react to theme changes
  const themeChangeEvent = new CustomEvent('projectThemeChange', {
    detail: { theme, projectId }
  });
  document.dispatchEvent(themeChangeEvent);
  
  console.log(`Applied theme "${theme.name}" to project ${projectId || 'current'}`, {
    primary: theme.primary,
    secondary: theme.secondary,
    accent: theme.accent,
    muted: theme.muted,
    border: theme.border,
    background: theme.background,
    subcategories: theme.subcategories?.length || 0
  });
}