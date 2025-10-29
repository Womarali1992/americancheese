import { COLOR_THEMES, getActiveColorTheme, applyThemeToCSS, type ColorTheme } from './color-themes';

// Enhanced project theme interface - built on top of ColorTheme
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

// Convert ColorTheme to ProjectTheme format
function colorThemeToProjectTheme(colorTheme: ColorTheme): ProjectTheme {
  return {
    name: colorTheme.name,
    description: colorTheme.description,
    primary: colorTheme.tier1.subcategory1,
    secondary: colorTheme.tier1.subcategory2,
    accent: colorTheme.tier1.subcategory3,
    muted: colorTheme.tier1.subcategory4,
    border: colorTheme.tier1.subcategory5,
    background: '#fafafa',
    subcategories: [
      colorTheme.tier2.tier2_1, colorTheme.tier2.tier2_2, colorTheme.tier2.tier2_3,
      colorTheme.tier2.tier2_4, colorTheme.tier2.tier2_5, colorTheme.tier2.tier2_6,
      colorTheme.tier2.tier2_7, colorTheme.tier2.tier2_8, colorTheme.tier2.tier2_9,
      colorTheme.tier2.tier2_10, colorTheme.tier2.tier2_11, colorTheme.tier2.tier2_12,
      colorTheme.tier2.tier2_13, colorTheme.tier2.tier2_14, colorTheme.tier2.tier2_15,
      colorTheme.tier2.tier2_16, colorTheme.tier2.tier2_17, colorTheme.tier2.tier2_18,
      colorTheme.tier2.tier2_19, colorTheme.tier2.tier2_20
    ]
  };
}

// Generate PROJECT_THEMES from COLOR_THEMES
export const PROJECT_THEMES: ProjectTheme[] = Object.values(COLOR_THEMES).map(colorThemeToProjectTheme);

export function getProjectTheme(themeName?: string, projectId?: number): ProjectTheme {
  // Convert theme name to color-themes format (kebab-case)
  const normalizeThemeName = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

  // If no theme name, try session storage or use default
  if (!themeName && typeof sessionStorage !== 'undefined' && projectId) {
    const storedTheme = sessionStorage.getItem(`project-${projectId}-theme`);
    if (storedTheme) {
      themeName = storedTheme;
    }
  }

  if (!themeName) return PROJECT_THEMES[0];

  // Get the ColorTheme from color-themes.ts
  const normalizedKey = normalizeThemeName(themeName);
  const colorTheme = COLOR_THEMES[normalizedKey];

  if (colorTheme) {
    return colorThemeToProjectTheme(colorTheme);
  }

  // Try to find by name
  const theme = PROJECT_THEMES.find(t =>
    t.name.toLowerCase() === themeName.toLowerCase() ||
    normalizeThemeName(t.name) === normalizedKey
  );

  return theme || PROJECT_THEMES[0];
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

  // Also use the color-themes applyThemeToCSS to ensure consistency
  const normalizedKey = theme.name.toLowerCase().replace(/\s+/g, '-');
  const colorTheme = COLOR_THEMES[normalizedKey];
  if (colorTheme) {
    applyThemeToCSS(colorTheme);
  }
}