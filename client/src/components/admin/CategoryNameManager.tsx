import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, RotateCcw, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

export default function CategoryNameManager() {
  const { toast } = useToast();
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(DEFAULT_CATEGORY_OPTIONS);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>("");
  const [editingDescription, setEditingDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load custom category names from localStorage on component mount
  useEffect(() => {
    loadGlobalCategoryNames();
  }, []);

  // Load global category names from localStorage
  const loadGlobalCategoryNames = () => {
    try {
      const savedCategories = localStorage.getItem('globalCategoryNames');
      if (savedCategories) {
        const parsed = JSON.parse(savedCategories);
        setCategoryOptions(parsed);
      } else {
        setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
      }
    } catch (error) {
      console.error("Failed to load global category names:", error);
      setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
    }
  };

  // Save global category names to localStorage
  const saveGlobalCategoryNames = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('globalCategoryNames', JSON.stringify(categoryOptions));
      
      // Also save to project-specific storage for existing projects
      const projectKeys = Object.keys(localStorage).filter(key => key.startsWith('categoryNames_'));
      projectKeys.forEach(key => {
        localStorage.setItem(key, JSON.stringify(categoryOptions));
      });

      toast({
        title: "Success",
        description: "Global category names saved and applied to all projects",
      });
    } catch (error) {
      console.error("Failed to save global category names:", error);
      toast({
        title: "Error",
        description: "Failed to save category names",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

    toast({
      title: "Category Updated",
      description: "Category has been updated. Remember to save changes.",
    });
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
      localStorage.removeItem('globalCategoryNames');
      
      // Remove project-specific customizations
      const projectKeys = Object.keys(localStorage).filter(key => key.startsWith('categoryNames_'));
      projectKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      toast({
        title: "Reset Complete",
        description: "All category names have been reset to defaults globally",
      });
    } catch (error) {
      console.error("Failed to reset category names:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Global Category Names
        </CardTitle>
        <CardDescription>
          Customize category names and descriptions globally. These settings will apply to all projects unless individually overridden.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Configure how categories appear across all projects
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetToDefaults}
              className="gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Defaults
            </Button>
            <Button 
              size="sm" 
              onClick={saveGlobalCategoryNames}
              disabled={isLoading}
              className="gap-1"
            >
              <Save className="h-3 w-3" />
              {isLoading ? "Saving..." : "Save All Changes"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Category editing interface */}
        <div className="space-y-4">
          {categoryOptions.map((category) => (
            <div key={category.id} className="border rounded-lg p-4 space-y-3 bg-slate-50/50">
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
                          className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          ID: {category.id}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-sm text-blue-900 mb-2">Important Notes:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Changes apply globally to all projects when saved</li>
            <li>• Individual projects can override these settings in their project-specific category management</li>
            <li>• Category IDs cannot be changed as they are used internally by the system</li>
            <li>• Resetting will remove all custom names from all projects</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}