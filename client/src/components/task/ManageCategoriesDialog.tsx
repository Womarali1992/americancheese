import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/types";
import { Separator } from "@/components/ui/separator";
import ThemeSelector from "@/components/admin/ThemeSelector";
import { ColorTheme, EARTH_TONE_THEME } from "@/lib/color-themes";
import { Pencil, Save, X } from "lucide-react";

// Define the default category options
const DEFAULT_CATEGORY_OPTIONS = [
  { id: "structural", label: "Structural", description: "Foundation, framing, and structural elements" },
  { id: "systems", label: "Systems", description: "Plumbing, electrical, HVAC" },
  { id: "sheathing", label: "Sheathing", description: "Siding, insulation, drywall" },
  { id: "finishings", label: "Finishings", description: "Cabinetry, trim, flooring, painting" }
];

interface CategoryOption {
  id: string;
  label: string;
  description: string;
}

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  projectName: string;
}

export function ManageCategoriesDialog({ open, onOpenChange, projectId, projectName }: ManageCategoriesDialogProps) {
  const { toast } = useToast();
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("visibility");
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(EARTH_TONE_THEME);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(DEFAULT_CATEGORY_OPTIONS);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>("");
  const [editingDescription, setEditingDescription] = useState<string>("");

  // Fetch current project settings when dialog opens
  useEffect(() => {
    if (open && projectId) {
      fetchProjectSettings();
      loadCustomCategoryNames();
    }
  }, [open, projectId]);

  // Load custom category names from localStorage
  const loadCustomCategoryNames = () => {
    try {
      const savedCategories = localStorage.getItem(`categoryNames_${projectId}`);
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        setCategoryOptions(parsed);
      } else {
        setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
      }
    } catch (error) {
      console.error("Failed to load custom category names:", error);
      setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
    }
  };

  // Save custom category names to localStorage
  const saveCustomCategoryNames = () => {
    try {
      localStorage.setItem(`categoryNames_${projectId}`, JSON.stringify(categoryOptions));
      toast({
        title: "Success",
        description: "Category names saved successfully",
      });
    } catch (error) {
      console.error("Failed to save custom category names:", error);
      toast({
        title: "Error",
        description: "Failed to save category names",
        variant: "destructive",
      });
    }
  };

  // Start editing a category
  const startEditing = (categoryId: string) => {
    const category = categoryOptions.find(c => c.id === categoryId);
    if (category) {
      setEditingCategory(categoryId);
      setEditingLabel(category.label);
      setEditingDescription(category.description);
    }
  };

  // Save category edits
  const saveEditedCategory = () => {
    if (!editingCategory) return;

    setCategoryOptions(prev => 
      prev.map(cat => 
        cat.id === editingCategory 
          ? { ...cat, label: editingLabel, description: editingDescription }
          : cat
      )
    );

    setEditingCategory(null);
    setEditingLabel("");
    setEditingDescription("");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingLabel("");
    setEditingDescription("");
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
    try {
      localStorage.removeItem(`categoryNames_${projectId}`);
      toast({
        title: "Reset Complete",
        description: "Category names have been reset to defaults",
      });
    } catch (error) {
      console.error("Failed to reset category names:", error);
    }
  };

  // Fetch project's current category settings
  const fetchProjectSettings = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const project: Project = await response.json();
        setHiddenCategories(project.hiddenCategories || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load project settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching project settings:", error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  // Handle category visibility toggling
  const toggleCategory = (categoryId: string) => {
    setHiddenCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Save category preferences
  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/categories`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hiddenCategories }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Category settings updated successfully",
        });
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "tasks"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        
        onOpenChange(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "Failed to update category settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving category settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle theme change
  const handleThemeChange = (theme: ColorTheme) => {
    setSelectedTheme(theme);
    
    // Save to localStorage
    try {
      localStorage.setItem('colorTheme', theme.name.toLowerCase().replace(/\s+/g, '-'));
      
      toast({
        title: "Theme Updated",
        description: `Changed color theme to: ${theme.name}`,
      });
      
      // Reload the current page to apply the theme changes
      // This is a simple way to force the theme to be applied everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to save theme to localStorage:", error);
      toast({
        title: "Error",
        description: "Failed to save theme preferences",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Categories & Appearance</DialogTitle>
          <DialogDescription>
            Customize how categories appear in project "{projectName}".
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="visibility" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visibility">Visibility</TabsTrigger>
            <TabsTrigger value="names">Category Names</TabsTrigger>
            <TabsTrigger value="appearance">Color Themes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visibility" className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Hide or show task categories. Hidden categories will be removed from both task dashboard and project overview.
            </p>
            
            <div className="space-y-4 mt-4">
              {categoryOptions.map((category) => (
                <div key={category.id} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded-md">
                  <Checkbox 
                    id={`category-${category.id}`}
                    checked={!hiddenCategories.includes(category.id)} 
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <div className="grid gap-1">
                    <Label 
                      htmlFor={`category-${category.id}`} 
                      className="font-medium cursor-pointer"
                    >
                      {category.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="names" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Customize category names and descriptions for this project.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  Reset to Defaults
                </Button>
                <Button size="sm" onClick={saveCustomCategoryNames}>
                  Save Names
                </Button>
              </div>
            </div>
            
            <div className="space-y-4 mt-4">
              {categoryOptions.map((category) => (
                <div key={category.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {editingCategory === category.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`edit-label-${category.id}`} className="text-sm font-medium">
                              Category Name
                            </Label>
                            <Input
                              id={`edit-label-${category.id}`}
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              className="mt-1"
                              placeholder="Enter category name"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-desc-${category.id}`} className="text-sm font-medium">
                              Description
                            </Label>
                            <Input
                              id={`edit-desc-${category.id}`}
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="mt-1"
                              placeholder="Enter category description"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEditedCategory} className="gap-1">
                              <Save className="h-3 w-3" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing} className="gap-1">
                              <X className="h-3 w-3" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{category.label}</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(category.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Choose a color theme for construction categories. This will affect how categories are displayed throughout the application.
            </p>
            
            <ThemeSelector 
              onThemeSelect={handleThemeChange} 
              currentTheme={selectedTheme}
            />
            
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Preview of selected theme: {selectedTheme.name}</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedTheme.tier1).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-xs capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}