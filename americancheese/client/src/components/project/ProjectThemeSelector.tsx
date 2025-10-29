import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PROJECT_THEMES, getProjectTheme, applyProjectTheme, type ProjectTheme } from "@/lib/project-themes";
import { Palette, Check, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; 
import { useQueryClient } from "@tanstack/react-query";

interface ProjectThemeSelectorProps {
  projectId: number;
  currentTheme?: string;
  onThemeChange?: (theme: string) => void;
}

export function ProjectThemeSelector({ projectId, currentTheme, onThemeChange }: ProjectThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme || PROJECT_THEMES[0].name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastAppliedTheme, setLastAppliedTheme] = useState<string>(currentTheme || PROJECT_THEMES[0].name);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only apply theme when it's different from the last applied theme
    if (selectedTheme !== lastAppliedTheme) {
      const theme = getProjectTheme(selectedTheme, projectId);
      applyProjectTheme(theme, projectId);
      setLastAppliedTheme(selectedTheme);
    }
  }, [selectedTheme, lastAppliedTheme, projectId]);

  // Update selected theme when currentTheme prop changes
  useEffect(() => {
    if (currentTheme && currentTheme !== selectedTheme) {
      setSelectedTheme(currentTheme);
    }
  }, [currentTheme]);

  const handleThemeSelect = async (themeName: string) => {
    if (isUpdating || themeName === selectedTheme) return;
    
    setIsUpdating(true);
    
    try {
      // Apply theme immediately for visual feedback
      const theme = getProjectTheme(themeName, projectId);
      applyProjectTheme(theme, projectId);
      setSelectedTheme(themeName);
      
      // Save to backend
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorTheme: themeName })
      });
      
      if (response.ok) {
        const updatedProject = await response.json();
        
        // Invalidate and update project cache
        queryClient.setQueryData(['/api/projects', projectId], updatedProject);
        queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        
        // Call callback
        onThemeChange?.(themeName);
        setLastAppliedTheme(themeName);
        
        toast({
          title: "Theme updated",
          description: `Project theme changed to ${themeName}`,
        });
      } else {
        throw new Error(`Failed to update theme: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update theme:', error);
      
      // Revert theme on error
      const revertTheme = getProjectTheme(lastAppliedTheme, projectId);
      applyProjectTheme(revertTheme, projectId);
      setSelectedTheme(lastAppliedTheme);
      
      toast({
        title: "Failed to update theme",
        description: "There was an error updating the project theme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Project Theme
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 overflow-y-auto overflow-x-hidden w-full space-y-6">
        <div className="p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium flex items-center gap-2">Current: {selectedTheme}</h4>
              <p className="text-sm text-muted-foreground">
                {PROJECT_THEMES.find(t => t.name === selectedTheme)?.description}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Main Categories</span>
              <div className="mt-2 grid grid-cols-5 gap-2">
                <div className="text-center">
                  <div 
                    className="w-6 h-6 rounded mx-auto border-2 border-gray-300" 
                    title="subcategory-one" 
                    style={{ backgroundColor: PROJECT_THEMES.find(t => t.name === selectedTheme)?.primary }}
                  />
                  <span className="text-xs mt-1 capitalize block truncate">subcategory-one</span>
                </div>
                <div className="text-center">
                  <div 
                    className="w-6 h-6 rounded mx-auto border-2 border-gray-300" 
                    title="subcategory-two" 
                    style={{ backgroundColor: PROJECT_THEMES.find(t => t.name === selectedTheme)?.secondary }}
                  />
                  <span className="text-xs mt-1 capitalize block truncate">subcategory-two</span>
                </div>
                <div className="text-center">
                  <div 
                    className="w-6 h-6 rounded mx-auto border-2 border-gray-300" 
                    title="subcategory-three" 
                    style={{ backgroundColor: PROJECT_THEMES.find(t => t.name === selectedTheme)?.accent }}
                  />
                  <span className="text-xs mt-1 capitalize block truncate">subcategory-three</span>
                </div>
                <div className="text-center">
                  <div 
                    className="w-6 h-6 rounded mx-auto border-2 border-gray-300" 
                    title="subcategory-four" 
                    style={{ backgroundColor: PROJECT_THEMES.find(t => t.name === selectedTheme)?.muted }}
                  />
                  <span className="text-xs mt-1 capitalize block truncate">subcategory-four</span>
                </div>
                <div className="text-center">
                  <div 
                    className="w-6 h-6 rounded mx-auto border-2 border-gray-300" 
                    title="permitting" 
                    style={{ backgroundColor: PROJECT_THEMES.find(t => t.name === selectedTheme)?.border }}
                  />
                  <span className="text-xs mt-1 capitalize block truncate">permitting</span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Sub-Categories (Sample)</span>
              <div className="mt-2 grid grid-cols-6 gap-1">
                {PROJECT_THEMES.find(t => t.name === selectedTheme)?.subcategories?.slice(0, 12).map((color, index) => (
                  <div 
                    key={index}
                    className="w-4 h-4 rounded border border-gray-300" 
                    title={`category-${index}`}
                    style={{ backgroundColor: color }}
                  />
                )) || Array(12).fill(0).map((_, index) => (
                  <div 
                    key={index}
                    className="w-4 h-4 rounded border border-gray-300 bg-gray-200"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Available Themes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROJECT_THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.name;
              const isCurrentTheme = currentTheme === theme.name;
              
              return (
                <div 
                  key={theme.name}
                  className={`cursor-pointer p-4 border rounded-lg transition-all hover:shadow-md hover:border-gray-300 ${
                    isSelected ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleThemeSelect(theme.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{theme.name}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{theme.description}</p>
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      <div 
                        className="flex-1 h-3 rounded-sm border" 
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div 
                        className="flex-1 h-3 rounded-sm border" 
                        style={{ backgroundColor: theme.secondary }}
                      />
                      <div 
                        className="flex-1 h-3 rounded-sm border" 
                        style={{ backgroundColor: theme.accent }}
                      />
                      <div 
                        className="flex-1 h-3 rounded-sm border" 
                        style={{ backgroundColor: theme.muted }}
                      />
                      <div 
                        className="flex-1 h-3 rounded-sm border" 
                        style={{ backgroundColor: theme.border }}
                      />
                    </div>
                    <div className="flex gap-1">
                      {theme.subcategories?.slice(0, 8).map((color, index) => (
                        <div 
                          key={index}
                          className="flex-1 h-2 rounded-sm border" 
                          style={{ backgroundColor: color }}
                        />
                      )) || Array(8).fill(0).map((_, index) => (
                        <div 
                          key={index}
                          className="flex-1 h-2 rounded-sm border bg-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}