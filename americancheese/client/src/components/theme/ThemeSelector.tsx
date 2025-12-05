/**
 * Simplified Theme Selector
 * 
 * A clean, simple theme selection component that works for both global and project themes.
 * Includes admin mode for enabling/disabling themes for project selection.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check, Globe, FolderOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { COLOR_THEMES } from '@/lib/color-themes';

interface ThemeSelectorProps {
  projectId?: number;
  title?: string;
  description?: string;
}

interface EnabledThemesResponse {
  enabledThemes: string[];
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
  const [enabledThemes, setEnabledThemes] = useState<string[]>([]);
  const [hasEnabledThemesChanges, setHasEnabledThemesChanges] = useState(false);

  // Only show admin mode (eye icons) when this is a global theme selector (no projectId)
  const isAdminMode = !projectId;

  // Fetch enabled themes
  const { data: enabledThemesData } = useQuery<EnabledThemesResponse>({
    queryKey: ['/api/global-settings/enabled-themes'],
    enabled: isAdminMode,
  });

  // Initialize enabled themes when data loads
  useEffect(() => {
    if (enabledThemesData) {
      // Empty array means all themes are enabled
      if (enabledThemesData.enabledThemes.length === 0) {
        setEnabledThemes(Object.keys(COLOR_THEMES));
      } else {
        setEnabledThemes(enabledThemesData.enabledThemes);
      }
    }
  }, [enabledThemesData]);

  // Update enabled themes mutation
  const updateEnabledThemesMutation = useMutation({
    mutationFn: async (themes: string[]) => {
      return apiRequest('/api/global-settings/enabled-themes', {
        method: 'PUT',
        body: JSON.stringify({ enabledThemes: themes }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-settings/enabled-themes'] });
      setHasEnabledThemesChanges(false);
      toast({
        title: "Theme availability updated",
        description: "Project theme options have been updated.",
      });
    },
    onError: (error) => {
      console.error('Error updating enabled themes:', error);
      toast({
        title: "Error updating theme availability",
        description: "Failed to update theme availability. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleToggleTheme = (e: React.MouseEvent, themeKey: string, currentlyEnabled: boolean) => {
    e.stopPropagation(); // Prevent card click from firing

    // Get current theme key
    const currentThemeKey = Object.entries(COLOR_THEMES)
      .find(([_, theme]) => theme.name === currentTheme.name)?.[0];
    
    // Prevent disabling the currently selected global theme
    if (currentlyEnabled && themeKey === currentThemeKey) {
      toast({
        title: "Cannot disable current theme",
        description: "You cannot disable the theme that is currently set as the global theme.",
        variant: "destructive",
      });
      return;
    }

    setEnabledThemes(prev => {
      // If prev is empty, initialize with all themes first
      const currentThemes = prev.length === 0 ? Object.keys(COLOR_THEMES) : prev;
      
      if (!currentlyEnabled) {
        // Theme is currently disabled, enable it
        return [...currentThemes, themeKey];
      } else {
        // Theme is currently enabled, disable it
        return currentThemes.filter(t => t !== themeKey);
      }
    });
    setHasEnabledThemesChanges(true);
  };

  const handleSaveEnabledThemes = () => {
    // If all themes are enabled, save as empty array (default)
    const allThemeKeys = Object.keys(COLOR_THEMES);
    const themesToSave = enabledThemes.length === allThemeKeys.length ? [] : enabledThemes;
    updateEnabledThemesMutation.mutate(themesToSave);
  };

  const isThemeEnabled = (themeKey: string): boolean => {
    if (!isAdminMode || enabledThemes.length === 0) return true;
    return enabledThemes.includes(themeKey);
  };

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
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Available Themes</h4>
            {isAdminMode && (
              <span className="text-xs text-muted-foreground">
                💡 Click the eye icon to enable/disable themes for project selection
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(availableThemes).map(([themeKey, theme]) => {
              const isSelected = currentTheme.name === theme.name;
              const isEnabled = isThemeEnabled(themeKey);
              
              return (
                <div 
                  key={themeKey}
                  className={`cursor-pointer p-4 border rounded-lg transition-all hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50' 
                      : 'hover:border-gray-300'
                  } ${isUpdating ? 'opacity-50 pointer-events-none' : ''} ${
                    isAdminMode && !isEnabled ? 'opacity-50' : ''
                  }`}
                  onClick={() => handleThemeSelect(themeKey)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{theme.name}</span>
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                      {isAdminMode && (
                        <button
                          onClick={(e) => handleToggleTheme(e, themeKey, isEnabled)}
                          className={`p-1 rounded-md transition-colors ${
                            isEnabled 
                              ? 'text-green-600 hover:bg-green-100' 
                              : 'text-muted-foreground hover:bg-muted'
                          }`}
                          title={isEnabled ? 'Theme enabled for projects - click to disable' : 'Theme disabled for projects - click to enable'}
                        >
                          {isEnabled ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
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
          
          {/* Save Theme Availability Button */}
          {isAdminMode && hasEnabledThemesChanges && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={handleSaveEnabledThemes}
                disabled={updateEnabledThemesMutation.isPending}
              >
                {updateEnabledThemesMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Theme Availability'
                )}
              </Button>
              <span className="ml-3 text-sm text-muted-foreground">
                You have unsaved changes to theme availability.
              </span>
            </div>
          )}
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