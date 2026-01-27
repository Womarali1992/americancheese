# Color System Refactor Plan

## Current State (5 Files, 2,667+ Lines)

| File | Lines | Purpose | Issues |
|------|-------|---------|--------|
| `color-themes.ts` | 1,305 | Theme definitions (12 themes), core functions | Bloated with definitions |
| `unified-color-system.ts` | 913 | Color resolution with priority | Imports from theme-system.ts (circular risk) |
| `project-themes.ts` | 127 | ProjectTheme conversion, `applyProjectTheme()` | Wrapper over color-themes.ts |
| `theme-system.ts` | 208 | Backward compatibility layer | Mostly re-exports, duplicate functions |
| `theme-init.ts` | 114 | App startup (mostly disabled) | Dead code, commented out |

### Key Problems

1. **No ThemeProvider** - Each page must manually call `useProjectTheme()` or `applyProjectTheme()`
2. **Inconsistent patterns** - Project detail uses hook, Dashboard/Tasks didn't (now fixed)
3. **Circular imports** - unified-color-system imports from theme-system which imports from color-themes
4. **Duplicate functions** - `getTier1Color` exists in theme-system.ts AND unified-color-system.ts
5. **Debug logging everywhere** - Console spam in production
6. **Dead code** - theme-init.ts is mostly disabled

---

## Proposed Architecture (3 Files)

### 1. `color-themes.ts` (Keep, Clean Up)
**Purpose**: Theme definitions ONLY

```typescript
// Theme definition type
export interface ColorTheme { ... }

// All 12 theme definitions
export const COLOR_THEMES: Record<string, ColorTheme> = { ... };

// Theme names list for UI
export const THEME_NAMES = Object.keys(COLOR_THEMES);

// Default theme key
export const DEFAULT_THEME = 'earth-tone';
```

**What to remove:**
- Move `applyThemeToCSS()` to theme-provider.ts
- Move `getActiveColorTheme()` to theme-provider.ts
- Move `getThemeTier1Color()`, `getThemeTier2Color()` to color-utils.ts

---

### 2. `color-utils.ts` (New - Combine from unified-color-system + theme-system)
**Purpose**: Pure utility functions for color operations

```typescript
import { ColorTheme, COLOR_THEMES, DEFAULT_THEME } from './color-themes';

// Fallback colors
export const FALLBACK_COLORS = { ... };
export const DEFAULT_COLORS = { ... };

// Types
export interface CategoryData { ... }
export interface ProjectThemeData { ... }

// Pure color resolution functions (no side effects, no CSS mutations)
export function getTier1Color(
  categoryName: string,
  adminCategories: CategoryData[],
  projectId?: number,
  projects?: ProjectThemeData[]
): string { ... }

export function getTier2Color(
  categoryName: string,
  adminCategories: CategoryData[],
  projectId?: number,
  projects?: ProjectThemeData[],
  parentCategoryName?: string
): string { ... }

// Color manipulation utilities
export const colorUtils = {
  hexToRgba(hex: string, alpha: number): string { ... },
  lighten(hex: string, amount: number): string { ... },
  getContrastText(hex: string): string { ... }
};

// Theme lookup helpers
export function getThemeByName(name?: string): ColorTheme { ... }
export function normalizeThemeName(name: string): string { ... }
```

---

### 3. `ThemeProvider.tsx` (New - Replace useProjectTheme + manual applications)
**Purpose**: React context for automatic theme management

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ColorTheme, COLOR_THEMES, DEFAULT_THEME } from './color-themes';

interface ThemeContextValue {
  theme: ColorTheme;
  themeName: string;
  projectId: number | null;
  setTheme: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(COLOR_THEMES[DEFAULT_THEME]);
  const [themeName, setThemeName] = useState<string>(DEFAULT_THEME);

