/**
 * Theme Availability Component
 * 
 * Allows admins to toggle which themes are available for project selection.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Eye, EyeOff, Palette } from "lucide-react";
import { COLOR_THEMES } from "@/lib/color-themes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EnabledThemesResponse {
  enabledThemes: string[];
}

export function ThemeAvailability() {
  const { toast } = useToast();
  const [enabledThemes, setEnabledThemes] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch enabled themes
  const { data: enabledThemesData, isLoading } = useQuery<EnabledThemesResponse>({
    queryKey: ['/api/global-settings/enabled-themes'],
  });

  // Initialize state when data loads
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
  const updateMutation = useMutation({
    mutationFn: async (themes: string[]) => {
      return apiRequest('/api/global-settings/enabled-themes', {
        method: 'PUT',
        body: JSON.stringify({ enabledThemes: themes }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/global-settings/enabled-themes'] });
      setHasChanges(false);
      toast({
        title: "Theme availability updated",
        description: "Project theme options have been saved.",
      });
    },
    onError: (error) => {
      console.error('Error updating enabled themes:', error);
      toast({
        title: "Error",
        description: "Failed to update theme availability.",
        variant: "destructive",
      });
    }
  });

  const handleToggle = (themeKey: string, enabled: boolean) => {
    setEnabledThemes(prev => {
      const currentThemes = prev.length === 0 ? Object.keys(COLOR_THEMES) : prev;
      if (enabled) {
        return [...currentThemes, themeKey];
      } else {
        // Ensure at least one theme remains enabled
        const newThemes = currentThemes.filter(t => t !== themeKey);
        if (newThemes.length === 0) {
          toast({
            title: "Cannot disable all themes",
            description: "At least one theme must remain enabled.",
            variant: "destructive",
          });
          return currentThemes;
        }
        return newThemes;
      }
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    const allThemeKeys = Object.keys(COLOR_THEMES);
    const themesToSave = enabledThemes.length === allThemeKeys.length ? [] : enabledThemes;
    updateMutation.mutate(themesToSave);
  };

  const handleEnableAll = () => {
    setEnabledThemes(Object.keys(COLOR_THEMES));
    setHasChanges(true);
  };

  const handleDisableAll = () => {
    // Keep only the first theme enabled
    setEnabledThemes([Object.keys(COLOR_THEMES)[0]]);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const allThemeKeys = Object.keys(COLOR_THEMES);
  const enabledCount = enabledThemes.length === 0 ? allThemeKeys.length : enabledThemes.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Theme Availability
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Control which themes are available when creating or editing projects.
          Disabled themes will be hidden from the theme selector.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {enabledCount} of {allThemeKeys.length} themes enabled
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEnableAll}>
            Enable All
          </Button>
          <Button variant="outline" size="sm" onClick={handleDisableAll}>
            Disable All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(COLOR_THEMES).map(([themeKey, theme]) => {
          const isEnabled = enabledThemes.length === 0 || enabledThemes.includes(themeKey);

          return (
            <div
              key={themeKey}
              className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                isEnabled ? 'bg-card' : 'bg-muted/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Color preview */}
                <div className="flex gap-0.5">
                  {Object.entries(theme.tier1).slice(0, 4).map(([category, color]) => (
                    <div
                      key={category}
                      className="w-3 h-3 rounded-sm border border-slate-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{theme.name}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {theme.description}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEnabled ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggle(themeKey, checked)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {hasChanges && (
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            You have unsaved changes.
          </span>
        </div>
      )}
    </div>
  );
}

export default ThemeAvailability;









