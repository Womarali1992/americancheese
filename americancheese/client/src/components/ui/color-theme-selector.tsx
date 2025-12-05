import React from 'react';
import { Check, Palette, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { COLOR_THEMES, ColorTheme } from '@/lib/color-themes';
import { useGlobalTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';

interface ColorThemeSelectorProps {
  onThemeSelect?: (themeKey: string, theme: ColorTheme) => void;
  selectedTheme?: string;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  // Admin mode props for enabling/disabling themes
  isAdminMode?: boolean;
  enabledThemes?: string[];
  onToggleTheme?: (themeKey: string, enabled: boolean) => void;
}

export function ColorThemeSelector({
  onThemeSelect,
  selectedTheme,
  showDescription = true,
  size = 'md',
  className = '',
  isAdminMode = false,
  enabledThemes,
  onToggleTheme
}: ColorThemeSelectorProps) {
  const { currentTheme, updateGlobalTheme } = useGlobalTheme();
  const { toast } = useToast();
  const selected = selectedTheme || getThemeKey(currentTheme);

  function getThemeKey(theme: ColorTheme): string {
    return Object.entries(COLOR_THEMES).find(([_, t]) => t.name === theme.name)?.[0] || 'earth-tone';
  }

  function handleThemeSelect(themeKey: string, theme: ColorTheme) {
    if (onThemeSelect) {
      onThemeSelect(themeKey, theme);
    } else {
      // Use simplified global theme update (no reload)
      updateGlobalTheme(themeKey);
    }
  }

  function handleToggleTheme(e: React.MouseEvent, themeKey: string, currentlyEnabled: boolean) {
    e.stopPropagation(); // Prevent card click from firing
    
    // Prevent disabling the currently selected global theme
    if (currentlyEnabled && themeKey === selected) {
      toast({
        title: "Cannot disable current theme",
        description: "You cannot disable the theme that is currently set as the global theme.",
        variant: "destructive",
      });
      return;
    }
    
    onToggleTheme?.(themeKey, !currentlyEnabled);
  }

  // Check if a theme is enabled (if no enabledThemes provided, all are enabled)
  function isThemeEnabled(themeKey: string): boolean {
    if (!enabledThemes || enabledThemes.length === 0) return true;
    return enabledThemes.includes(themeKey);
  }

  const cardSizeClasses = {
    sm: 'p-3',
    md: 'p-4', 
    lg: 'p-6'
  };

  const colorBoxSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Object.entries(COLOR_THEMES).map(([themeKey, theme]) => {
        const isSelected = selected === themeKey;
        const isEnabled = isThemeEnabled(themeKey);
        
        return (
          <Card 
            key={themeKey}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
            } ${isAdminMode && !isEnabled ? 'opacity-50' : ''}`}
            onClick={() => handleThemeSelect(themeKey, theme)}
          >
            <CardHeader className={cardSizeClasses[size]}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">{theme.name}</CardTitle>
                  {isSelected && <Check className="h-4 w-4 text-green-600" />}
                </div>
                {isAdminMode && (
                  <button
                    onClick={(e) => handleToggleTheme(e, themeKey, isEnabled)}
                    className={`p-1 rounded-md transition-colors ${
                      isEnabled 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                    title={isEnabled ? 'Theme enabled - click to disable' : 'Theme disabled - click to enable'}
                  >
                    {isEnabled ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              {showDescription && (
                <CardDescription className="text-xs">
                  {theme.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className={cardSizeClasses[size]}>
              {/* Tier 1 Colors */}
              <div className="space-y-3">
                <div>
                  <Badge variant="outline" className="text-xs mb-2">Main Categories</Badge>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(theme.tier1)
                      .filter(([category]) => category.startsWith('subcategory') || category === 'default')
                      .map(([category, color]) => {
                        // Map generic names to user-friendly display names
                        const displayName = {
                          'subcategory1': 'Category 1',
                          'subcategory2': 'Category 2', 
                          'subcategory3': 'Category 3',
                          'subcategory4': 'Category 4',
                          'subcategory5': 'Category 5',
                          'default': 'Default'
                        }[category] || category;
                        
                        return (
                          <div key={category} className="flex items-center gap-2">
                            <div 
                              className={`${colorBoxSizes[size]} rounded border`}
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {displayName}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Sample Tier 2 Colors */}
                <div>
                  <Badge variant="outline" className="text-xs mb-2">Sample Colors</Badge>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(theme.tier2)
                      .filter(([category]) => category.startsWith('tier2_'))
                      .slice(0, 6)
                      .map(([category, color]) => (
                      <div 
                        key={category}
                        className={`${colorBoxSizes[size]} rounded border`}
                        style={{ backgroundColor: color }}
                        title={`Color ${category.replace('tier2_', '')}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default ColorThemeSelector;
