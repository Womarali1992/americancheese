/**
 * Global Theme Settings Component
 * 
 * This component allows users to set the global color theme that will be used
 * across the entire application. Projects can either use this global theme
 * or have their own specific theme.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Palette } from "lucide-react";
import { ColorThemeSelector } from "@/components/ui/color-theme-selector";
import { COLOR_THEMES } from "@/lib/color-themes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GlobalSettings {
  id: number;
  globalColorTheme: string;
  createdAt: string;
  updatedAt: string;
}

interface EnabledThemesResponse {
  enabledThemes: string[];
}

export function GlobalThemeSettings() {
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [enabledThemes, setEnabledThemes] = useState<string[]>([]);
  const [hasEnabledThemesChanges, setHasEnabledThemesChanges] = useState(false);

  // Fetch global settings
  const { data: globalSettings, isLoading: isLoadingSettings } = useQuery<GlobalSettings>({
    queryKey: ['/api/global-settings'],
  });

  // Fetch enabled themes
  const { data: enabledThemesData, isLoading: isLoadingEnabledThemes } = useQuery<EnabledThemesResponse>({
    queryKey: ['/api/global-settings/enabled-themes'],
  });

  // Initialize states when data loads
  useEffect(() => {
    if (globalSettings?.globalColorTheme) {
      setSelectedTheme(globalSettings.globalColorTheme);
    }
  }, [globalSettings?.globalColorTheme]);

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

  // Update global settings mutation
  const updateGlobalThemeMutation = useMutation({
    mutationFn: async (themeData: { globalColorTheme: string }) => {
      return apiRequest('/api/global-settings', {
        method: 'PUT',
        body: JSON.stringify(themeData),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-settings'] });
      toast({
        title: "Global theme updated",
        description: "The application-wide theme has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error('Error updating global theme:', error);
      toast({
        title: "Error updating theme",
        description: "Failed to update the global theme. Please try again.",
        variant: "destructive",
      });
    }
  });

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

  const handleThemeSelect = (themeKey: string) => {
    setSelectedTheme(themeKey);
  };

  const handleSaveTheme = () => {
    if (!selectedTheme) {
      toast({
        title: "No theme selected",
        description: "Please select a theme before saving.",
        variant: "destructive",
      });
      return;
    }

    updateGlobalThemeMutation.mutate({
      globalColorTheme: selectedTheme
    });
  };

  const handleToggleTheme = (themeKey: string, enabled: boolean) => {
    setEnabledThemes(prev => {
      if (enabled) {
        return [...prev, themeKey];
      } else {
        return prev.filter(t => t !== themeKey);
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

  if (isLoadingSettings || isLoadingEnabledThemes) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Global Theme Settings
          </CardTitle>
          <CardDescription>
            Choose the default color theme for your entire application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTheme = globalSettings?.globalColorTheme || "Earth Tone";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Global Theme Settings
        </CardTitle>
        <CardDescription>
          Choose the default color theme for your entire application. 
          Projects can use this global theme or have their own specific theme.
          <br />
          <span className="text-xs mt-1 inline-block">
            💡 Click the eye icon on each theme to enable/disable it for project selection.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Current Global Theme: <strong>{currentTheme}</strong></Label>
          <p className="text-sm text-muted-foreground">
            This theme will be applied to all new projects and projects that use the global theme setting.
          </p>
        </div>

        <div className="space-y-4">
          <Label>Select Theme</Label>
          <ColorThemeSelector
            selectedTheme={selectedTheme}
            onThemeSelect={handleThemeSelect}
            showDescription={true}
            size="lg"
            isAdminMode={true}
            enabledThemes={enabledThemes}
            onToggleTheme={handleToggleTheme}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
          <Button
            onClick={handleSaveTheme}
            disabled={updateGlobalThemeMutation.isPending || selectedTheme === currentTheme}
          >
            {updateGlobalThemeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              'Update Global Theme'
            )}
          </Button>
          
          {hasEnabledThemesChanges && (
            <Button
              onClick={handleSaveEnabledThemes}
              variant="outline"
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
          )}
          
          {selectedTheme !== currentTheme && (
            <p className="text-sm text-muted-foreground">
              Click "Update Global Theme" to save changes.
            </p>
          )}
          
          {hasEnabledThemesChanges && selectedTheme === currentTheme && (
            <p className="text-sm text-muted-foreground">
              Click "Save Theme Availability" to save which themes are enabled.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
