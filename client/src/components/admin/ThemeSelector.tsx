import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  EARTH_TONE_THEME, 
  PASTEL_THEME, 
  FUTURISTIC_THEME, 
  CLASSIC_CONSTRUCTION_THEME, 
  VIBRANT_THEME,
  ColorTheme
} from "@/lib/color-themes";
import { getTier1CategoryColor } from '@/lib/color-utils';

interface ThemeSelectorProps {
  onThemeSelect: (theme: ColorTheme) => void;
  currentTheme?: ColorTheme;
}

export default function ThemeSelector({ onThemeSelect, currentTheme = EARTH_TONE_THEME }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(currentTheme);
  const [open, setOpen] = useState(false);
  
  const themes = [
    EARTH_TONE_THEME,
    PASTEL_THEME,
    FUTURISTIC_THEME,
    CLASSIC_CONSTRUCTION_THEME,
    VIBRANT_THEME
  ];
  
  const handleSelectTheme = (theme: ColorTheme) => {
    setSelectedTheme(theme);
  };
  
  const handleApplyTheme = async () => {
    try {
      console.log("Updating theme colors in database and app...");
      
      // Save theme key to localStorage
      const themeKey = selectedTheme.name.toLowerCase().replace(/\s+/g, '-');
      localStorage.setItem('colorTheme', themeKey);
      
      // First update the database with the new theme colors
      try {
        const response = await fetch('/api/admin/update-theme-colors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tier1: selectedTheme.tier1,
            tier2: selectedTheme.tier2
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update theme colors: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log("Theme colors updated in database:", result);
      } catch (apiError) {
        console.error("Error updating theme colors in database:", apiError);
      }
      
      // Apply the theme directly to CSS variables
      document.documentElement.style.setProperty('--tier1-structural', selectedTheme.tier1.structural);
      document.documentElement.style.setProperty('--tier1-systems', selectedTheme.tier1.systems);
      document.documentElement.style.setProperty('--tier1-sheathing', selectedTheme.tier1.sheathing);
      document.documentElement.style.setProperty('--tier1-finishings', selectedTheme.tier1.finishings);
      
      // Global theme object for immediate access without page reload
      (window as any).currentTheme = selectedTheme;
      
      // Invalidate queries to refresh data
      import('@/lib/queryClient').then(module => {
        const { queryClient } = module;
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/template-categories'] });
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        console.log('Invalidated caches to refresh with new theme colors');
      });
      
      // Call the parent callback
      onThemeSelect(selectedTheme);
      setOpen(false);
      
      // Force a page reload to ensure all components get the new theme
      window.location.reload();
      
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex gap-2 items-center">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentTheme.tier1.structural }}></div>
          <span>Change Color Theme</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Select Color Theme</DialogTitle>
          <DialogDescription>
            Choose a color theme for construction categories. Changes will affect how categories are displayed throughout the application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
          {themes.map((theme) => (
            <Card 
              key={theme.name} 
              className={`cursor-pointer overflow-hidden transition-all ${
                selectedTheme.name === theme.name 
                  ? 'ring-2 ring-orange-500 shadow-lg scale-[1.02] border-orange-300 bg-orange-50' 
                  : 'hover:shadow-md hover:scale-[1.01] hover:bg-slate-50'
              }`}
              onClick={() => handleSelectTheme(theme)}
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">{theme.name}</CardTitle>
                <CardDescription className="text-xs">{theme.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-2">
                  {/* Tier 1 Categories Preview */}
                  <div className="flex gap-1">
                    {Object.entries(theme.tier1).map(([key, color]) => (
                      <div 
                        key={key} 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: color }}
                        title={`${key}: ${color}`}
                      ></div>
                    ))}
                  </div>
                  
                  {/* Tier 2 Categories Preview - just show a few samples */}
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(theme.tier2).slice(0, 10).map(([key, color]) => (
                      <div 
                        key={key} 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: color }}
                        title={`${key}: ${color}`}
                      ></div>
                    ))}
                  </div>
                  
                  {/* Sample tags to show how categories will look */}
                  <div className="pt-2 flex flex-wrap gap-1">
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.tier1.structural }}>
                      Structural
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.tier1.systems }}>
                      Systems
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.tier2.framing }}>
                      Framing
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.tier2.electrical }}>
                      Electrical
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleApplyTheme}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Apply {selectedTheme.name} Theme
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}