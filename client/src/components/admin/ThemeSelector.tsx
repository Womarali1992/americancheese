import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  THEMES,
  ColorTheme as ThemeSystemColorTheme,
  DEFAULT_THEME
} from "@/lib/theme-system";
import { ColorTheme } from "@/lib/color-themes";

interface ThemeSelectorProps {
  onThemeSelect: (theme: ThemeSystemColorTheme) => void;
  currentTheme?: ThemeSystemColorTheme;
}

export default function ThemeSelector({ onThemeSelect, currentTheme = THEMES[DEFAULT_THEME] }: ThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeSystemColorTheme>(currentTheme);
  const [open, setOpen] = useState(false);
  
  // Update selectedTheme when currentTheme prop changes
  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);
  
  const themes = Object.values(THEMES);
  
  const handleSelectTheme = (theme: ThemeSystemColorTheme) => {
    setSelectedTheme(theme);
  };
  
  const handleApplyTheme = async () => {
    try {
      console.log("Updating theme colors comprehensively...");
      
      // Save theme key to localStorage
      const themeKey = selectedTheme.name.toLowerCase().replace(/\s+/g, '-');
      localStorage.setItem('colorTheme', themeKey);
      
      // Apply comprehensive theme colors to CSS variables
      const { applyThemeColorsToCSS } = await import('@/lib/dynamic-colors');
      // The theme is already in the correct ColorTheme format
      const convertedTheme: ColorTheme = {
        name: selectedTheme.name,
        description: selectedTheme.description,
        tier1: {
          subcategory1: selectedTheme.tier1?.subcategory1 || '#556b2f',
          subcategory2: selectedTheme.tier1?.subcategory2 || '#445566',
          subcategory3: selectedTheme.tier1?.subcategory3 || '#9b2c2c',
          subcategory4: selectedTheme.tier1?.subcategory4 || '#8b4513',
          subcategory5: selectedTheme.tier1?.subcategory5 || '#5c4033',
          default: selectedTheme.tier1?.default || '#5c4033'
        },
        tier2: {
          // Generic tier2 structure required by color-themes.ts
          tier2_1: selectedTheme.tier2?.foundation || '#92400e',
          tier2_2: selectedTheme.tier2?.framing || '#1e40af',
          tier2_3: selectedTheme.tier2?.roofing || '#dc2626',
          tier2_4: selectedTheme.tier2?.electrical || '#7c3aed',
          tier2_5: selectedTheme.tier2?.plumbing || '#0ea5e9',
          tier2_6: selectedTheme.tier2?.hvac || '#059669',
          tier2_7: selectedTheme.tier2?.barriers || '#ea580c',
          tier2_8: selectedTheme.tier2?.drywall || '#6b7280',
          tier2_9: selectedTheme.tier2?.exteriors || '#0f766e',
          tier2_10: selectedTheme.tier2?.siding || '#be123c',
          tier2_11: selectedTheme.tier2?.insulation || '#7c2d12',
          tier2_12: selectedTheme.tier2?.windows || '#4338ca',
          tier2_13: selectedTheme.tier2?.doors || '#be185d',
          tier2_14: selectedTheme.tier2?.cabinets || '#0c4a6e',
          tier2_15: selectedTheme.tier2?.fixtures || '#a16207',
          tier2_16: selectedTheme.tier2?.flooring || '#5b21b6',
          tier2_17: selectedTheme.tier2?.paint || '#f59e0b',
          tier2_18: selectedTheme.tier2?.permits || '#4b5563',
          tier2_19: selectedTheme.tier2?.other || '#6b7280',
          tier2_20: selectedTheme.tier2?.other || '#6b7280',

          // Backward compatibility - keep named properties
          foundation: selectedTheme.tier2?.foundation || '#92400e',
          framing: selectedTheme.tier2?.framing || '#1e40af',
          roofing: selectedTheme.tier2?.roofing || '#dc2626',
          lumber: selectedTheme.tier2?.fixtures || '#a16207',
          shingles: selectedTheme.tier2?.flooring || '#5b21b6',
          electrical: selectedTheme.tier2?.electrical || '#7c3aed',
          plumbing: selectedTheme.tier2?.plumbing || '#0ea5e9',
          hvac: selectedTheme.tier2?.hvac || '#059669',
          barriers: selectedTheme.tier2?.barriers || '#ea580c',
          drywall: selectedTheme.tier2?.drywall || '#6b7280',
          exteriors: selectedTheme.tier2?.exteriors || '#0f766e',
          siding: selectedTheme.tier2?.siding || '#be123c',
          insulation: selectedTheme.tier2?.insulation || '#7c2d12',
          windows: selectedTheme.tier2?.windows || '#4338ca',
          doors: selectedTheme.tier2?.doors || '#be185d',
          cabinets: selectedTheme.tier2?.cabinets || '#0c4a6e',
          fixtures: selectedTheme.tier2?.fixtures || '#a16207',
          flooring: selectedTheme.tier2?.flooring || '#5b21b6',
          paint: selectedTheme.tier2?.paint || '#f59e0b',
          permits: selectedTheme.tier2?.permits || '#4b5563',
          other: selectedTheme.tier2?.other || '#6b7280'
        }
      };
      applyThemeColorsToCSS(convertedTheme);
      
      // Update database with the new theme colors
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
      
      // Store theme globally for immediate component access
      (window as any).currentTheme = selectedTheme;

      // Dispatch custom event to notify components of theme change
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: selectedTheme }
      }));
      
      // Clear admin color cache first
      import('@/lib/admin-color-system').then(module => {
        module.clearColorCache();
        console.log('Cleared admin color cache');
      });
      
      // Trigger comprehensive UI refresh with proper cache invalidation
      import('@/lib/queryClient').then(module => {
        const { queryClient } = module;
        
        // Invalidate all relevant queries
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/template-categories'] });
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
        queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
        queryClient.invalidateQueries({ queryKey: ['/api/labor'] });
        
        // Also invalidate project-specific template categories
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey as string[];
            return key[0]?.includes('/api/projects/') && key[0]?.includes('/template-categories');
          }
        });
        
        console.log('Invalidated all caches for comprehensive theme refresh');
        
        // Force refetch of data immediately
        queryClient.refetchQueries({ queryKey: ['/api/admin/template-categories'] });
      });
      
      // Trigger custom event for components listening to theme changes
      const themeChangeEvent = new CustomEvent('themeChanged', { 
        detail: { theme: selectedTheme }
      });
      window.dispatchEvent(themeChangeEvent);
      
      // Call the parent callback
      onThemeSelect(selectedTheme);
      setOpen(false);

      // Automatically refresh the page after theme changes to ensure all components reflect the new theme
      console.log('Theme applied successfully, refreshing page to ensure complete theme update...');
      setTimeout(() => {
        window.location.reload();
      }, 500); // Small delay to allow all theme changes to complete
      
    } catch (error) {
      console.error("Error applying comprehensive theme changes:", error);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex gap-2 items-center">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentTheme.tier1?.subcategory1 || '#64748b' }}></div>
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
        
        <div className="max-h-[60vh] overflow-y-auto pr-2">
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
                      {theme.tier1 ? Object.entries(theme.tier1).map(([key, color]) => (
                        <div 
                          key={key} 
                          className="w-6 h-6 rounded-full" 
                          style={{ backgroundColor: color }}
                          title={`${key}: ${color}`}
                        ></div>
                      )) : null}
                    </div>
                    
                    {/* Tier 2 Categories Preview - just show a few samples */}
                    <div className="flex flex-wrap gap-1">
                      {theme.tier2 ? Object.entries(theme.tier2).slice(0, 10).map(([key, color]) => (
                        <div 
                          key={key} 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: color }}
                          title={`${key}: ${color}`}
                        ></div>
                      )) : null}
                    </div>
                    
                    {/* Sample tags to show how categories will look */}
                    <div className="pt-2 flex flex-wrap gap-1">
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.tier1?.subcategory1 || '#64748b' }}>
                        Category 1
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.tier1?.subcategory2 || '#64748b' }}>
                        Category 2
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.tier2?.framing || '#64748b' }}>
                        Framing
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: theme.tier2?.electrical || '#64748b' }}>
                        Electrical
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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