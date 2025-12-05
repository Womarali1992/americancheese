import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Palette, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { COLOR_THEMES } from '@/lib/color-themes';
import { apiRequest } from '@/lib/queryClient';

interface SimpleProjectThemeProps {
  projectId: number;
}

interface EnabledThemesResponse {
  enabledThemes: string[];
}

export function SimpleProjectTheme({ projectId }: SimpleProjectThemeProps) {
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    staleTime: 0, // Always refetch
    gcTime: 0 // Don't cache
  });

  // Fetch enabled themes
  const { data: enabledThemesData } = useQuery<EnabledThemesResponse>({
    queryKey: ['/api/global-settings/enabled-themes'],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentThemeKey = project?.colorTheme || 'earth-tone';
  const currentTheme = COLOR_THEMES[currentThemeKey] || COLOR_THEMES['earth-tone'];

  // Get the list of available themes (filtered by enabled themes)
  // Always include the current project's theme even if disabled
  const availableThemes = React.useMemo(() => {
    const allThemeKeys = Object.keys(COLOR_THEMES);
    
    // If no enabled themes data or empty array, show all themes
    if (!enabledThemesData || enabledThemesData.enabledThemes.length === 0) {
      return allThemeKeys;
    }
    
    // Filter to enabled themes, but always include current theme
    const enabledSet = new Set(enabledThemesData.enabledThemes);
    return allThemeKeys.filter(key => enabledSet.has(key) || key === currentThemeKey);
  }, [enabledThemesData, currentThemeKey]);

  // Update project theme mutation
  const updateTheme = useMutation({
    mutationFn: (themeKey: string) => 
      apiRequest(`/api/projects/${projectId}/theme`, 'PUT', { 
        colorTheme: themeKey,
        useGlobalTheme: false 
      }),
    onSuccess: async (response, themeKey) => {
      // Clear admin color cache to force fresh data
      try {
        const { clearColorCache } = await import('@/lib/admin-color-system');
        clearColorCache();
      } catch (error) {
        console.error('Error clearing color cache:', error);
      }
      
      // Automatically apply the theme to categories after changing theme
      try {
        const applyResult = await apiRequest(`/api/projects/${projectId}/apply-theme`, 'POST', { 
          themeName: themeKey 
        });
        
        // Force refetch immediately - invalidate all related queries
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/template-categories`] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/template-categories'] });
        
        // Also refetch to ensure immediate updates
        queryClient.refetchQueries({ queryKey: [`/api/projects/${projectId}/template-categories`] });
        
        toast({
          title: "Theme Applied",
          description: `Theme updated and applied to ${applyResult?.categoriesUpdated || 0} categories.`
        });
      } catch (error) {
        console.error('Error applying theme to categories:', error);
        toast({
          title: "Theme Updated",
          description: "Theme updated but failed to apply to categories. Try applying manually.",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Theme update failed:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update project theme. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Apply theme to categories mutation
  const applyTheme = useMutation({
    mutationFn: () => 
      apiRequest(`/api/projects/${projectId}/apply-theme`, 'POST', { themeName: currentThemeKey }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/template-categories`] });
      queryClient.refetchQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({
        title: "Theme Applied",
        description: `Updated ${data?.categoriesUpdated || 0} categories with the new theme colors.`
      });
    },
    onError: () => {
      toast({
        title: "Apply Failed",
        description: "Failed to apply theme. Please try again.",
        variant: "destructive"
      });
    }
  });

  function handleThemeSelect(themeKey: string) {
    updateTheme.mutate(themeKey);
  }

  function handleApplyTheme() {
    applyTheme.mutate();
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Loading Project Theme...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Project Not Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load project settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Project Color Theme
        </CardTitle>
        <CardDescription>
          Choose a color theme for this project. Each project can have its own unique theme.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Theme Display */}
        <div className="p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium">Current Theme: {currentTheme.name}</h4>
              <p className="text-sm text-muted-foreground">{currentTheme.description}</p>
            </div>
            <Button
              onClick={handleApplyTheme}
              disabled={applyTheme.isPending}
              size="sm"
              variant="outline"
            >
              {applyTheme.isPending ? 'Applying...' : 'Apply to Categories'}
            </Button>
          </div>
          
          {/* Theme Color Preview */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Main Categories</span>
              <div className="mt-1 space-y-1">
                {Object.entries(currentTheme.tier1).map(([category, color]) => (
                  <div key={category} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs capitalize">{category}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-xs font-medium text-muted-foreground">Sample Sub-Categories</span>
              <div className="mt-1 grid grid-cols-4 gap-1">
                {Object.entries(currentTheme.tier2).slice(0, 8).map(([category, color]) => (
                  <div 
                    key={category}
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: color }}
                    title={category}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selection Grid */}
        <div>
          <h4 className="font-medium mb-3">Available Themes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableThemes.map((themeKey) => {
              const theme = COLOR_THEMES[themeKey];
              if (!theme) return null;
              
              const isSelected = currentThemeKey === themeKey;
              
              return (
                <div 
                  key={themeKey}
                  className={`cursor-pointer p-3 border rounded-lg transition-all hover:shadow-sm ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50' 
                      : 'hover:border-gray-300'
                  } ${updateTheme.isPending ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => handleThemeSelect(themeKey)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{theme.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {theme.description}
                  </p>
                  
                  {/* Mini Color Preview */}
                  <div className="flex gap-1">
                    {Object.entries(theme.tier1).map(([category, color]) => (
                      <div 
                        key={category}
                        className="w-2 h-2 rounded-sm border"
                        style={{ backgroundColor: color }}
                        title={category}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <strong>Tip:</strong> After selecting a theme, click "Apply to Categories" to update all project categories with the new colors.
        </div>
      </CardContent>
    </Card>
  );
}

export default SimpleProjectTheme;