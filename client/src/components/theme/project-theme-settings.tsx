import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings, Palette, Globe, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@shared/schema';
import { COLOR_THEMES } from '@/lib/color-themes';
import { ColorThemeSelector } from '@/components/ui/color-theme-selector';
import { apiRequest } from '@/lib/queryClient';

interface ProjectThemeSettingsProps {
  projectId: number;
}

export function ProjectThemeSettings({ projectId }: ProjectThemeSettingsProps) {
  const { data: project, isLoading } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: () => apiRequest(`/api/projects/${projectId}`)
  });

  const [useGlobalTheme, setUseGlobalTheme] = useState(project?.useGlobalTheme ?? true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update useGlobalTheme when project data loads
  useEffect(() => {
    if (project) {
      setUseGlobalTheme(project.useGlobalTheme ?? true);
    }
  }, [project]);

  // Get global theme setting
  const { data: globalTheme } = useQuery({
    queryKey: ['/api/global-settings'],
    queryFn: () => apiRequest('/api/global-settings')
  });

  // Update project theme mutation
  const updateProjectTheme = useMutation({
    mutationFn: (data: { colorTheme?: string; useGlobalTheme?: boolean }) => 
      apiRequest(`/api/projects/${projectId}/theme`, 'PUT', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: "Theme Updated",
        description: "Project color theme has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed", 
        description: "Failed to update project theme. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Apply theme to project categories
  const applyTheme = useMutation({
    mutationFn: (themeName: string) => 
      apiRequest(`/api/projects/${projectId}/apply-theme`, 'POST', { themeName }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/template-categories`] });
      toast({
        title: "Theme Applied",
        description: `Updated ${data?.categoriesUpdated || 0} categories with the new theme colors.`
      });
    },
    onError: (error) => {
      toast({
        title: "Apply Failed",
        description: "Failed to apply theme. Please try again.",
        variant: "destructive"
      });
    }
  });

  function handleGlobalThemeToggle(enabled: boolean) {
    setUseGlobalTheme(enabled);
    const themeData = {
      useGlobalTheme: enabled,
      colorTheme: enabled ? null : (project.colorTheme || 'Earth Tone')
    };
    updateProjectTheme.mutate(themeData);
  }

  function handleThemeSelect(themeKey: string) {
    setUseGlobalTheme(false);
    updateProjectTheme.mutate({ 
      colorTheme: themeKey,
      useGlobalTheme: false 
    });
  }

  function handleApplyTheme() {
    const themeToApply = useGlobalTheme 
      ? (globalTheme?.globalColorTheme || 'Earth Tone')
      : (project.colorTheme || 'Earth Tone');
    
    applyTheme.mutate(themeToApply);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Loading Project Theme Settings...
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

  const currentTheme = useGlobalTheme 
    ? (globalTheme?.globalColorTheme || 'Earth Tone')
    : (project.colorTheme || 'Earth Tone');

  const currentThemeObject = COLOR_THEMES[currentTheme];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Color Theme Settings
        </CardTitle>
        <CardDescription>
          Customize the color theme for this project or use the global theme.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Global Theme Toggle */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="global-theme" className="font-medium">
              Use Global Theme
            </Label>
          </div>
          <Switch
            id="global-theme"
            checked={useGlobalTheme}
            onCheckedChange={handleGlobalThemeToggle}
            disabled={updateProjectTheme.isPending}
          />
        </div>

        {useGlobalTheme && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Using Global Theme</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              This project is using the global theme: <strong>{currentThemeObject?.name}</strong>
            </p>
            {currentThemeObject && (
              <div className="flex gap-2">
                {Object.entries(currentThemeObject.tier1).map(([category, color]) => (
                  <div key={category} className="flex items-center gap-1">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs capitalize">{category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Project-Specific Theme Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Label className="font-medium">
              Project-Specific Theme
            </Label>
          </div>
          
          {!useGlobalTheme && (
            <ColorThemeSelector
              selectedTheme={currentTheme}
              onThemeSelect={handleThemeSelect}
              size="sm"
              showDescription={false}
            />
          )}
          
          {useGlobalTheme && (
            <p className="text-sm text-muted-foreground">
              Turn off "Use Global Theme" to select a custom theme for this project.
            </p>
          )}
        </div>

        {/* Apply Theme Button */}
        <div className="flex items-center gap-2 pt-4">
          <Button
            onClick={handleApplyTheme}
            disabled={applyTheme.isPending}
            variant="outline"
            size="sm"
          >
            {applyTheme.isPending ? (
              <>
                <Settings className="h-4 w-4 animate-spin mr-2" />
                Applying...
              </>
            ) : (
              <>
                <Palette className="h-4 w-4 mr-2" />
                Apply Theme to Categories
              </>
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Apply the current theme colors to all project categories
          </p>
        </div>

        {/* Current Theme Info */}
        {currentThemeObject && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Current Theme: {currentThemeObject.name}</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {currentThemeObject.description}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground">Tier 1 Categories</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(currentThemeObject.tier1).map(([category, color]) => (
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
                <span className="text-xs font-medium text-muted-foreground">Sample Tier 2</span>
                <div className="mt-1 grid grid-cols-4 gap-1">
                  {Object.entries(currentThemeObject.tier2).slice(0, 8).map(([category, color]) => (
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
        )}
      </CardContent>
    </Card>
  );
}

export default ProjectThemeSettings;