  // Extract projectId from URL if on project-related pages
  const projectId = useMemo(() => {
    const match = location.match(/\/projects\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }, [location]);

  // Fetch project data when projectId changes
  const { data: project } = useQuery({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  // Apply theme when project changes
  useEffect(() => {
    if (project?.colorTheme) {
      const normalized = project.colorTheme.toLowerCase().replace(/\s+/g, '-');
      const theme = COLOR_THEMES[normalized] || COLOR_THEMES[DEFAULT_THEME];
      setCurrentTheme(theme);
      setThemeName(project.colorTheme);
      applyThemeToCSS(theme);
    } else {
      // Apply global/default theme
      const savedTheme = localStorage.getItem('colorTheme') || DEFAULT_THEME;
      const theme = COLOR_THEMES[savedTheme] || COLOR_THEMES[DEFAULT_THEME];
      setCurrentTheme(theme);
      setThemeName(savedTheme);
      applyThemeToCSS(theme);
    }
  }, [project, projectId]);

  const setTheme = useCallback((name: string) => {
    const normalized = name.toLowerCase().replace(/\s+/g, '-');
    const theme = COLOR_THEMES[normalized];
    if (theme) {
      setCurrentTheme(theme);
      setThemeName(name);
      applyThemeToCSS(theme);
      localStorage.setItem('colorTheme', normalized);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themeName, projectId, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook for consuming theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Apply CSS variables
function applyThemeToCSS(theme: ColorTheme) {
  const root = document.documentElement;

  // Tier 1 colors
  root.style.setProperty('--tier1-structural', theme.tier1.subcategory1);
  root.style.setProperty('--tier1-systems', theme.tier1.subcategory2);
  root.style.setProperty('--tier1-sheathing', theme.tier1.subcategory3);
  root.style.setProperty('--tier1-finishings', theme.tier1.subcategory4);
  root.style.setProperty('--tier1-permitting', theme.tier1.subcategory5);

  // Theme semantic colors
  root.style.setProperty('--theme-primary', theme.tier1.subcategory1);
  root.style.setProperty('--theme-secondary', theme.tier1.subcategory2);
  root.style.setProperty('--theme-accent', theme.tier1.subcategory3);

  // Tier 2 colors (20 slots)
  for (let i = 1; i <= 20; i++) {
    root.style.setProperty(`--tier2-${i}`, theme.tier2[`tier2_${i}`]);
  }
}
```

---

## Files to Delete After Refactor

1. `theme-system.ts` - Functionality moved to ThemeProvider + color-utils
2. `theme-init.ts` - Functionality moved to ThemeProvider
3. `project-themes.ts` - Functionality moved to ThemeProvider
4. `unified-color-system.ts` - Functionality moved to color-utils.ts

---

## Migration Steps

### Phase 1: Immediate Fixes (DONE ✅)
- [x] Add `useEffect` with `applyProjectTheme()` to SimpleDashboard.tsx
- [x] Add `useEffect` with `applyProjectTheme()` to SimpleTasksPage.tsx

### Phase 2: Create New Architecture (DONE ✅)
- [x] Create `color-utils.ts` - Clean re-export layer with additional utilities
- [x] Enhance `SimpleThemeProvider.tsx` - Auto-detects project from URL, applies themes
- [x] App already wrapped in SimpleThemeProvider

### Phase 3: Migrate Components (OPTIONAL - Incremental)
Components can now use:
- `import { getTier1Color, getTier2Color, ... } from '@/lib/color-utils'`
- `import { useThemeContext } from '@/components/SimpleThemeProvider'`

Old imports still work but new code should use color-utils.ts.

### Phase 4: Cleanup (FUTURE)
1. Remove debug `console.log()` statements from unified-color-system.ts
2. Delete theme-system.ts (compatibility layer)
3. Delete theme-init.ts (mostly disabled)
4. Update remaining imports across codebase

---

## Benefits

1. **Single responsibility** - Each file has one job
2. **Automatic theme application** - No manual calls needed per page
3. **No circular imports** - Clear dependency graph
4. **Easier testing** - Pure functions in color-utils.ts
5. **Less code** - ~2,667 lines → ~800-1000 lines
6. **Better DX** - Just use `useTheme()` hook anywhere

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Keep old files during migration, add deprecation warnings |
| Missing edge cases | Comprehensive testing before deleting old files |
| Import path changes | Use find-replace across codebase |
