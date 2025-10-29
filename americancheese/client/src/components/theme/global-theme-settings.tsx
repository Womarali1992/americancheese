/**
 * Global Theme Settings Component
 * 
 * This component allows users to set the global color theme that will be used
 * across the entire application. Projects can either use this global theme
 * or have their own specific theme.
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Palette } from "lucide-react";
import { ColorThemeSelector } from "@/components/ui/color-theme-selector";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GlobalSettings {
  id: number;
  globalColorTheme: string;
  createdAt: string;
  updatedAt: string;
}

export function GlobalThemeSettings() {
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<string>("");

  // Fetch global settings
  const { data: globalSettings, isLoading: isLoadingSettings } = useQuery<GlobalSettings>({
    queryKey: ['/api/global-settings'],
    onSuccess: (data) => {
      setSelectedTheme(data?.globalColorTheme || "Earth Tone");
    }
  });

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

  if (isLoadingSettings) {
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
          <Label>Select New Theme</Label>
          <ColorThemeSelector
            selectedTheme={selectedTheme}
            onThemeSelect={handleThemeSelect}
            showDescription={true}
            size="lg"
          />
        </div>

        <div className="flex items-center gap-2 pt-4">
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
          
          {selectedTheme !== currentTheme && (
            <p className="text-sm text-muted-foreground">
              Changes will be saved when you click "Update Global Theme"
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}