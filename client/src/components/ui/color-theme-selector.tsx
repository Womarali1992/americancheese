import React from 'react';
import { Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { COLOR_THEMES, ColorTheme } from '@/lib/color-themes';
import { useTheme } from '@/components/ThemeProvider';

interface ColorThemeSelectorProps {
  onThemeSelect?: (themeKey: string, theme: ColorTheme) => void;
  selectedTheme?: string;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ColorThemeSelector({
  onThemeSelect,
  selectedTheme,
  showDescription = true,
  size = 'md',
  className = ''
}: ColorThemeSelectorProps) {
  const { currentTheme, setTheme } = useTheme();
  const selected = selectedTheme || getThemeKey(currentTheme);

  function getThemeKey(theme: ColorTheme): string {
    return Object.entries(COLOR_THEMES).find(([_, t]) => t.name === theme.name)?.[0] || 'earth-tone';
  }

  function handleThemeSelect(themeKey: string, theme: ColorTheme) {
    if (onThemeSelect) {
      onThemeSelect(themeKey, theme);
    } else {
      setTheme(theme);
    }
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
        
        return (
          <Card 
            key={themeKey}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
            }`}
            onClick={() => handleThemeSelect(themeKey, theme)}
          >
            <CardHeader className={cardSizeClasses[size]}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">{theme.name}</CardTitle>
                  {isSelected && <Check className="h-4 w-4 text-green-600" />}
                </div>
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
                  <Badge variant="outline" className="text-xs mb-2">Tier 1 Categories</Badge>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(theme.tier1).map(([category, color]) => (
                      <div key={category} className="flex items-center gap-2">
                        <div 
                          className={`${colorBoxSizes[size]} rounded border`}
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-muted-foreground capitalize">
                          {category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Tier 2 Colors */}
                <div>
                  <Badge variant="outline" className="text-xs mb-2">Sample Tier 2</Badge>
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(theme.tier2).slice(0, 6).map(([category, color]) => (
                      <div 
                        key={category}
                        className={`${colorBoxSizes[size]} rounded border`}
                        style={{ backgroundColor: color }}
                        title={category}
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