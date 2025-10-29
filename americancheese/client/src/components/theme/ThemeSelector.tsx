/**
 * Simplified Theme Selector
 * 
 * A clean, simple theme selection component that works for both global and project themes.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check, Globe, FolderOpen } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';

interface ThemeSelectorProps {
  projectId?: number;
  title?: string;
  description?: string;
}

export function ThemeSelector({ 
  projectId, 
  title = projectId ? 'Project Theme' : 'Global Theme',
  description = projectId ? 'Set a custom theme for this project' : 'Set the global theme for all projects'
}: ThemeSelectorProps) {
  const { 
    currentTheme, 
    availableThemes, 
    updateGlobalTheme, 
    updateProjectTheme, 
    isUpdating,
    isProjectSpecific 
  } = useTheme(projectId);
  
  const { toast } = useToast();

  const handleThemeSelect = async (themeKey: string) => {
    try {
      if (projectId) {
        await updateProjectTheme({
          projectId,
          themeKey,
          useGlobalTheme: false
        });
        
        toast({
          title: "Project Theme Updated",
          description: `Updated to ${availableThemes[themeKey].name} theme.`
        });
      } else {
        updateGlobalTheme(themeKey);
        
        toast({
          title: "Global Theme Updated",
          description: `Updated to ${availableThemes[themeKey].name} theme.`
        });
      }
      
    } catch (error) {
      toast({
        title: "Update Failed",
        description: `Failed to update theme. Error: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleUseGlobalTheme = async () => {
    if (!projectId) return;
    
    try {
      await updateProjectTheme({
        projectId,
        themeKey: null,
        useGlobalTheme: true
      });
      
      toast({
        title: "Using Global Theme",
        description: "Project will now use the global theme."
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update theme setting. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Theme Display */}
        <div className="p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                Current: {currentTheme.name}
                {projectId && (
                  isProjectSpecific ? (
                    <FolderOpen className="h-4 w-4 text-blue-600" title="Project-specific theme" />
                  ) : (
                    <Globe className="h-4 w-4 text-gray-500" title="Using global theme" />
                  )
                )}
              </h4>
              <p className="text-sm text-muted-foreground">{currentTheme.description}</p>
            </div>
            
            {projectId && isProjectSpecific && (
              <Button
                onClick={handleUseGlobalTheme}
                disabled={isUpdating}
                size="sm"
                variant="outline"
              >
                Use Global Theme
              </Button>
            )}
          </div>
          
          {/* Current Theme Preview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Main Categories</span>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {Object.entries(currentTheme.tier1).map(([category, color]) => (
                  <div key={category} className="text-center">
                    <div 
                      className="w-6 h-6 rounded mx-auto border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                      title={category}
                    />
                    <span className="text-xs mt-1 capitalize block truncate">{category}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-xs font-medium text-muted-foreground">Sub-Categories (Sample)</span>
              <div className="mt-2 grid grid-cols-6 gap-1">
                {Object.entries(currentTheme.tier2).slice(0, 12).map(([category, color]) => (
                  <div 
                    key={category}
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                    title={category}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <h4 className="font-medium mb-3">Available Themes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(availableThemes).map(([themeKey, theme]) => {
              const isSelected = currentTheme.name === theme.name;
              
              return (
                <div 
                  key={themeKey}
                  className={`cursor-pointer p-4 border rounded-lg transition-all hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50' 
                      : 'hover:border-gray-300'
                  } ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => handleThemeSelect(themeKey)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{theme.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {theme.description}
                  </p>
                  
                  {/* Theme Preview */}
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {Object.values(theme.tier1).map((color, index) => (
                        <div 
                          key={index}
                          className="flex-1 h-3 rounded-sm border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {Object.values(theme.tier2).slice(0, 8).map((color, index) => (
                        <div 
                          key={index}
                          className="flex-1 h-2 rounded-sm border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {projectId && (
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <strong>Project Theme:</strong> When set, this project will use its own theme instead of the global theme.
            Use "Use Global Theme" to inherit from the global setting.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ThemeSelector;